/**
 * Image validation for admin uploads.
 *
 * The browser-supplied `file.type` is attacker-controlled, so it is never
 * trusted. Instead the file signature (magic bytes) is inspected and the
 * MIME type derived from that. Anything unrecognised is rejected.
 */

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB

export type DetectedImage = {
  mimeType: string;
  width: number | null;
  height: number | null;
};

function startsWith(buf: Uint8Array, sig: number[], offset = 0): boolean {
  if (buf.length < offset + sig.length) return false;
  return sig.every((byte, i) => buf[offset + i] === byte);
}

function readUint32BE(buf: Uint8Array, offset: number): number | null {
  if (buf.length < offset + 4) return null;
  const b0 = buf[offset];
  const b1 = buf[offset + 1];
  const b2 = buf[offset + 2];
  const b3 = buf[offset + 3];
  if (b0 === undefined || b1 === undefined || b2 === undefined || b3 === undefined) return null;
  return ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0;
}

function readUint16LE(buf: Uint8Array, offset: number): number | null {
  if (buf.length < offset + 2) return null;
  const b0 = buf[offset];
  const b1 = buf[offset + 1];
  if (b0 === undefined || b1 === undefined) return null;
  return b0 | (b1 << 8);
}

function readUint16BE(buf: Uint8Array, offset: number): number | null {
  if (buf.length < offset + 2) return null;
  const b0 = buf[offset];
  const b1 = buf[offset + 1];
  if (b0 === undefined || b1 === undefined) return null;
  return (b0 << 8) | b1;
}

/** PNG: 8-byte signature, then IHDR with width/height at bytes 16..24. */
function detectPng(buf: Uint8Array): DetectedImage | null {
  if (!startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return null;
  return {
    mimeType: "image/png",
    width: readUint32BE(buf, 16),
    height: readUint32BE(buf, 20),
  };
}

/** JPEG: starts FF D8 FF. Dimensions live in an SOF marker we scan for. */
function detectJpeg(buf: Uint8Array): DetectedImage | null {
  if (!startsWith(buf, [0xff, 0xd8, 0xff])) return null;

  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1];
    if (marker === undefined) break;

    // SOF0-SOF3, SOF5-SOF7, SOF9-SOF11, SOF13-SOF15 carry dimensions.
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;

    if (isSof) {
      return {
        mimeType: "image/jpeg",
        height: readUint16BE(buf, offset + 5),
        width: readUint16BE(buf, offset + 7),
      };
    }

    const segmentLength = readUint16BE(buf, offset + 2);
    if (segmentLength === null || segmentLength < 2) break;
    offset += 2 + segmentLength;
  }

  return { mimeType: "image/jpeg", width: null, height: null };
}

/** WebP: "RIFF" .... "WEBP". Only the common VP8X/VP8L/VP8 headers are parsed. */
function detectWebp(buf: Uint8Array): DetectedImage | null {
  if (!startsWith(buf, [0x52, 0x49, 0x46, 0x46])) return null; // RIFF
  if (!startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)) return null; // WEBP

  const fourcc = String.fromCharCode(...buf.slice(12, 16));

  if (fourcc === "VP8X") {
    const b24 = buf[24];
    const b25 = buf[25];
    const b26 = buf[26];
    const b27 = buf[27];
    const b28 = buf[28];
    const b29 = buf[29];
    if ([b24, b25, b26, b27, b28, b29].some((v) => v === undefined)) {
      return { mimeType: "image/webp", width: null, height: null };
    }
    return {
      mimeType: "image/webp",
      width: 1 + (b24! | (b25! << 8) | (b26! << 16)),
      height: 1 + (b27! | (b28! << 8) | (b29! << 16)),
    };
  }

  if (fourcc === "VP8 ") {
    const w = readUint16LE(buf, 26);
    const h = readUint16LE(buf, 28);
    return {
      mimeType: "image/webp",
      width: w === null ? null : w & 0x3fff,
      height: h === null ? null : h & 0x3fff,
    };
  }

  return { mimeType: "image/webp", width: null, height: null };
}

/**
 * Identifies an image from its bytes. Returns null when the content is not a
 * supported image, regardless of what the client claimed the type was.
 *
 * SVG is deliberately unsupported: it can carry scripts, and serving it from
 * our own origin would create a stored-XSS vector.
 */
export function detectImage(bytes: Uint8Array): DetectedImage | null {
  return detectPng(bytes) ?? detectJpeg(bytes) ?? detectWebp(bytes);
}

export type ImageValidationResult =
  | { ok: true; detected: DetectedImage }
  | { ok: false; error: string };

export function validateImageBytes(bytes: Uint8Array): ImageValidationResult {
  if (bytes.byteLength === 0) {
    return { ok: false, error: "That file is empty." };
  }
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    const mb = (bytes.byteLength / (1024 * 1024)).toFixed(1);
    return {
      ok: false,
      error: `That image is ${mb} MB. The limit is 4 MB — try compressing it first.`,
    };
  }

  const detected = detectImage(bytes);
  if (!detected) {
    return {
      ok: false,
      error: "That doesn't look like a JPEG, PNG or WebP image. SVG files aren't accepted.",
    };
  }

  return { ok: true, detected };
}
