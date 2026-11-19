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

  const locate = useCallback((): Promise<GpsFix | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError("This browser has no geolocation");
        resolve(null);
        return;
      }
      setBusy(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next: GpsFix = {
            point: { lat: pos.coords.latitude, lon: pos.coords.longitude },
            accuracyM: pos.coords.accuracy,
            heading: pos.coords.heading,
            speedMs: pos.coords.speed,
          };
          setFix(next);
          setBusy(false);
          resolve(next);
        },
        (err) => {
          setError(err.message || "Location denied");
          setBusy(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 },
      );
    });
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
        setError(null);
      },
      (err) => {
        setError((prev) => prev ?? (err.message || "Location unavailable"));
      },
      { enableHighAccuracy: true, maximumAge: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return { fix, error, busy, locate };
}
