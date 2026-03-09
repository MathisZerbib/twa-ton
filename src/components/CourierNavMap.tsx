/**
 * CourierNavMap — Uber-Eats-style GPS navigation map for couriers.
 *
 * Displays a full interactive Mapbox map with:
 *  • Courier's live GPS position (blue pulsing dot)
 *  • Route line from courier → restaurant (during pickup phase)
 *  • Route line from restaurant → customer (during delivery phase)
 *  • ETA and distance in a floating HUD
 *  • Custom markers for restaurant (🍔) and customer (📍)
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import styled, { keyframes } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationArrow, faRoute, faClock } from "@fortawesome/free-solid-svg-icons";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string;

// ─── Types ──────────────────────────────────────────────────────────────────

export type NavPhase = "pickup" | "dropoff";

interface CourierNavMapProps {
  /** Current delivery phase */
  phase: NavPhase;
  /** Restaurant location */
  storeLat: number;
  storeLng: number;
  /** Customer location */
  deliveryLat: number;
  deliveryLng: number;
  /** Optional store name */
  storeName?: string;
  /** Optional delivery address */
  deliveryAddress?: string;
}

// ─── Styled ─────────────────────────────────────────────────────────────────

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  min-height: 260px;
  position: relative;
  border-radius: 20px;
  overflow: hidden;
`;

const pulseAnim = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(66,133,244,0.5); }
  70% { box-shadow: 0 0 0 18px rgba(66,133,244,0); }
  100% { box-shadow: 0 0 0 0 rgba(66,133,244,0); }
`;

const HUD = styled.div`
  position: absolute;
  bottom: 14px;
  left: 14px;
  right: 14px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  z-index: 5;
`;

const HUDIcon = styled.div<{ $color: string }>`
  width: 40px; height: 40px; border-radius: 12px;
  background: ${p => p.$color};
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 1rem; flex-shrink: 0;
`;

const HUDText = styled.div`flex: 1;`;
const HUDLabel = styled.div`font-size: 0.7rem; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;`;
const HUDValue = styled.div`font-size: 1.05rem; font-weight: 800; color: #1a1a1a;`;
const HUDSub = styled.div`font-size: 0.75rem; color: #666; margin-top: 1px;`;

const RecenterBtn = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  width: 40px; height: 40px;
  border-radius: 12px;
  border: none;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 10px rgba(0,0,0,0.12);
  color: #4285F4;
  font-size: 1rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  z-index: 5;
  &:active { transform: scale(0.92); }
`;

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchRoute(
  start: [number, number],
  end: [number, number]
): Promise<{ geometry: GeoJSON.LineString; duration: number; distance: number } | null> {
  try {
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
    );
    const data = await res.json();
    if (!data.routes || data.routes.length === 0) return null;
    const r = data.routes[0];
    return { geometry: r.geometry, duration: r.duration, distance: r.distance };
  } catch {
    return null;
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return "< 1 min";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function createPulsingDot(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = "18px";
  el.style.height = "18px";
  el.style.borderRadius = "50%";
  el.style.background = "#4285F4";
  el.style.border = "3px solid #fff";
  el.style.boxShadow = "0 0 0 0 rgba(66,133,244,0.5)";
  el.style.animation = "courierPulse 2s ease-in-out infinite";
  return el;
}

function createLabelMarker(emoji: string, label: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.display = "flex";
  el.style.flexDirection = "column";
  el.style.alignItems = "center";
  el.style.gap = "2px";

  const icon = document.createElement("div");
  icon.style.width = "36px";
  icon.style.height = "36px";
  icon.style.borderRadius = "50%";
  icon.style.background = "#fff";
  icon.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
  icon.style.display = "flex";
  icon.style.alignItems = "center";
  icon.style.justifyContent = "center";
  icon.style.fontSize = "18px";
  icon.textContent = emoji;

  const lbl = document.createElement("div");
  lbl.style.background = "rgba(0,0,0,0.7)";
  lbl.style.color = "#fff";
  lbl.style.fontSize = "10px";
  lbl.style.fontWeight = "700";
  lbl.style.padding = "2px 6px";
  lbl.style.borderRadius = "6px";
  lbl.style.whiteSpace = "nowrap";
  lbl.textContent = label;

  el.appendChild(icon);
  el.appendChild(lbl);
  return el;
}

// ─── Component ──────────────────────────────────────────────────────────────

const CourierNavMap: React.FC<CourierNavMapProps> = ({
  phase,
  storeLat,
  storeLng,
  deliveryLat,
  deliveryLng,
  storeName,
  deliveryAddress,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const courierMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const storeMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const dropoffMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const courierPosRef = useRef<{ lng: number; lat: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [eta, setEta] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [routeLoaded, setRouteLoaded] = useState(false);

  // ── Determine destination based on phase ───────────────────────────────
  const destLng = phase === "pickup" ? storeLng : deliveryLng;
  const destLat = phase === "pickup" ? storeLat : deliveryLat;
  const destLabel = phase === "pickup" ? (storeName ?? "Restaurant") : (deliveryAddress ?? "Customer");

  // ── Draw / update route ────────────────────────────────────────────────
  const updateRoute = useCallback(async (map: mapboxgl.Map, from: [number, number], to: [number, number]) => {
    const result = await fetchRoute(from, to);
    if (!result) return;

    setEta(formatDuration(result.duration));
    setDistance(formatDistance(result.distance));

    const geojsonData: GeoJSON.Feature = {
      type: "Feature",
      properties: {},
      geometry: result.geometry,
    };

    const src = map.getSource("courier-route") as mapboxgl.GeoJSONSource | undefined;
    if (src) {
      src.setData(geojsonData);
    } else {
      map.addSource("courier-route", { type: "geojson", data: geojsonData });
      map.addLayer({
        id: "courier-route-line",
        type: "line",
        source: "courier-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": phase === "pickup" ? "#FF6B35" : "#4caf50",
          "line-width": 5,
          "line-opacity": 0.85,
        },
      });
      // dashed outline
      map.addLayer({
        id: "courier-route-outline",
        type: "line",
        source: "courier-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": phase === "pickup" ? "#e65100" : "#2e7d32",
          "line-width": 8,
          "line-opacity": 0.25,
        },
      }, "courier-route-line");
    }

    setRouteLoaded(true);
  }, [phase]);

  // ── Initialize map ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Inject pulsing keyframe once
    if (!document.getElementById("courier-pulse-style")) {
      const style = document.createElement("style");
      style.id = "courier-pulse-style";
      style.textContent = `@keyframes courierPulse{0%{box-shadow:0 0 0 0 rgba(66,133,244,0.5)}70%{box-shadow:0 0 0 18px rgba(66,133,244,0)}100%{box-shadow:0 0 0 0 rgba(66,133,244,0)}}`;
      document.head.appendChild(style);
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [storeLng, storeLat],
      zoom: 14,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      // Store marker
      const storeEl = createLabelMarker("🍔", storeName ?? "Restaurant");
      storeMarkerRef.current = new mapboxgl.Marker({ element: storeEl })
        .setLngLat([storeLng, storeLat])
        .addTo(map);

      // Customer marker
      const dropEl = createLabelMarker("📍", "Customer");
      dropoffMarkerRef.current = new mapboxgl.Marker({ element: dropEl })
        .setLngLat([deliveryLng, deliveryLat])
        .addTo(map);

      // Start watching GPS
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const lng = pos.coords.longitude;
            const lat = pos.coords.latitude;
            courierPosRef.current = { lng, lat };

            // Courier marker
            if (!courierMarkerRef.current) {
              const dot = createPulsingDot();
              courierMarkerRef.current = new mapboxgl.Marker({ element: dot })
                .setLngLat([lng, lat])
                .addTo(map);
            } else {
              courierMarkerRef.current.setLngLat([lng, lat]);
            }

            // Draw route from courier to current destination
            updateRoute(map, [lng, lat], [destLng, destLat]);
          },
          (err) => console.warn("GPS error:", err),
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
      }

      // Fit bounds to show whole route
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([storeLng, storeLat]);
      bounds.extend([deliveryLng, deliveryLat]);
      map.fitBounds(bounds, { padding: 70, maxZoom: 15 });
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      map.remove();
      mapRef.current = null;
      courierMarkerRef.current = null;
      storeMarkerRef.current = null;
      dropoffMarkerRef.current = null;
    };
  }, []); // mount once

  // ── Re-draw route when phase changes (pickup → dropoff) ────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;

    // Remove old route layers/source so they get re-created with new color
    if (map.getLayer("courier-route-line")) map.removeLayer("courier-route-line");
    if (map.getLayer("courier-route-outline")) map.removeLayer("courier-route-outline");
    if (map.getSource("courier-route")) map.removeSource("courier-route");
    setRouteLoaded(false);

    // Redraw with current courier pos
    const cp = courierPosRef.current;
    if (cp) {
      updateRoute(map, [cp.lng, cp.lat], [destLng, destLat]);
    }

    // highlight current destination marker
    if (phase === "dropoff" && dropoffMarkerRef.current) {
      // Fit to courier + delivery
      const bounds = new mapboxgl.LngLatBounds();
      if (cp) bounds.extend([cp.lng, cp.lat]);
      bounds.extend([deliveryLng, deliveryLat]);
      map.fitBounds(bounds, { padding: 70, maxZoom: 15 });
    }
  }, [phase, destLng, destLat, updateRoute, deliveryLng, deliveryLat]);

  // ── Recenter ──────────────────────────────────────────────────────────
  const handleRecenter = () => {
    const map = mapRef.current;
    if (!map) return;
    const cp = courierPosRef.current;
    if (cp) {
      map.flyTo({ center: [cp.lng, cp.lat], zoom: 15, duration: 800 });
    }
  };

  return (
    <MapContainer>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
      <RecenterBtn onClick={handleRecenter} title="Recenter on me">
        <FontAwesomeIcon icon={faLocationArrow} />
      </RecenterBtn>
      {routeLoaded && (
        <HUD>
          <HUDIcon $color={phase === "pickup" ? "#FF6B35" : "#4caf50"}>
            <FontAwesomeIcon icon={phase === "pickup" ? faRoute : faLocationArrow} />
          </HUDIcon>
          <HUDText>
            <HUDLabel>{phase === "pickup" ? "Navigate to restaurant" : "Navigate to customer"}</HUDLabel>
            <HUDValue>{eta ?? "..."}</HUDValue>
            <HUDSub>{distance ? `${distance} · ${destLabel}` : destLabel}</HUDSub>
          </HUDText>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <FontAwesomeIcon icon={faClock} style={{ color: "#bbb", fontSize: "0.85rem" }} />
            <div style={{ fontSize: "0.65rem", color: "#aaa", marginTop: 2 }}>ETA</div>
          </div>
        </HUD>
      )}
    </MapContainer>
  );
};

export default CourierNavMap;
