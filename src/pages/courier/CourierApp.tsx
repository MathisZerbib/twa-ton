/**
 * CourierApp — Uber-Eats-style courier experience (main shell).
 *
 * Screens:
 *   GATE     — Wallet not connected → connect prompt
 *   FEED     — Available orders with distance/ETA sorting
 *   ACTIVE   — Full-screen GPS navigation during delivery
 *   MY-ORDERS — Order history (active + completed)
 *   EARNINGS — Earnings dashboard + on-chain tx
 *
 * Features:
 *   • Bottom tab navigation (Orders · My Deliveries · Earnings)
 *   • Real-time order feed via Socket.io
 *   • GPS broadcasting every 5s during active delivery
 *   • Integrated Mapbox navigation with route + ETA
 *   • Swipe-to-confirm for pickup actions
 *   • Native maps linking for turn-by-turn navigation
 *   • On-chain escrow interaction (accept + confirm delivery)
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBagShopping,
  faCoins,
  faShieldHalved,
  faMotorcycle,
} from "@fortawesome/free-solid-svg-icons";
import { TonConnectButton } from "@tonconnect/ui-react";

import { useTonConnect } from "../../hooks/useTonConnect";
import { useTONEatsEscrow, DELIVERY_FEE_TON, AcceptPhase } from "../../hooks/useTONEatsEscrow";
import { useSocket } from "../../hooks/useSocket";
import { api, BackendOrder } from "../../services/api";

import BottomNav, { CourierTab } from "../../components/courier/BottomNav";
import AcceptingOverlay, { OverlayPhase } from "../../components/courier/AcceptingOverlay";
import OrderFeed from "./OrderFeed";
import ActiveDelivery from "./ActiveDelivery";
import MyDeliveries from "./MyDeliveries";
import Earnings from "./Earnings";
import Header from "../../components/Header";

// ─── Animations ─────────────────────────────────────────────────────────────

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.96) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
`;
const pulseDot = keyframes`0%,100%{opacity:1}50%{opacity:0.4}`;

// ─── Gate Styled ────────────────────────────────────────────────────────────

const Gate = styled.div`
  min-height: 100vh;
  background: radial-gradient(circle at top right, #1e1e2e, #09090b);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  text-align: center;
  gap: 24px;
  animation: ${scaleIn} 0.5s var(--transition-smooth) both;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: url('/assets/grid-pattern.svg') repeat;
    opacity: 0.05;
    pointer-events: none;
  }
`;

const GateIcon = styled.div`
  font-size: 5rem;
  filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
  margin-bottom: 8px;
`;

const GateTitle = styled.h1`
  font-size: 2.2rem;
  font-weight: 900;
  color: #fff;
  margin: 0;
  letter-spacing: -0.04em;
`;

const GateSubtitle = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.5);
  max-width: 280px;
  line-height: 1.6;
  margin: 0;
  font-weight: 500;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 12px 0 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 320px;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;
  padding: 14px 18px;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.85);
  text-align: left;
  font-weight: 600;
  transition: transform var(--transition-fast);

  &:hover { transform: translateX(8px); }
`;

const FeatureIcon = styled.div<{ bg?: string }>`
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: ${(p) => p.bg ?? "var(--accent)"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  font-size: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
`;

// ─── Page Styled ────────────────────────────────────────────────────────────

const Page = styled.div`
  background: var(--bg-primary);
  min-height: 100vh;
  transition: background var(--transition-base);
`;

const HeroBar = styled.div`
  background:
    radial-gradient(120% 120% at 0% 0%, rgba(255, 149, 0, 0.2) 0%, transparent 45%),
    radial-gradient(100% 120% at 100% 100%, rgba(255, 149, 0, 0.12) 0%, transparent 40%),
    linear-gradient(160deg, #0d0f16 0%, #101522 55%, #151b2c 100%);
  padding: 26px 20px 34px;
  color: #fff;
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, transparent 25%, rgba(255,255,255,0.04) 45%, transparent 65%);
    opacity: 0.45;
    pointer-events: none;
  }
`;

const HeroTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const LiveBadge = styled.p`
  margin: 0;
  font-size: 0.74rem;
  color: rgba(255,255,255,0.72);
  font-weight: 700;
  letter-spacing: 0.03em;
`;

const StatusDot = styled.span<{ $on: boolean }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  background: ${(p) => (p.$on ? "var(--success)" : "#ff4b4b")};
  animation: ${pulseDot} 1.5s ease infinite;
  vertical-align: middle;
  box-shadow: 0 0 10px ${(p) => (p.$on ? "var(--success)" : "#ff4b4b")};
`;

const HeroTitle = styled.h1`
  font-size: clamp(1.5rem, 5vw, 2.35rem);
  font-weight: 900;
  margin: 0 0 8px;
  letter-spacing: -0.04em;
  line-height: 1.05;
`;

const HeroSub = styled.p`
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.72);
  margin: 0;
  font-weight: 600;
  max-width: 520px;
`;

const HeroMain = styled.div`
  display: grid;
  grid-template-columns: 1.35fr 0.9fr;
  gap: 12px;
  margin-bottom: 14px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const HeroKicker = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  padding: 6px 12px;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-weight: 800;
  color: rgba(255,255,255,0.9);
`;

const HeroRateCard = styled.div`
  border-radius: 18px;
  padding: 14px 14px 12px;
  background: linear-gradient(140deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03));
  border: 1px solid rgba(255,255,255,0.16);
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 108px;
`;

const RateLabel = styled.div`
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.68);
  font-weight: 700;
`;

const RateValue = styled.div`
  margin-top: 4px;
  font-size: clamp(1.2rem, 4vw, 1.8rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  color: #ffd23f;
`;

const RateSub = styled.div`
  margin-top: 2px;
  font-size: 0.72rem;
  color: rgba(255,255,255,0.76);
  font-weight: 600;
`;

const WalletChip = styled.div`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 6px 14px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  font-family: "SF Mono", "Fira Mono", monospace;
  font-weight: 700;
`;

const QuickStats = styled.div`
  display: grid;
  grid-template-columns: 1.25fr 1fr 1fr;
  gap: 12px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const QS = styled.div<{ $featured?: boolean }>`
  background: ${(p) =>
    p.$featured
      ? "linear-gradient(140deg, rgba(255,149,0,0.28), rgba(255,149,0,0.12))"
      : "rgba(255, 255, 255, 0.05)"};
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid ${(p) => (p.$featured ? "rgba(255, 199, 94, 0.45)" : "rgba(255, 255, 255, 0.08)")};
  border-radius: 18px;
  padding: ${(p) => (p.$featured ? "16px 14px" : "14px 12px")};
  text-align: left;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  &:active { transform: scale(0.96); }
  box-shadow: ${(p) => (p.$featured ? "0 12px 32px rgba(255,149,0,0.22)" : "none")};
`;

const QSValue = styled.div`
  font-size: clamp(1.15rem, 3vw, 1.45rem);
  font-weight: 900;
  color: #ffd23f;
  letter-spacing: -0.02em;
`;

const QSLabel = styled.div`
  font-size: 0.66rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 6px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

// ─── Helpers ────────────────────────────────────────────────────────────────

function shortAddr(a: string) {
  if (!a) return a;
  const normalized = a.startsWith("0:") ? a.slice(2) : a;
  if (normalized.length < 12) return normalized;
  return `${normalized.slice(0, 6)}…${normalized.slice(-4)}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

const CourierApp: React.FC = () => {
  const [tab, setTab] = useState<CourierTab>("feed");
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<BackendOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>("off");

  // ── Accept flow state ───────────────────────────────────────────────
  const [acceptPhase, setAcceptPhase] = useState<OverlayPhase | null>(null);
  const [acceptingOrder, setAcceptingOrder] = useState<BackendOrder | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const { connected, wallet, network } = useTonConnect();
  const {
    acceptDelivery,
    confirmDelivery,
    ready: contractReady,
  } = useTONEatsEscrow();
  const { socket, connected: socketConnected } = useSocket();
  const gpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch available orders ──────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setError(null);
    try {
      const [data] = await Promise.all([
        api.getAvailableOrders(),
        new Promise((r) => setTimeout(r, 800)),
      ]);
      setOrders(data);
    } catch (e: any) {
      setError(e.message ?? "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + restore active order
  useEffect(() => {
    if (!connected) return;
    fetchOrders();

    const saved = localStorage.getItem("ton_eats_active_order");
    if (saved) {
      try {
        setActiveOrder(JSON.parse(saved));
      } catch {}
    }
  }, [connected, fetchOrders]);

  // Persist active order
  useEffect(() => {
    if (activeOrder) {
      localStorage.setItem("ton_eats_active_order", JSON.stringify(activeOrder));
    } else {
      localStorage.removeItem("ton_eats_active_order");
    }
  }, [activeOrder]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!connected) return;
    const id = setInterval(fetchOrders, 30_000);
    return () => clearInterval(id);
  }, [connected, fetchOrders]);

  // ── Socket: real-time courier feed ─────────────────────────────────────
  useEffect(() => {
    if (!socket || !connected) return;
    socket.emit("join:couriers");

    const onNew = (order: BackendOrder) => {
      setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
    };
    const onTaken = (id: string) => {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    };
    socket.on("orders:new", onNew);
    socket.on("orders:taken", onTaken);
    socket.on("orders:available", (list: BackendOrder[]) => setOrders(list));

    return () => {
      socket.off("orders:new", onNew);
      socket.off("orders:taken", onTaken);
      socket.off("orders:available");
    };
  }, [socket, connected]);

  // ── GPS broadcast during active delivery ──────────────────────────────
  useEffect(() => {
    if (!activeOrder || !socket) {
      if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
      setGpsStatus("off");
      return;
    }

    const broadcast = () => {
      if (!navigator.geolocation) {
        setGpsStatus("error");
        return;
      }
      setGpsStatus("searching");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsStatus("broadcasting");
          socket.emit("courier:location", {
            orderId: activeOrder.orderId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => setGpsStatus("error"),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    broadcast();
    gpsIntervalRef.current = setInterval(broadcast, 5_000);
    return () => {
      if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
    };
  }, [activeOrder, socket]);

  // ── Accept a delivery (full-screen overlay flow) ──────────────────────
  const handleAccept = useCallback(
    async (order: BackendOrder) => {
      if (!wallet || !contractReady) return;
      setAcceptingId(order.id);
      setAcceptingOrder(order);
      setAcceptPhase("signing");
      setAcceptError(null);

      try {
        // 1. Send on-chain AcceptDelivery TX (this opens wallet, then polls)
        await acceptDelivery(BigInt(order.orderId), (phase: AcceptPhase) => {
          if (phase === "signing") setAcceptPhase("signing");
          else if (phase === "confirming") setAcceptPhase("confirming");
          else if (phase === "confirmed") setAcceptPhase("confirmed");
        });
      } catch (e: any) {
        // On-chain TX failed (user rejected in wallet or insufficient funds)
        setAcceptPhase("error");
        setAcceptError(e.message ?? "Transaction failed. Please try again.");
        setAcceptingId(null);
        return;
      }

      // 2. On-chain succeeded — update backend
      try {
        const updated = await api.acceptOrder(order.orderId, wallet);
        setOrders((prev) => prev.filter((o) => o.id !== order.id));

        // Brief "confirmed" pause, then transition to GPS
        setAcceptPhase("confirmed");
        await new Promise((r) => setTimeout(r, 1500));

        setActiveOrder(updated);
        setAcceptPhase(null);
        setAcceptingOrder(null);
      } catch (backendErr: any) {
        const backendMessage = backendErr.message ?? "Backend update failed.";

        // If backend says "already accepted" (409), treat as success — the
        // on-chain TX went through, so the courier IS the assigned driver.
        if (
          backendMessage.includes("already") ||
          backendMessage.includes("409")
        ) {
          // Fetch the latest order data regardless
          try {
            const latest = await api.getOrder(order.orderId);
            setOrders((prev) => prev.filter((o) => o.id !== order.id));
            setAcceptPhase("confirmed");
            await new Promise((r) => setTimeout(r, 1500));
            setActiveOrder(latest);
            setAcceptPhase(null);
            setAcceptingOrder(null);
          } catch {
            // Even if fetch fails, proceed with existing order data
            const fallbackOrder = { ...order, status: "accepted" as const, courierWallet: wallet };
            setOrders((prev) => prev.filter((o) => o.id !== order.id));
            setAcceptPhase("confirmed");
            await new Promise((r) => setTimeout(r, 1500));
            setActiveOrder(fallbackOrder);
            setAcceptPhase(null);
            setAcceptingOrder(null);
          }
        } else if (backendMessage.includes("not found")) {
          // Backend doesn't have this order (e.g., backend registration failed during checkout).
          // Still proceed since on-chain TX succeeded.
          setAcceptError("On-chain accept confirmed. We are syncing this order with the backend.");
          const fallbackOrder = { ...order, status: "accepted" as const, courierWallet: wallet };
          setOrders((prev) => prev.filter((o) => o.id !== order.id));
          setAcceptPhase("confirmed");
          await new Promise((r) => setTimeout(r, 1500));
          setActiveOrder(fallbackOrder);
          setAcceptPhase(null);
          setAcceptingOrder(null);
        } else {
          setAcceptPhase("error");
          setAcceptError(backendMessage);
        }
      } finally {
        setAcceptingId(null);
      }
    },
    [wallet, contractReady, acceptDelivery]
  );

  // ── Retry accept (after error) ────────────────────────────────────────
  const handleRetryAccept = useCallback(() => {
    if (acceptingOrder) {
      handleAccept(acceptingOrder);
    }
  }, [acceptingOrder, handleAccept]);

  // ── Cancel accept overlay ─────────────────────────────────────────────
  const handleCancelAccept = useCallback(() => {
    setAcceptPhase(null);
    setAcceptingOrder(null);
    setAcceptingId(null);
    setAcceptError(null);
  }, []);

  // ── Mark picked up ────────────────────────────────────────────────────
  const handlePickup = useCallback(async () => {
    if (!activeOrder || !wallet) return;
    const updated = await api.pickupOrder(activeOrder.orderId, wallet);
    setActiveOrder(updated);
  }, [activeOrder, wallet]);

  // ── Confirm delivery code ─────────────────────────────────────────────
  const handleConfirmCode = useCallback(
    async (code: string) => {
      if (!activeOrder || !wallet) return;
      await confirmDelivery(BigInt(activeOrder.orderId));
      await api.confirmDelivery(activeOrder.orderId, wallet, code);
    },
    [activeOrder, wallet, confirmDelivery]
  );

  // ── Complete delivery ─────────────────────────────────────────────────
  const handleComplete = useCallback(() => {
    setActiveOrder(null);
    if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
    setGpsStatus("off");
    fetchOrders();
  }, [fetchOrders]);

  // ── Cancel active delivery view (go back, not cancel order) ───────────
  const handleCancelView = useCallback(() => {
    // Don't actually cancel — just go back to feed, order stays active
    // Courier can resume from My Deliveries tab
    setTab("feed");
  }, []);

  // ── Resume delivery from My Deliveries ────────────────────────────────
  const handleResumeDelivery = useCallback((order: BackendOrder) => {
    setActiveOrder(order);
  }, []);

  // ─── WALLET GATE ──────────────────────────────────────────────────────
  if (!connected) {
    return (
      <Gate>
        <GateIcon>🛵</GateIcon>
        <GateTitle>Courier App</GateTitle>
        <GateSubtitle>
          Connect your TON wallet to start delivering and earning crypto.
        </GateSubtitle>
        <FeatureList>
          <FeatureItem>
            <FeatureIcon>
              <FontAwesomeIcon icon={faBagShopping} />
            </FeatureIcon>
            <span>Real orders from the smart contract</span>
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon bg="linear-gradient(135deg,#4caf50,#43a047)">
              <FontAwesomeIcon icon={faCoins} />
            </FeatureIcon>
            <span>Earn {DELIVERY_FEE_TON} TON per delivery</span>
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon bg="linear-gradient(135deg,#4285F4,#356FE0)">
              <FontAwesomeIcon icon={faMotorcycle} />
            </FeatureIcon>
            <span>GPS navigation to store & customer</span>
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon bg="linear-gradient(135deg,#9c27b0,#7b1fa2)">
              <FontAwesomeIcon icon={faShieldHalved} />
            </FeatureIcon>
            <span>Trustless — smart contract escrow</span>
          </FeatureItem>
        </FeatureList>
        <TonConnectButton />
      </Gate>
    );
  }

  // ─── ACCEPTING OVERLAY (full-screen loader) ──────────────────────────
  if (acceptPhase && acceptingOrder) {
    return (
      <AcceptingOverlay
        phase={acceptPhase}
        orderLabel={`Order #${acceptingOrder.orderId.slice(-6)}`}
        earnings={acceptingOrder.deliveryFeeTon.toFixed(2)}
        errorMessage={acceptError ?? undefined}
        onRetry={handleRetryAccept}
        onCancel={acceptPhase === "error" || acceptPhase === "signing" ? handleCancelAccept : undefined}
      />
    );
  }

  // ─── ACTIVE DELIVERY (full-screen) ────────────────────────────────────
  if (activeOrder) {
    return (
      <ActiveDelivery
        order={activeOrder}
        onPickup={handlePickup}
        onConfirmCode={handleConfirmCode}
        onCancel={handleCancelView}
        onComplete={handleComplete}
        gpsStatus={gpsStatus}
      />
    );
  }

  // ─── MAIN APP (with bottom nav) ──────────────────────────────────────
  return (
    <Page>
      <Header showConnectButton />

      {/* Hero bar */}
      <HeroBar>
        <HeroTop>
          <LiveBadge>
            <StatusDot $on={socketConnected} />
            {socketConnected ? "Live feed online" : "Reconnecting live feed…"}
          </LiveBadge>
          {wallet && <WalletChip title={wallet}>{shortAddr(wallet)}</WalletChip>}
        </HeroTop>

        <HeroMain>
          <div>
            <HeroKicker>
              <FontAwesomeIcon icon={faMotorcycle} />
              Courier mode
            </HeroKicker>
            <HeroTitle>Ready to pick your next delivery</HeroTitle>
            <HeroSub>Accept live orders, lock confirmation on-chain, and complete each route with confidence.</HeroSub>
          </div>
          <HeroRateCard>
            <RateLabel>Payout per completed route</RateLabel>
            <RateValue>{DELIVERY_FEE_TON.toFixed(1)} TON</RateValue>
            <RateSub>Escrow-backed settlement</RateSub>
          </HeroRateCard>
        </HeroMain>

        <QuickStats>
          <QS $featured>
            <QSValue>{orders.length}</QSValue>
            <QSLabel>Open Orders</QSLabel>
          </QS>
          <QS>
            <QSValue>{DELIVERY_FEE_TON.toFixed(1)}</QSValue>
            <QSLabel>TON per route</QSLabel>
          </QS>
          <QS>
            <QSValue>{activeOrder ? "1" : "0"}</QSValue>
            <QSLabel>Active Route</QSLabel>
          </QS>
        </QuickStats>
      </HeroBar>

      {/* Tab content */}
      {tab === "feed" && (
        <OrderFeed
          orders={orders}
          loading={loading}
          error={error}
          contractReady={contractReady}
          acceptingId={acceptingId}
          onAccept={handleAccept}
          onRefresh={fetchOrders}
        />
      )}

      {tab === "my-orders" && wallet && (
        <MyDeliveries
          courierWallet={wallet}
          onResumeDelivery={handleResumeDelivery}
        />
      )}

      {tab === "earnings" && wallet && <Earnings wallet={wallet} />}

      {/* Bottom nav */}
      <BottomNav
        active={tab}
        onChange={setTab}
        orderCount={orders.length}
        hasActiveDelivery={!!activeOrder}
      />
    </Page>
  );
};

export default CourierApp;
