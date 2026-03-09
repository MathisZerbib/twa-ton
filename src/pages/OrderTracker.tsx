/**
 * TON-Eats OrderTracker.tsx
 *
 * The customer's live order tracking screen — shown after successful checkout.
 * Mirrors the Uber Eats / Deliveroo tracking experience:
 *
 *   ① Preparing your order   (status: pending)
 *   ② Courier on the way     (status: accepted / picked_up)
 *   ③ Delivered!             (status: delivered)
 *
 * Features:
 *  - Real-time status updates via Socket.io
 *  - Live Mapbox map with animated courier pin
 *  - 4-digit delivery confirmation code (shown to customer)
 *  - Auto-triggers confirmDelivery() on-chain when backend emits "delivered"
 *  - ETA strip
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as turf from "@turf/turf";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faMotorcycle, faUtensils, faBoxOpen, faWifi, faXmarkCircle, faCopy, faCheck, faShareNodes, faFire, faCoins, faLink } from "@fortawesome/free-solid-svg-icons";
import { useSocket } from "../hooks/useSocket";
import { api, BackendOrder } from "../services/api";
import { useTONEatsEscrow, PROTOCOL_FEE_TON, REFERRER_CASHBACK_PERCENT } from "../hooks/useTONEatsEscrow";
import { useTonConnect } from "../hooks/useTonConnect";

const BOT_NAME = import.meta.env.VITE_BOT_NAME ?? "YourTONEatsBot";

const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "") as string;
mapboxgl.accessToken = MAPBOX_TOKEN;

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeUp = keyframes`from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}`;
const spin = keyframes`to{transform:rotate(360deg)}`;
const pulse = keyframes`0%,100%{transform:scale(1)}50%{transform:scale(1.08)}`;
const shimmer = keyframes`0%{background-position:-200%}100%{background-position:200%}`;
const bounce = keyframes`0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}`;

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  background: #f4f4f4;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

// ── Status Header ─────────────────────────────────────────────────────────────

const StatusHeader = styled.div<{ $status: string }>`
  background: ${p =>
        p.$status === 'delivered'
            ? 'linear-gradient(135deg,#2e7d32,#43a047)'
            : p.$status === 'picked_up'
                ? 'linear-gradient(135deg,#1565c0,#1976d2)'
                : p.$status === 'accepted'
                    ? 'linear-gradient(135deg,#e65100,#FF6B35)'
                    : 'linear-gradient(135deg,#1a1a2e,#16213e)'};
  color: #fff;
  padding: 20px 20px 28px;
  transition: background 0.8s ease;
`;

const StatusEmoji = styled.div`
  font-size: 2.4rem;
  margin-bottom: 8px;
  animation: ${bounce} 1.5s ease-in-out infinite;
`;

const StatusTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 900;
  margin: 0 0 4px;
`;

const StatusSubtitle = styled.p`
  font-size: 0.88rem;
  color: rgba(255,255,255,0.75);
  margin: 0;
`;

// ── Steps ─────────────────────────────────────────────────────────────────────

const StepsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #fff;
  border-bottom: 1px solid rgba(0,0,0,0.06);
`;

const StepItem = styled.div<{ $done: boolean; $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  flex: 1;
`;

const StepDot = styled.div<{ $done: boolean; $active: boolean }>`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  background: ${p => p.$done ? '#4caf50' : p.$active ? '#FF6B35' : '#e0e0e0'};
  color: ${p => (p.$done || p.$active) ? '#fff' : '#aaa'};
  transition: background 0.4s;
  ${p => p.$active && css`animation: ${pulse} 1.2s ease-in-out infinite;`}
`;

const StepLabel = styled.span<{ $done: boolean; $active: boolean }>`
  font-size: 0.62rem;
  font-weight: ${p => p.$active ? '700' : '500'};
  color: ${p => p.$done ? '#4caf50' : p.$active ? '#FF6B35' : '#aaa'};
  text-align: center;
`;

const StepLine = styled.div<{ $done: boolean }>`
  flex: 0.5;
  height: 2px;
  background: ${p => p.$done ? '#4caf50' : '#e0e0e0'};
  transition: background 0.5s;
`;

// ── Map ───────────────────────────────────────────────────────────────────────

const MapContainer = styled.div`
  width: 100%;
  height: 350px;
  position: relative;
  background: #eee;
  border-top: 1px solid rgba(0,0,0,0.05);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  overflow: hidden;
`;

const MapInner = styled.div`
  width: 100%;
  height: 100%;
`;

const MapOverlay = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(8px);
  border-radius: 14px;
  padding: 8px 14px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.12);
  z-index: 1;
`;

const LiveDot = styled.div`
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #4caf50;
  animation: ${pulse} 1s ease-in-out infinite;
`;

// ── Info Panel ────────────────────────────────────────────────────────────────

const InfoPanel = styled.div`
  background: #fff;
  padding: 18px 20px;
  border-top: 1px solid rgba(0,0,0,0.06);
`;

const ConfirmCodeCard = styled.div`
  background: linear-gradient(135deg, #1a1a2e, #0f3460);
  border-radius: 18px;
  padding: 16px 20px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  animation: ${fadeUp} 0.4s ease;
`;

const ConfirmCodeLabel = styled.p`
  font-size: 0.75rem;
  color: rgba(255,255,255,0.6);
  margin: 0 0 4px;
`;

const ConfirmCode = styled.p`
  font-size: 2rem;
  font-weight: 900;
  color: #FFD23F;
  margin: 0;
  letter-spacing: 0.2em;
  font-family: 'SF Mono', monospace;
`;

const CopyBtn = styled.button<{ $copied: boolean }>`
  background: ${p => p.$copied ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.1)'};
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 10px;
  padding: 8px 14px;
  color: ${p => p.$copied ? '#81c784' : 'rgba(255,255,255,0.7)'};
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
`;

const OrderSummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #555;
  padding: 4px 0;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(0,0,0,0.07);
  margin: 10px 0;
`;

// ── Share Card ────────────────────────────────────────────────────────────────

const ShareCard = styled.div`
  position: relative;
  background: linear-gradient(135deg, #0f0c29, #1a1040, #24243e);
  color: #fff;
  border-radius: 24px;
  padding: 22px;
  margin-top: 20px;
  width: 100%;
  text-align: left;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 107, 53, 0.07) 30%,
      rgba(247, 147, 30, 0.07) 50%,
      rgba(255, 215, 0, 0.07) 70%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 3s linear infinite;
    pointer-events: none;
  }
`;

const ShareCardGlow = styled.div`
  position: absolute;
  top: -40px;
  right: -40px;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, rgba(255, 107, 53, 0.25) 0%, transparent 70%);
  pointer-events: none;
`;

const ShareCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const ShareTitle = styled.p`
  font-size: 1.05rem;
  font-weight: 900;
  margin: 0;
  line-height: 1.3;
`;

const ShareDesc = styled.p`
  font-size: 0.82rem;
  color: rgba(255,255,255,0.65);
  margin: 0 0 16px;
  line-height: 1.55;
`;

const CashbackBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(90deg, #FFD700, #FF6B35);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 900;
  border-radius: 20px;
  padding: 3px 10px;
  animation: ${bounce} 2.5s ease-in-out infinite;
  white-space: nowrap;
`;

const EarningsPill = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.25);
  border-radius: 12px;
  padding: 8px 12px;
  margin-bottom: 14px;
  font-size: 0.8rem;
  color: rgba(255,255,255,0.85);
`;

const EarningsStat = styled.span`
  font-size: 1rem;
  font-weight: 900;
  color: #FFD700;
  font-family: 'SF Mono', 'Fira Mono', monospace;
`;

const ShareBtnRow = styled.div`
  display: flex;
  gap: 10px;
`;

const ShareBtn = styled.button`
  flex: 1;
  padding: 14px 10px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #FF6B35, #F7931E);
  color: #fff;
  font-weight: 800;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 6px 20px rgba(255, 107, 53, 0.45);
  &:active { transform: scale(0.96); box-shadow: none; }
`;


// ── Loading / Error ───────────────────────────────────────────────────────────

const Centered = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 14px;
  text-align: center;
  padding: 24px;
  color: #888;
`;

const SpinIcon = styled(FontAwesomeIcon)`animation: ${spin} 1s linear infinite;`;

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { emoji: string; title: string; subtitle: string }> = {
    pending: { emoji: "👨‍🍳", title: "Preparing your order", subtitle: "The restaurant has received your order" },
    accepted: { emoji: "🛵", title: "Courier on the way!", subtitle: "Your courier is heading to the restaurant" },
    picked_up: { emoji: "💨", title: "On the way to you!", subtitle: "Your food is on its way" },
    delivered: { emoji: "🎉", title: "Delivered!", subtitle: "Enjoy your meal! Funds released on-chain" },
};

const STEPS = [
    { key: "preparing", label: "Preparing", icon: faUtensils, statuses: ["pending"] },
    { key: "on_the_way", label: "On the way", icon: faMotorcycle, statuses: ["accepted", "picked_up"] },
    { key: "delivered", label: "Delivered", icon: faCheckCircle, statuses: ["delivered"] },
];

function stepState(stepStatuses: string[], currentStatus: string) {
    const order = ["pending", "accepted", "picked_up", "delivered"];
    const currentIdx = order.indexOf(currentStatus);
    const stepIdx = Math.max(...stepStatuses.map(s => order.indexOf(s)));
    const done = currentIdx > stepIdx;
    const active = stepStatuses.includes(currentStatus);
    return { done, active };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface OrderTrackerProps {
    orderId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const OrderTracker: React.FC<OrderTrackerProps> = ({ orderId }) => {
    const { socket } = useSocket();
    const { confirmDelivery } = useTONEatsEscrow();
    const { wallet } = useTonConnect();

    const [order, setOrder] = useState<BackendOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [courierPos, setCourierPos] = useState<{ lat: number; lng: number } | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Map refs
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const prevCoordsRef = useRef<[number, number] | null>(null);
    const trailRef = useRef<[number, number][]>([]);

    // Helper references
    const myReferralLink = `https://t.me/${BOT_NAME}/app?startapp=store_${order?.storeId ?? "1"}_ref_${wallet ?? ""}`;
    const referrerCashback = (PROTOCOL_FEE_TON * REFERRER_CASHBACK_PERCENT).toFixed(3);
    const referralCount = parseInt(sessionStorage.getItem("ton_eats_referral_count") ?? "0");
    const totalEarned = (referralCount * parseFloat(referrerCashback)).toFixed(3);

    // ── Fetch initial order state ─────────────────────────────────────────────
    useEffect(() => {
        api.getOrder(orderId)
            .then(o => { setOrder(o); if (o.courierLocation) setCourierPos(o.courierLocation); })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [orderId]);

    // ── Socket.io subscriptions ───────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        socket.emit("join:order", { orderId });

        const onState = (o: BackendOrder) => setOrder(o);
        const onAccepted = (o: BackendOrder) => setOrder(o);
        const onPickedUp = (o: BackendOrder) => setOrder(o);
        const onDelivered = async (o: BackendOrder) => {
            setOrder(o);
        };
        const onLocation = ({ lat, lng }: { orderId: string; lat: number; lng: number }) => {
            setCourierPos({ lat, lng });
        };

        socket.on("order:state", onState);
        socket.on("order:accepted", onAccepted);
        socket.on("order:picked_up", onPickedUp);
        socket.on("order:delivered", onDelivered);
        socket.on("courier:location", onLocation);

        return () => {
            socket.off("order:state", onState);
            socket.off("order:accepted", onAccepted);
            socket.off("order:picked_up", onPickedUp);
            socket.off("order:delivered", onDelivered);
            socket.off("courier:location", onLocation);
        };
    }, [socket, orderId, confirmDelivery]);

    // ── Init Mapbox ───────────────────────────────────────────────────────────
    // NOTE: We intentionally depend only on `loading` so the map is created
    // exactly once when the initial fetch completes.  `order` is read via ref
    // to avoid the cleanup/recreate cycle that caused the grey↔white glitch.
    const orderRef = useRef(order);
    orderRef.current = order;

    useEffect(() => {
        if (loading || !orderRef.current || !mapContainerRef.current || mapRef.current) return;

        if (!MAPBOX_TOKEN) {
            console.error("Mapbox token missing!");
            return;
        }

        const m = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/streets-v12",
            center: [2.3522, 48.8566], // Paris default
            zoom: 13,
            attributionControl: false,
        });

        m.addControl(new mapboxgl.NavigationControl(), "bottom-right");

        m.on('load', () => {
            setMapLoaded(true);

            // ── Courier Source & Layer ──
            m.addSource('courier-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            m.addLayer({
                id: 'courier-layer',
                type: 'symbol',
                source: 'courier-source',
                layout: {
                    'icon-image': 'rocket-15', // You can use 'car-15' or custom
                    'icon-size': 1.6,
                    'icon-rotate': ['get', 'bearing'],
                    'icon-rotation-alignment': 'map',
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true,
                }
            });

            // ── Path Trail Source & Layer ──
            m.addSource('trail-source', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: [] },
                    properties: {}
                }
            });

            m.addLayer({
                id: 'trail-layer',
                type: 'line',
                source: 'trail-source',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': '#FF6B35',
                    'line-width': 4,
                    'line-opacity': 0.4,
                    'line-dasharray': [2, 1]
                }
            });

            m.resize();
        });

        mapRef.current = m;

        // The only robust way to fix mapbox display: none -> block issues
        const ro = new ResizeObserver(() => {
            m.resize();
        });
        if (mapContainerRef.current) {
            ro.observe(mapContainerRef.current);
        }

        return () => {
            ro.disconnect();
            m.remove();
            mapRef.current = null;
            setMapLoaded(false);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]);

    const showMap = ["accepted", "picked_up"].includes(order?.status ?? "");

    // ── Handle Map Resizing on show/hide ──
    useEffect(() => {
        if (mapRef.current && (showMap || courierPos)) {
            setTimeout(() => {
                mapRef.current?.resize();
            }, 100);
        }
    }, [showMap, courierPos]);

    // ── Animate courier pin ───────────────────────────────────────────────────
    useEffect(() => {
        if (!mapRef.current || !mapLoaded || !courierPos) return;
        const map = mapRef.current;
        const newCoords: [number, number] = [courierPos.lng, courierPos.lat];

        // 1. Calculate bearing
        let bearing = 0;
        if (prevCoordsRef.current) {
            bearing = turf.bearing(
                turf.point(prevCoordsRef.current),
                turf.point(newCoords)
            );
        }

        // 2. Update Trail
        if (trailRef.current.length === 0 ||
            trailRef.current[trailRef.current.length - 1][0] !== newCoords[0]) {
            trailRef.current.push(newCoords);
        }

        // 3. Update Map Sources
        const courierSource = map.getSource('courier-source') as mapboxgl.GeoJSONSource;
        const trailSource = map.getSource('trail-source') as mapboxgl.GeoJSONSource;

        if (courierSource) {
            courierSource.setData({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: newCoords },
                properties: { bearing }
            });
        }

        if (trailSource) {
            trailSource.setData({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: trailRef.current },
                properties: {}
            });
        }

        // 4. Smooth Camera Follow
        map.easeTo({
            center: newCoords,
            zoom: 15,
            duration: 1000,
            easing: (t) => t // Linear follow for smooth tracking
        });

        prevCoordsRef.current = newCoords;
    }, [courierPos, mapLoaded]);

    const handleCopyCode = () => {
        if (!order) return;
        navigator.clipboard?.writeText(order.confirmCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleShare = () => {
        const link = myReferralLink;
        const text =
            `🍔 Just ordered on TON-Eats – 0% fee food delivery on TON Blockchain!\n` +
            `Order with my link → I earn ${referrerCashback} TON cashback per order 🔥\n${link}`;
        try {
            const tg = (window as any).Telegram?.WebApp;
            if (tg?.openTelegramLink) {
                tg.openTelegramLink(
                    `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`
                );
            } else {
                window.open(
                    `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`,
                    "_blank"
                );
            }
        } catch {
            navigator.clipboard?.writeText(link).catch(() => { });
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard?.writeText(myReferralLink).then(() => {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        }).catch(() => { });
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    if (loading) return (
        <Centered><SpinIcon icon={faBoxOpen} style={{ fontSize: "2.5rem", color: "#FF6B35" }} /><p>Loading your order…</p></Centered>
    );
    if (error || !order) return (
        <Centered>
            <FontAwesomeIcon icon={faXmarkCircle} style={{ fontSize: "2.5rem", color: "#f44336" }} />
            <p>{error ?? "Order not found"}</p>
        </Centered>
    );

    const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;

    return (
        <Page>
            {/* ── Status Header ── */}
            <StatusHeader $status={order.status}>
                <StatusEmoji>{cfg.emoji}</StatusEmoji>
                <StatusTitle>{cfg.title}</StatusTitle>
                <StatusSubtitle>{cfg.subtitle}</StatusSubtitle>
            </StatusHeader>

            {/* ── Progress Steps ── */}
            <StepsRow>
                {STEPS.map((step, i) => {
                    const { done, active } = stepState(step.statuses, order.status);
                    return (
                        <React.Fragment key={step.key}>
                            <StepItem $done={done} $active={active}>
                                <StepDot $done={done} $active={active}>
                                    <FontAwesomeIcon icon={step.icon} />
                                </StepDot>
                                <StepLabel $done={done} $active={active}>{step.label}</StepLabel>
                            </StepItem>
                            {i < STEPS.length - 1 && (
                                <StepLine $done={done} />
                            )}
                        </React.Fragment>
                    );
                })}
            </StepsRow>

            {/* ── Live Map ── */}
            <MapContainer style={{ display: order ? "block" : "none" }}>
                {!mapboxgl.accessToken && (
                    <div style={{ position: 'absolute', inset: 0, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '0.8rem', padding: 20, textAlign: 'center', zIndex: 10 }}>
                        ⚠️ Mapbox Token Missing. Please check VITE_MAPBOX_ACCESS_TOKEN.
                    </div>
                )}
                <MapInner ref={mapContainerRef} />
                <MapOverlay>
                    {order?.status === 'delivered' ? (
                        <><FontAwesomeIcon icon={faCheckCircle} style={{ color: '#4caf50' }} /> Order delivered successfully</>
                    ) : order?.status === 'pending' ? (
                        <><FontAwesomeIcon icon={faUtensils} style={{ color: '#FF6B35' }} /> Restaurant is preparing your food</>
                    ) : order?.status === 'accepted' || order?.status === 'picked_up' ? (
                        courierPos ? (
                            <><LiveDot /> Courier location · live</>
                        ) : (
                            <><FontAwesomeIcon icon={faWifi} /> Finding courier location...</>
                        )
                    ) : (
                        <><FontAwesomeIcon icon={faWifi} /> Waiting for update...</>
                    )}
                </MapOverlay>
            </MapContainer>

            {/* ── Info Panel ── */}
            <InfoPanel>
                {/* 4-digit confirmation code — always visible */}
                <ConfirmCodeCard>
                    <div>
                        <ConfirmCodeLabel>Your delivery code</ConfirmCodeLabel>
                        <ConfirmCode>{order.confirmCode}</ConfirmCode>
                        <ConfirmCodeLabel style={{ marginTop: 4 }}>
                            Show this to your courier at the door
                        </ConfirmCodeLabel>
                    </div>
                    <CopyBtn $copied={copied} onClick={handleCopyCode}>
                        <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                        {copied ? "Copied" : "Copy"}
                    </CopyBtn>
                </ConfirmCodeCard>

                {/* Order summary */}
                <Divider />
                <OrderSummaryRow>
                    <span style={{ fontWeight: 700 }}>🍔 Order #{order.orderId}</span>
                    <span style={{ fontWeight: 700, color: "#FF6B35" }}>
                        {(order.foodTotalTon + order.deliveryFeeTon + order.protocolFeeTon).toFixed(3)} TON
                    </span>
                </OrderSummaryRow>
                <OrderSummaryRow>
                    <span>📍 {order.deliveryAddress}</span>
                </OrderSummaryRow>
                {order.items.map((item, i) => (
                    <OrderSummaryRow key={i}>
                        <span>{item.qty}× {item.name}</span>
                        <span>{item.priceTon.toFixed(3)} TON</span>
                    </OrderSummaryRow>
                ))}
                <Divider />
                <OrderSummaryRow>
                    <span style={{ color: "#aaa", fontSize: "0.78rem" }}>
                        🔒 Payment locked in escrow — released on delivery confirmation
                    </span>
                </OrderSummaryRow>

                <ShareCard>
                    <ShareCardGlow />
                    <ShareCardHeader>
                        <ShareTitle>💸 Earn Crypto with every share</ShareTitle>
                        <CashbackBadge>
                            <FontAwesomeIcon icon={faFire} />
                            5% CASHBACK
                        </CashbackBadge>
                    </ShareCardHeader>

                    <ShareDesc>
                        Send your link to friends. Every time they place an order,
                        <strong style={{ color: '#FFD700' }}> {referrerCashback} TON</strong> lands
                        directly in your wallet — on-chain, automatic, trustless.
                    </ShareDesc>

                    {referralCount > 0 && (
                        <EarningsPill>
                            <FontAwesomeIcon icon={faCoins} style={{ color: '#FFD700' }} />
                            <span>
                                You've referred <strong>{referralCount} order{referralCount !== 1 ? 's' : ''}</strong> and earned{" "}
                                <EarningsStat>{totalEarned} TON</EarningsStat> total
                            </span>
                        </EarningsPill>
                    )}

                    <ShareBtnRow>
                        <ShareBtn onClick={handleShare}>
                            <FontAwesomeIcon icon={faShareNodes} />
                            Share on Telegram
                        </ShareBtn>
                        <CopyBtn $copied={copiedLink} onClick={handleCopyLink} style={{ flex: "0.4" }}>
                            <FontAwesomeIcon icon={copiedLink ? faCheck : faCopy} />
                            {copiedLink ? "Copied" : "Copy"}
                        </CopyBtn>
                    </ShareBtnRow>
                </ShareCard>
            </InfoPanel>
        </Page>
    );
};

export default OrderTracker;
