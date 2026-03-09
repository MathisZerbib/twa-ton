import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string;

interface MapWithGeocoderProps {
  onSelectedAddress: (address: string, lat?: number, lng?: number) => void;
}

const MapWithGeocoder: React.FC<MapWithGeocoderProps> = ({
  onSelectedAddress,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);

  // Keep latest callback in a ref to avoid re-run of effect
  const callbackRef = useRef(onSelectedAddress);
  useEffect(() => {
    callbackRef.current = onSelectedAddress;
  }, [onSelectedAddress]);

  // ── Reverse-geocode helper (stable ref) ────────────────────────────────────
  const fetchAddress = useCallback((lngLat: { lng: number; lat: number }) => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${mapboxgl.accessToken}`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data.features && data.features.length > 0) {
          const place = data.features[0].place_name;
          setAddress(place);
          callbackRef.current(place, lngLat.lat, lngLat.lng);
        }
      })
      .catch((error) => console.error("Error fetching address:", error));
  }, []);

  // ── Geolocate me button handler ────────────────────────────────────────────
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lngLat = { lng: pos.coords.longitude, lat: pos.coords.latitude };
        const map = mapInstance.current;
        if (map) {
          map.flyTo({ center: [lngLat.lng, lngLat.lat], zoom: 16, duration: 1200 });
          markerRef.current?.setLngLat(lngLat);
          fetchAddress(lngLat);
          // update circle
          const source = map.getSource("circle") as mapboxgl.GeoJSONSource;
          if (source) {
            source.setData({
              type: "Feature",
              geometry: { type: "Point", coordinates: [lngLat.lng, lngLat.lat] },
              properties: {},
            });
          }
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [fetchAddress]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const FALLBACK_CENTER: [number, number] = [2.3522, 48.8566]; // Paris fallback

    const initMap = (center: [number, number]) => {
      if (mapInstance.current) return;

      const map = new mapboxgl.Map({
        container: mapRef.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center,
        zoom: 15,
      });

      mapInstance.current = map;

      const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken!,
        mapboxgl: mapboxgl as any,
        marker: false,
        placeholder: "Chercher une adresse",
        language: "fr",
        addressAccuracy: "street",
        types: "address,poi",
        limit: 5,
      });

      const geocoderContainer = document.createElement("div");
      geocoderContainer.className = "geocoder-container";

      const geocoderIcon = geocoder.onAdd(map);
      geocoderContainer.appendChild(geocoderIcon);
      map.getContainer().appendChild(geocoderContainer);

      const marker = new mapboxgl.Marker({
        draggable: true,
        color: "#FF6B35",
      })
        .setLngLat(center)
        .addTo(map);

      markerRef.current = marker;

      const addCircle = (lngLat: { lng: number; lat: number }) => {
        const radiusInMeters = 1000;
        const source = map.getSource("circle") as mapboxgl.GeoJSONSource;

        if (source) {
          source.setData({
            type: "Feature",
            geometry: { type: "Point", coordinates: [lngLat.lng, lngLat.lat] },
            properties: {},
          });
        } else {
          map.addLayer({
            id: "circle",
            type: "circle",
            source: {
              type: "geojson",
              data: {
                type: "Feature",
                geometry: { type: "Point", coordinates: [lngLat.lng, lngLat.lat] },
                properties: {},
              },
            },
            paint: {
              "circle-radius": {
                stops: [[0, 0], [20, radiusInMeters / 3]],
                base: 2,
              },
              "circle-color": "#FF6B35",
              "circle-opacity": 0.15,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#FF6B35",
            },
          });
        }
      };

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        fetchAddress(lngLat);
        addCircle(lngLat);
      });

      geocoder.on("result", (event) => {
        const lngLat = event.result.geometry.coordinates as [number, number];
        const point = { lng: lngLat[0], lat: lngLat[1] };
        marker.setLngLat(point);
        map.flyTo({ center: point });
        setAddress(event.result.place_name);
        callbackRef.current(event.result.place_name, point.lat, point.lng);
        addCircle(point);
      });

      map.on("click", (event: mapboxgl.MapMouseEvent) => {
        const lngLat = event.lngLat;
        marker.setLngLat(lngLat);
        fetchAddress(lngLat);
        addCircle(lngLat);
      });

      map.on("load", () => {
        map.resize();
        addCircle(map.getCenter());
        fetchAddress(map.getCenter() as unknown as { lng: number; lat: number });
      });

      // Resize when container becomes visible (e.g. inside a drawer)
      const ro = new ResizeObserver(() => {
        map.resize();
      });
      ro.observe(mapRef.current!);
    };

    // Auto-geolocate on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => initMap([pos.coords.longitude, pos.coords.latitude]),
        () => initMap(FALLBACK_CENTER),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    } else {
      initMap(FALLBACK_CENTER);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerRef.current = null;
      }
    };
  }, []); // Run only once

  return (
    <>
      <div style={{ position: "relative", width: "100%", height: "90vh" }}>
        {/* ── Geolocate Me button ── */}
        <button
          onClick={handleGeolocate}
          disabled={locating}
          style={{
            position: "absolute",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 24px",
            background: "#FF6B35",
            color: "#fff",
            border: "none",
            borderRadius: 50,
            fontSize: "0.9rem",
            fontWeight: 700,
            cursor: locating ? "wait" : "pointer",
            boxShadow: "0 4px 16px rgba(255,107,53,0.4)",
            opacity: locating ? 0.7 : 1,
            transition: "opacity 0.2s, transform 0.15s",
          }}
        >
          {locating ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Locating…
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
              Use my location
            </>
          )}
        </button>

        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      </div>

      <style>
        {`
          .geocoder-container {
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            width: 80%;
            z-index: 1;
          }
          .mapboxgl-ctrl-geocoder {
            min-width: 100%;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default MapWithGeocoder;
