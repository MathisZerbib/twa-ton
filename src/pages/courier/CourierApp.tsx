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

const scaleIn = keyframes`from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}`;
const pulseDot = keyframes`0%,100%{opacity:1}50%{opacity:0.3}`;

// ─── Gate Styled ────────────────────────────────────────────────────────────

const Gate = styled.div`
  min-height: 100vh;
  background: linear-gradient(160deg, #0f0c29 0%, #1a1040 60%, #24243e 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  text-align: center;
  gap: 20px;
  animation: ${scaleIn} 0.4s ease;
`;

const GateIcon = styled.div`
  font-size: 4rem;
`;
const GateTitle = styled.h1`
  font-size: 1.7rem;
  font-weight: 900;
  color: #fff;
  margin: 0;
`;
const GateSubtitle = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  max-width: 270px;
  line-height: 1.6;
  margin: 0;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 300px;
`;
const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 12px 16px;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.8);
  text-align: left;
`;
const FeatureIcon = styled.div<{ bg?: string }>`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: ${(p) => p.bg ?? "linear-gradient(135deg,#FF6B35,#F7931E)"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  font-size: 0.85rem;
`;

// ─── Page Styled ────────────────────────────────────────────────────────────

const Page = styled.div`
  background: #f4f4f4;
  min-height: 100vh;
`;

const HeroBar = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%);
  padding: 16px 20px 20px;
  color: #fff;
`;

const HeroTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const StatusDot = styled.span<{ $on: boolean }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  background: ${(p) => (p.$on ? "#4caf50" : "#ff5252")};
  animation: ${pulseDot} 1.5s ease infinite;
  vertical-align: middle;
`;

const HeroTitle = styled.h1`
  font-size: 1.3rem;
  font-weight: 900;
  margin: 0 0 2px;
`;

const HeroSub = styled.p`
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.55);
  margin: 0 0 12px;
`;

const WalletChip = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.65);
  font-family: "SF Mono", monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
`;

const QuickStats = styled.div`
  display: flex;
  gap: 8px;
`;

const QS = styled.div`
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  padding: 10px;
  text-align: center;
`;

const QSValue = styled.div`
  font-size: 1.05rem;
  font-weight: 800;
  color: #ffd23f;
`;

const QSLabel = styled.div`
  font-size: 0.62rem;
  color: rgba(255, 255, 255, 0.55);
  margin-top: 2px;
`;

// ─── Helpers ────────────────────────────────────────────────────────────────

function shortAddr(a: string) {
  if (!a || a.length < 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
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
        await acceptDelivery(BigInt(order.orderId), (phase: AcceptPhase) => {
          if (phase === "signing") setAcceptPhase("signing");
          else if (phase === "confirming") setAcceptPhase("confirming");
          else if (phase === "confirmed") setAcceptPhase("confirmed");
        });

        // On-chain done — update backend
        const updated = await api.acceptOrder(order.id, wallet);
        setOrders((prev) => prev.filter((o) => o.id !== order.id));

        // Brief "confirmed" pause, then transition to GPS
        setAcceptPhase("confirmed");
        await new Promise((r) => setTimeout(r, 1500));

        setActiveOrder(updated);
        setAcceptPhase(null);
        setAcceptingOrder(null);
      } catch (e: any) {
        console.error("[Courier] Accept failed:", e);
        setAcceptPhase("error");
        setAcceptError(e.message ?? "Transaction failed. Please try again.");
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
    const updated = await api.pickupOrder(activeOrder.id, wallet);
    setActiveOrder(updated);
  }, [activeOrder, wallet]);

  // ── Confirm delivery code ─────────────────────────────────────────────
  const handleConfirmCode = useCallback(
    async (code: string) => {
      if (!activeOrder || !wallet) return;
      await confirmDelivery(BigInt(activeOrder.orderId));
      await api.confirmDelivery(activeOrder.id, wallet, code);
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
          <p
            style={{
              margin: 0,
              fontSize: "0.73rem",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            <StatusDot $on={socketConnected} />
            {socketConnected ? "Online · Live feed" : "Connecting…"}
          </p>
          {wallet && <WalletChip title={wallet}>{shortAddr(wallet)}</WalletChip>}
        </HeroTop>
        <HeroTitle>Courier Dashboard</HeroTitle>
        <HeroSub>Accept orders · Navigate · Earn TON</HeroSub>
        <QuickStats>
          <QS>
            <QSValue>{orders.length}</QSValue>
            <QSLabel>Available</QSLabel>
          </QS>
          <QS>
            <QSValue>{DELIVERY_FEE_TON.toFixed(1)}</QSValue>
            <QSLabel>TON / delivery</QSLabel>
          </QS>
          <QS>
            <QSValue>{activeOrder ? "1" : "0"}</QSValue>
            <QSLabel>Active</QSLabel>
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
