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
import { 
  faCheckCircle, 
  faMotorcycle, 
  faUtensils, 
  faBoxOpen, 
  faWifi, 
  faXmarkCircle, 
  faCopy, 
  faCheck, 
  faShareNodes, 
  faFire, 
  faCoins, 
  faLink 
} from "@fortawesome/free-solid-svg-icons";
import { SkeletonLine, SkeletonBase } from "../components/Skeleton";
import LoadingAnimation from "../components/LoadingAnimation";
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
  background: var(--bg-primary);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: background var(--transition-base);
`;

// ── Status Header ─────────────────────────────────────────────────────────────

const StatusHeader = styled.div<{ $status: string }>`
  background: ${p =>
    p.$status === 'delivered'
        ? 'linear-gradient(135deg, var(--success), #059669)'
        : p.$status === 'picked_up'
            ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
            : p.$status === 'accepted'
                ? 'linear-gradient(135deg, #f97316, var(--accent))'
                : 'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))'};
  color: #fff;
  padding: 40px 24px 48px;
  transition: background 0.8s var(--transition-smooth);
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: -50%;
    right: -20%;
    width: 250px;
    height: 250px;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    pointer-events: none;
  }
`;

const StatusEmoji = styled.div`
  font-size: 3.5rem;
  margin-bottom: 16px;
  animation: ${bounce} 2s ease-in-out infinite;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));
`;

const StatusTitle = styled.h1`
  font-size: 2rem;
  font-weight: 950;
  margin: 0 0 8px;
  letter-spacing: -0.04em;
  color: #fff;
`;

const StatusSubtitle = styled.p`
  font-size: 1rem;
  color: rgba(255,255,255,0.85);
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

// ── Steps ─────────────────────────────────────────────────────────────────────

const StepsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--bg-tertiary);
  margin-top: -24px;
  border-radius: 28px 28px 0 0;
  box-shadow: 0 -8px 24px rgba(0,0,0,0.08);
  position: relative;
  z-index: 10;
`;

const StepItem = styled.div<{ $done: boolean; $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex: 1;
`;

const StepDot = styled.div<{ $done: boolean; $active: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  background: ${p => p.$done ? 'var(--success)' : p.$active ? 'var(--accent)' : 'var(--bg-tertiary)'};
  color: ${p => (p.$done || p.$active) ? '#fff' : 'var(--text-hint)'};
  transition: all var(--transition-base);
  box-shadow: ${p => (p.$done || p.$active) ? '0 6px 16px hsla(0,0%,0%,0.15)' : 'none'};
  ${p => p.$active && css`animation: ${pulse} 1.5s var(--transition-smooth) infinite;`}
`;

const StepLabel = styled.span<{ $done: boolean; $active: boolean }>`
  font-size: 0.725rem;
  font-weight: 900;
  color: ${p => p.$done ? 'var(--success)' : p.$active ? 'var(--accent)' : 'var(--text-hint)'};
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const StepLine = styled.div<{ $done: boolean }>`
  flex: 0.4;
  height: 2px;
  background: ${p => p.$done ? 'var(--success)' : 'var(--bg-tertiary)'};
  transition: background 0.5s var(--transition-base);
`;

// ── Map ───────────────────────────────────────────────────────────────────────

const MapContainer = styled.div`
  width: 100%;
  height: 38vh;
  position: relative;
  background: var(--bg-tertiary);
  overflow: hidden;
`;

const PendingDispatchState = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    gap: 14px;
    padding: 28px;
    background:
        radial-gradient(circle at top right, hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.12), transparent 48%),
        linear-gradient(160deg, var(--bg-secondary), var(--bg-primary));
`;

const DispatchSpinner = styled.div`
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: 4px solid var(--accent-soft);
    border-top-color: var(--accent);
    animation: ${spin} 1s linear infinite;
`;

const DispatchTitle = styled.h3`
    margin: 0;
    font-size: 1.15rem;
    font-weight: 900;
    letter-spacing: -0.02em;
    color: var(--text-primary);
`;

const DispatchSubtitle = styled.p`
    margin: 0;
    max-width: 360px;
    font-size: 0.9rem;
    line-height: 1.55;
    color: var(--text-secondary);
    font-weight: 600;
`;

const DispatchHint = styled.p`
    margin: 4px 0 0;
    font-size: 0.78rem;
    color: var(--text-hint);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
`;

const MapInner = styled.div`
  width: 100%;
  height: 100%;
`;

const MapOverlay = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  background: hsla(230, 20%, 12%, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 12px 18px;
  font-size: 0.85rem;
  font-weight: 900;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  z-index: 10;
  border: 1px solid rgba(255,255,255,0.1);
`;

const LiveDot = styled.div`
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 10px var(--success);
  animation: ${pulse} 1s var(--transition-smooth) infinite;
`;

// ── Info Panel ────────────────────────────────────────────────────────────────

const InfoPanel = styled.div`
  background: var(--bg-secondary);
  padding: 24px;
  border-top: 1px solid var(--bg-tertiary);
  flex-grow: 1;
`;

const ConfirmCodeCard = styled.div`
  background: radial-gradient(circle at top left, #1a1a2e, #09090b);
  border-radius: 24px;
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  animation: ${fadeUp} 0.6s var(--transition-smooth);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 12px 32px rgba(0,0,0,0.3);
`;

const ConfirmCodeLabel = styled.p`
  font-size: 0.75rem;
  color: rgba(255,255,255,0.4);
  margin: 0 0 8px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const ConfirmCode = styled.p`
  font-size: 2.4rem;
  font-weight: 950;
  color: var(--warning);
  margin: 0;
  letter-spacing: 0.2em;
  font-family: 'SF Mono', 'Fira Mono', monospace;
  text-shadow: 0 0 20px hsla(var(--hue-warning),var(--sat-warning),var(--light-warning),0.4);
`;

const CopyBtn = styled.button<{ $copied: boolean }>`
  background: ${p => p.$copied ? 'hsla(var(--hue-success),var(--sat-success),var(--light-success),0.15)' : 'rgba(255,255,255,0.05)'};
  border: 1px solid ${p => p.$copied ? 'hsla(var(--hue-success),var(--sat-success),var(--light-success),0.3)' : 'rgba(255,255,255,0.1)'};
  border-radius: 14px;
  padding: 12px 20px;
  color: ${p => p.$copied ? 'var(--success)' : '#fff'};
  font-size: 0.9rem;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all var(--transition-base);
  &:active { transform: scale(0.92); }
`;

const OrderSummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
  color: var(--text-secondary);
  padding: 6px 0;
  font-weight: 600;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid var(--bg-tertiary);
  margin: 16px 0;
`;

// ── Share Card ────────────────────────────────────────────────────────────────

const ShareCard = styled.div`
  position: relative;
  background: linear-gradient(135deg, #09090b, #181825);
  color: #fff;
  border-radius: 32px;
  padding: 28px;
  margin-top: 28px;
  width: 100%;
  text-align: left;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.05) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 4s linear infinite;
    pointer-events: none;
  }
`;

const ShareCardGlow = styled.div`
  position: absolute;
  top: -80px;
  right: -80px;
  /* Responsive glow size: 180px on mobile, 240px on desktop */
  width: clamp(180px, 60vw, 240px);
  height: clamp(180px, 60vw, 240px);
  background: radial-gradient(circle, hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.15) 0%, transparent 70%);
  pointer-events: none;

  @media (max-width: 480px) {
    width: 200px;
    height: 200px;
  }
`;

const ShareCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
`;

const ShareTitle = styled.p`
  font-size: 1.4rem;
  font-weight: 950;
  margin: 0;
  line-height: 1.2;
  letter-spacing: -0.04em;
  color: #fff;
`;

const ShareDesc = styled.p`
  font-size: 0.95rem;
  color: rgba(255,255,255,0.65);
  margin: 0 0 24px;
  line-height: 1.6;
  font-weight: 500;
`;

const CashbackBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, var(--warning), #d97706);
  color: #000;
  font-size: 0.75rem;
  font-weight: 900;
  border-radius: 20px;
  padding: 5px 14px;
  animation: ${bounce} 3s var(--transition-smooth) infinite;
  white-space: nowrap;
  box-shadow: 0 6px 18px hsla(var(--hue-warning),var(--sat-warning),var(--light-warning),0.4);
`;

const EarningsPill = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  padding: 14px 18px;
  margin-bottom: 24px;
  font-size: 0.95rem;
  color: rgba(255,255,255,0.9);
  font-weight: 600;
`;

const EarningsStat = styled.span`
  font-size: 1.2rem;
  font-weight: 950;
  color: var(--warning);
  font-family: 'SF Mono', monospace;
`;

const ShareBtnRow = styled.div`
  display: flex;
  gap: 14px;
`;

const ShareBtn = styled.button`
  flex: 1;
  padding: 18px;
  border-radius: 18px;
  border: none;
  background: var(--accent);
  color: #fff;
  font-weight: 950;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all var(--transition-base);
  box-shadow: 0 12px 32px hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.4);
  letter-spacing: -0.01em;
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
    pending: { emoji: "👨‍🍳", title: "Preparing your order", subtitle: "The restaurant is preparing your food" },
    accepted: { emoji: "🛵", title: "Courier assigned", subtitle: "Your courier is heading to the restaurant" },
    picked_up: { emoji: "💨", title: "On the way", subtitle: "Your courier is on the way to your address" },
    delivered: { emoji: "🎉", title: "Delivered", subtitle: "Your order was delivered successfully" },
};

const STEPS = [
    { key: "preparing", label: "Preparing", icon: faUtensils, statuses: ["pending"] },
    { key: "on_the_way", label: "On the Way", icon: faMotorcycle, statuses: ["accepted", "picked_up"] },
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

function deriveEffectiveStatus(status: string, chainStatus: bigint | null): string {
    const hasOnchainAcceptance = chainStatus !== null && chainStatus >= 1n;
    const hasOnchainDelivery = chainStatus !== null && chainStatus >= 2n;

    if (["accepted", "picked_up", "delivered"].includes(status) && !hasOnchainAcceptance) {
        return "pending";
    }
    if (status === "delivered" && !hasOnchainDelivery) {
        return "picked_up";
    }
    return status;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface OrderTrackerProps {
    orderId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const OrderTracker: React.FC<OrderTrackerProps> = ({ orderId }) => {
    const { socket } = useSocket();
    const { confirmDelivery, getOrderStatus } = useTONEatsEscrow();
    const { wallet } = useTonConnect();

    const [order, setOrder] = useState<BackendOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [courierPos, setCourierPos] = useState<{ lat: number; lng: number } | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [onchainStatus, setOnchainStatus] = useState<bigint | null>(null);

    // Map refs
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const courierMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const restaurantMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const deliveryMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const prevCoordsRef = useRef<[number, number] | null>(null);
    const trailRef = useRef<[number, number][]>([]);

    // Helper references
    const myReferralLink = `https://t.me/${BOT_NAME}/app?startapp=store_${order?.storeId ?? "1"}_ref_${wallet ?? ""}`;
    const referrerCashback = (PROTOCOL_FEE_TON * REFERRER_CASHBACK_PERCENT).toFixed(3);
    const referralCount = parseInt(sessionStorage.getItem("ton_eats_referral_count") ?? "0");
    const totalEarned = (referralCount * parseFloat(referrerCashback)).toFixed(3);

    // ── Fetch initial order state ─────────────────────────────────────────────
    useEffect(() => {
        setLoading(true);
        api.getOrder(orderId)
            .then(o => { 
                setOrder(o); 
                if (o.courierLocation) setCourierPos(o.courierLocation); 
                setLoading(false);
            })
            .catch(e => {
                setError(e.message);
                setLoading(false);
            });
    }, [orderId]);

    // ── Poll on-chain escrow status to gate UI progression ─────────────────
    useEffect(() => {
        if (!order?.orderId) return;

        let cancelled = false;

        const poll = async () => {
            const status = await getOrderStatus(order.orderId);
            if (!cancelled && status !== null) {
                setOnchainStatus(status);
            }
        };

        poll();
        const id = setInterval(poll, 4000);

        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [order?.orderId]);

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

    // ── SVG helpers for custom map markers ────────────────────────────────────
    const createCourierMarkerEl = useCallback((): HTMLDivElement => {
        const el = document.createElement('div');
        el.style.width = '44px';
        el.style.height = '44px';
        el.style.cursor = 'pointer';
        el.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="44" height="44">
            <circle cx="32" cy="32" r="30" fill="#FF6B35" stroke="#fff" stroke-width="3"/>
            <g transform="translate(14, 14) scale(0.56)">
              <path fill="#fff" d="M55.6 25.4c-1.8-1.8-4.3-2.4-6.6-1.8L41.2 16H34v-4h4V8H26v4h4v4h-6l-5.4 8.2C16.2 23 13.2 22.2 10.4 24c-3.8 2.4-5 7.4-2.6 11.2l5.8 9.2c.6 1 1.4 1.6 2.4 2v5.6h4V46h12v6h4v-5.6c1-.4 1.8-1 2.4-2l5.8-9.2c.8-1.4 1.2-2.8 1.2-4.4 0-2-0.8-4-2.2-5.4h-.6zM16 36c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm20 0c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
            </g>
          </svg>`;
        return el;
    }, []);

    const createRestaurantMarkerEl = useCallback((): HTMLDivElement => {
        const el = document.createElement('div');
        el.style.width = '44px';
        el.style.height = '44px';
        el.style.cursor = 'pointer';
        el.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="44" height="44">
            <circle cx="32" cy="32" r="30" fill="#1a1a2e" stroke="#fff" stroke-width="3"/>
            <g transform="translate(16, 14) scale(0.56)">
              <path fill="#FFD23F" d="M18 3v6H8v2h10v40h4V11h10V9H22V3h-4zm14 18c-3.3 0-6 4.5-6 10 0 4 1.8 7.2 4.4 8.8L28 58h4l2.4-18.2c2.6-1.6 4.4-4.8 4.4-8.8 0-5.5-2.7-10-6-10h.2zM8 21c-3.3 0-6 4.5-6 10 0 4 1.8 7.2 4.4 8.8L4 58h4l2.4-18.2c2.6-1.6 4.4-4.8 4.4-8.8 0-5.5-2.7-10-6-10h-.8z"/>
            </g>
          </svg>`;
        return el;
    }, []);

    const createDeliveryMarkerEl = useCallback((): HTMLDivElement => {
        const el = document.createElement('div');
        el.style.width = '44px';
        el.style.height = '44px';
        el.style.cursor = 'pointer';
        el.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="44" height="44">
            <circle cx="32" cy="32" r="30" fill="#4caf50" stroke="#fff" stroke-width="3"/>
            <g transform="translate(18, 12) scale(0.56)">
              <path fill="#fff" d="M24 4C17.4 4 12 9.4 12 16c0 8.6 10.4 20.4 11.2 21.4.4.4 1 .6 1.6.6s1.2-.2 1.6-.6C27.2 36.4 36 24.6 36 16c0-6.6-5.4-12-12-12zm0 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
              <path fill="#fff" d="M24 42c-1.4 0-2.6-.4-3.6-1.2C18 38.2 8 27 8 16 8 7.2 15.2 0 24 0s16 7.2 16 16c0 11-10 22.2-12.4 24.8-1 .8-2.2 1.2-3.6 1.2z" opacity="0.15"/>
            </g>
          </svg>`;
        return el;
    }, []);

    // ── Fetch & draw route from Mapbox Directions API ─────────────────────────
    const drawRoute = useCallback(async (
        map: mapboxgl.Map,
        from: [number, number],
        to: [number, number]
    ) => {
        try {
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
            const resp = await fetch(url);
            const data = await resp.json();
            if (!data.routes?.[0]) return;

            const geojson = data.routes[0].geometry;

            const existingSource = map.getSource('route-source') as mapboxgl.GeoJSONSource;
            if (existingSource) {
                existingSource.setData({ type: 'Feature', geometry: geojson, properties: {} });
            } else {
                map.addSource('route-source', {
                    type: 'geojson',
                    data: { type: 'Feature', geometry: geojson, properties: {} }
                });
                map.addLayer({
                    id: 'route-layer',
                    type: 'line',
                    source: 'route-source',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: {
                        'line-color': 'var(--text-primary)',
                        'line-width': 5,
                        'line-opacity': 0.7,
                    }
                });
                // Dashed outline for depth
                map.addLayer({
                    id: 'route-layer-outline',
                    type: 'line',
                    source: 'route-source',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: {
                        'line-color': 'var(--accent)',
                        'line-width': 3,
                        'line-dasharray': [2, 2],
                        'line-opacity': 0.5,
                    }
                }, 'route-layer');
            }
        } catch (err) {
            console.warn('[OrderTracker] Could not fetch route:', err);
        }
    }, []);

    useEffect(() => {
        if (loading || !orderRef.current || !mapContainerRef.current || mapRef.current) return;

        if (!MAPBOX_TOKEN) {
            console.error("Mapbox token missing!");
            return;
        }

        const ord = orderRef.current;
        const storeLng = ord.storeLng ?? 2.3522;
        const storeLat = ord.storeLat ?? 48.8566;

        const m = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/streets-v12",
            center: [storeLng, storeLat],
            zoom: 13,
            attributionControl: false,
        });

        m.addControl(new mapboxgl.NavigationControl(), "bottom-right");

        m.on('load', () => {
            setMapLoaded(true);

            // ── Trail Source & Layer (courier breadcrumb) ──
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
                    'line-color': 'var(--accent)',
                    'line-width': 4,
                    'line-opacity': 0.4,
                    'line-dasharray': [2, 1]
                }
            });

            // ── Restaurant marker ──
            restaurantMarkerRef.current = new mapboxgl.Marker({ element: createRestaurantMarkerEl() })
                .setLngLat([storeLng, storeLat])
                .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('🍕 Restaurant'))
                .addTo(m);

            // ── Delivery destination marker ──
            if (ord.deliveryLat && ord.deliveryLng) {
                deliveryMarkerRef.current = new mapboxgl.Marker({ element: createDeliveryMarkerEl() })
                    .setLngLat([ord.deliveryLng, ord.deliveryLat])
                    .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('📍 Delivery'))
                    .addTo(m);

                // Draw route from restaurant → delivery
                drawRoute(m, [storeLng, storeLat], [ord.deliveryLng, ord.deliveryLat]);

                // Fit bounds to show both markers
                const bounds = new mapboxgl.LngLatBounds()
                    .extend([storeLng, storeLat])
                    .extend([ord.deliveryLng, ord.deliveryLat]);
                m.fitBounds(bounds, { padding: 60, maxZoom: 15 });
            }

            // ── Courier marker (if position already known) ──
            if (ord.courierLocation) {
                courierMarkerRef.current = new mapboxgl.Marker({ element: createCourierMarkerEl() })
                    .setLngLat([ord.courierLocation.lng, ord.courierLocation.lat])
                    .addTo(m);
            }

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
            courierMarkerRef.current?.remove();
            restaurantMarkerRef.current?.remove();
            deliveryMarkerRef.current?.remove();
            courierMarkerRef.current = null;
            restaurantMarkerRef.current = null;
            deliveryMarkerRef.current = null;
            m.remove();
            mapRef.current = null;
            setMapLoaded(false);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]);

    const effectiveStatusForMap = deriveEffectiveStatus(order?.status ?? "pending", onchainStatus);
    const showMap = ["accepted", "picked_up"].includes(effectiveStatusForMap);

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

        // 1. Calculate bearing (for future rotation support)
        if (prevCoordsRef.current) {
            turf.bearing(
                turf.point(prevCoordsRef.current),
                turf.point(newCoords)
            );
        }

        // 2. Update Trail
        if (trailRef.current.length === 0 ||
            trailRef.current[trailRef.current.length - 1][0] !== newCoords[0]) {
            trailRef.current.push(newCoords);
        }

        // 3. Update courier HTML marker
        if (courierMarkerRef.current) {
            courierMarkerRef.current.setLngLat(newCoords);
        } else {
            courierMarkerRef.current = new mapboxgl.Marker({ element: createCourierMarkerEl() })
                .setLngLat(newCoords)
                .addTo(map);
        }

        // 4. Update Trail Source
        const trailSource = map.getSource('trail-source') as mapboxgl.GeoJSONSource;

        if (trailSource) {
            trailSource.setData({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: trailRef.current },
                properties: {}
            });
        }

        // 5. Smooth Camera Follow — include all points of interest
        const bounds = new mapboxgl.LngLatBounds().extend(newCoords);
        const ord = orderRef.current;
        if (ord?.storeLat && ord?.storeLng) bounds.extend([ord.storeLng, ord.storeLat]);
        if (ord?.deliveryLat && ord?.deliveryLng) bounds.extend([ord.deliveryLng, ord.deliveryLat]);

        map.fitBounds(bounds, {
            padding: 60,
            maxZoom: 16,
            duration: 1000,
        });

        prevCoordsRef.current = newCoords;
    }, [courierPos, mapLoaded, createCourierMarkerEl]);

    const handleCopyCode = () => {
        if (!order) return;
        navigator.clipboard?.writeText(order.confirmCode).then(() => {
            const tg = (window as any).Telegram?.WebApp;
            if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
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
        <Centered><LoadingAnimation message="Loading your order…" /></Centered>
    );
    if (error || !order) return (
        <Centered>
            <FontAwesomeIcon icon={faXmarkCircle} style={{ fontSize: "2.5rem", color: "var(--error, #f44336)" }} />
            <p>{error ?? "We couldn't find this order"}</p>
        </Centered>
    );

    const effectiveStatus = deriveEffectiveStatus(order.status, onchainStatus);

    const cfg = STATUS_CONFIG[effectiveStatus] ?? STATUS_CONFIG.pending;

    return (
        <Page>
            {/* ── Status Header ── */}
            <StatusHeader $status={effectiveStatus}>
                <StatusEmoji>{cfg.emoji}</StatusEmoji>
                <StatusTitle>{cfg.title}</StatusTitle>
                <StatusSubtitle>{cfg.subtitle}</StatusSubtitle>
            </StatusHeader>

            {/* ── Progress Steps ── */}
            <StepsRow>
                {STEPS.map((step, i) => {
                    const { done, active } = stepState(step.statuses, effectiveStatus);
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

            {/* ── Live Map / Pending Dispatch State ── */}
            <MapContainer style={{ display: order ? "block" : "none" }}>
                {effectiveStatus === "pending" ? (
                    <PendingDispatchState>
                        <DispatchSpinner />
                        <DispatchTitle>Finding your courier</DispatchTitle>
                        <DispatchSubtitle>
                            Your order is being prepared and nearby couriers are receiving this request now.
                        </DispatchSubtitle>
                        <DispatchHint>
                            Live tracking starts after courier acceptance is confirmed on TON
                        </DispatchHint>
                    </PendingDispatchState>
                ) : (
                    <>
                        {!mapboxgl.accessToken && (
                            <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', padding: 20, textAlign: 'center', zIndex: 10 }}>
                                ⚠️ Mapbox Token Missing. Please check VITE_MAPBOX_ACCESS_TOKEN.
                            </div>
                        )}
                        <MapInner ref={mapContainerRef} />
                        <MapOverlay>
                            {effectiveStatus === 'delivered' ? (
                                <><FontAwesomeIcon icon={faCheckCircle} style={{ color: '#4caf50' }} /> Order delivered successfully</>
                            ) : effectiveStatus === 'accepted' || effectiveStatus === 'picked_up' ? (
                                courierPos ? (
                                    <><LiveDot /> Courier location · live</>
                                ) : (
                                    <><FontAwesomeIcon icon={faWifi} /> Finding your courier location...</>
                                )
                            ) : (
                                <><FontAwesomeIcon icon={faWifi} /> Waiting for order updates...</>
                            )}
                        </MapOverlay>
                    </>
                )}
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
                        {copied ? "Copied" : "Copy Code"}
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
                    <span style={{ color: "var(--text-hint)", fontSize: "0.78rem" }}>
                        🔒 Payment locked in escrow — released on delivery confirmation
                    </span>
                </OrderSummaryRow>

                <ShareCard>
                    <ShareCardGlow />
                    <ShareCardHeader>
                        <ShareTitle>💸 Earn TON when you share</ShareTitle>
                        <CashbackBadge>
                            <FontAwesomeIcon icon={faFire} />
                            5% CASHBACK
                        </CashbackBadge>
                    </ShareCardHeader>

                    <ShareDesc>
                        Share your link with friends. Each delivered order earns you
                        <strong style={{ color: '#FFD700' }}> {referrerCashback} TON</strong> directly in your wallet.
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
                            {copiedLink ? "Copied" : "Copy Link"}
                        </CopyBtn>
                    </ShareBtnRow>
                </ShareCard>
            </InfoPanel>
        </Page>
    );
};

export default OrderTracker;
