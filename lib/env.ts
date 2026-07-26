let cachedSecret: Uint8Array | null = null;

export function getJwtSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.trim().length < 32) {
    throw new Error(
      'JWT_SECRET is missing or too short. Set it to a random value of at least 32 characters.'
    );
  }
  cachedSecret = new TextEncoder().encode(raw);
  return cachedSecret;
}
