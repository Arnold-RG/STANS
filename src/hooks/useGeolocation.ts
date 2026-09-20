import { useCallback, useEffect, useState } from "react";
import type { LonLat } from "@/lib/live/geo";

export interface GpsFix {
  point: LonLat;
  accuracyM: number;
  heading: number | null;
  speedMs: number | null;
}

export function useGeolocation() {
  const [fix, setFix] = useState<GpsFix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError("This browser has no geolocation");
      return;
    }
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFix({
          point: { lat: pos.coords.latitude, lon: pos.coords.longitude },
          accuracyM: pos.coords.accuracy,
          heading: pos.coords.heading,
          speedMs: pos.coords.speed,
        });
        setBusy(false);
      },
      (err) => {
        setError(err.message || "Location denied");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 },
    );
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setFix({
          point: { lat: pos.coords.latitude, lon: pos.coords.longitude },
          accuracyM: pos.coords.accuracy,
          heading: pos.coords.heading,
          speedMs: pos.coords.speed,
        });
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return { fix, error, busy, locate };
}
