'use client';

import { useEffect, useRef, useState } from 'react';
import { t, type Locale } from '@/lib/i18n';

// Kuwait City as the default map centre.
const KUWAIT_CENTER = { lat: 29.3759, lng: 47.9774 };

type LatLng = { lat: number; lng: number };

declare global {
  interface Window {
    google?: typeof google;
    __initInspectMap?: () => void;
  }
}

/**
 * Loads the Google Maps JS API once and lets the admin drop/drag a pin.
 * If no API key is configured, falls back to manual lat/lng inputs so the
 * form still works.
 */
export function MapPicker({
  locale,
  initialLat,
  initialLng
}: {
  locale: Locale;
  initialLat?: number | null;
  initialLng?: number | null;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const mapObjRef = useRef<google.maps.Map | null>(null);

  const [pos, setPos] = useState<LatLng | null>(
    typeof initialLat === 'number' && typeof initialLng === 'number'
      ? { lat: initialLat, lng: initialLng }
      : null
  );
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!apiKey) return;

    function place(latLng: LatLng) {
      setPos(latLng);
      const map = mapObjRef.current;
      if (!map) return;
      if (markerRef.current) {
        markerRef.current.setPosition(latLng);
      } else {
        const marker = new window.google!.maps.Marker({
          position: latLng,
          map,
          draggable: true
        });
        marker.addListener('dragend', () => {
          const p = marker.getPosition();
          if (p) setPos({ lat: p.lat(), lng: p.lng() });
        });
        markerRef.current = marker;
      }
    }

    function initMap() {
      if (!mapRef.current || !window.google) return;
      const start = pos ?? KUWAIT_CENTER;
      const map = new window.google.maps.Map(mapRef.current, {
        center: start,
        zoom: pos ? 15 : 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });
      mapObjRef.current = map;
      if (pos) place(pos);
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) place({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      });
      setReady(true);
    }

    if (window.google?.maps) {
      initMap();
      return;
    }

    const existing = document.getElementById('gmaps-script');
    if (existing) {
      window.__initInspectMap = initMap;
      return;
    }

    window.__initInspectMap = initMap;
    const script = document.createElement('script');
    script.id = 'gmaps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&callback=__initInspectMap`;
    script.async = true;
    script.onerror = () => setFailed(true);
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  if (!apiKey || failed) {
    // Manual fallback — still fully functional.
    return (
      <div>
        <div className="alert alert-info">{t('f_pick_on_map', locale)}</div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="latitude">{t('f_lat', locale)}</label>
            <input
              id="latitude"
              name="latitude"
              inputMode="decimal"
              defaultValue={pos?.lat ?? ''}
              placeholder="29.3759"
            />
          </div>
          <div className="field">
            <label htmlFor="longitude">{t('f_lng', locale)}</label>
            <input
              id="longitude"
              name="longitude"
              inputMode="decimal"
              defaultValue={pos?.lng ?? ''}
              placeholder="47.9774"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="small muted" style={{ marginBottom: 8 }}>
        {t('f_pick_on_map', locale)}
      </p>
      <div className="map-box" ref={mapRef}>
        {!ready && <div className="map-fallback">…</div>}
      </div>
      {/* Hidden inputs carry the chosen coordinates into the form submission. */}
      <input type="hidden" name="latitude" value={pos?.lat ?? ''} />
      <input type="hidden" name="longitude" value={pos?.lng ?? ''} />
      {pos && (
        <p className="small muted mt-2">
          {t('f_lat', locale)}: {pos.lat.toFixed(6)} · {t('f_lng', locale)}: {pos.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}
