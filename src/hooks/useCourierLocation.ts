/**
 * useCourierLocation — Continuous GPS tracking hook for the courier.
 *
 * Returns the courier's current position and helpers:
 *   • distanceTo(lat, lng) → meters
 *   • etaTo(lat, lng)      → seconds (estimated at real speed or 25 km/h fallback)
 *   • formatDist / formatETA → human-readable strings
 */

import { useEffect, useState, useCallback, useRef } from "react";

export interface CourierPosition {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export function useCourierLocation() {
  const [position, setPosition] = useState<CourierPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: pos.timestamp,
        });
        setWatching(true);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setWatching(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  /** Haversine distance in meters */
  const distanceTo = useCallback(
    (lat: number, lng: number): number | null => {
      if (!position) return null;
      const R = 6371000;
      const dLat = ((lat - position.lat) * Math.PI) / 180;
      const dLng = ((lng - position.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((position.lat * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },
    [position]
  );

  /** Estimated time in seconds — uses real speed if available, else ~25 km/h fallback */
  const etaTo = useCallback(
    (lat: number, lng: number): number | null => {
      const d = distanceTo(lat, lng);
      if (d === null) return null;
      const speed =
        position?.speed && position.speed > 1 ? position.speed : 6.94; // ~25 km/h
      return d / speed;
    },
    [distanceTo, position]
  );

  return { position, error, watching, distanceTo, etaTo };
}

/** Format meters to human string */
export function formatDistance(meters: number | null): string {
  if (meters === null) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Format seconds to human string */
export function formatETA(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return "< 1 min";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

/** Open native maps app for turn-by-turn navigation */
export function openNativeNavigation(lat: number, lng: number, label?: string) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const encoded = encodeURIComponent(label ?? `${lat},${lng}`);
  if (isIOS) {
    window.open(`maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d&t=m`, "_blank");
  } else {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encoded}&travelmode=driving`,
      "_blank"
    );
  }
}
