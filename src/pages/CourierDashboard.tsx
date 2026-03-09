/**
 * TON-Eats CourierDashboard.tsx
 *
 * The full Deliveroo-style courier experience.
 * 100% real data — no mocks.
 *
 * Screens:
 *  1. GATE      — Wallet not connected → connect prompt
 *  2. FEED      — List of open orders pulled from backend (real-time via Socket.io)
 *  3. ACTIVE    — Courier has accepted an order:
 *                  • Broadcasts GPS every 5s
 *                  • Shows pickup address → delivery address steps
 *                  • Code entry box to confirm delivery
 *  4. EARNINGS  — Real on-chain tx history from TonAPI
 */

import React, { useState, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMotorcycle,
    faLocationDot,
    faBagShopping,
    faCheck,
    faSpinner,
    faClockRotateLeft,
    faCircleDollarToSlot,
    faRotateRight,
    faBoxOpen,
    faTriangleExclamation,
    faShieldHalved,
    faCoins,
    faArrowRight,
    faKeyboard,
    faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { TonConnectButton } from "@tonconnect/ui-react";
import Header from "../components/Header";
import WalletTxList from "../components/WalletTxList";
import { useTONEatsEscrow, DELIVERY_FEE_TON } from "../hooks/useTONEatsEscrow";
import { useTonConnect } from "../hooks/useTonConnect";
import LoadingAnimation from "../components/LoadingAnimation";
import { useSocket } from "../hooks/useSocket";
import { api, BackendOrder } from "../services/api";

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeUp = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}`;
const spin = keyframes`to{transform:rotate(360deg)}`;
const pulseDot = keyframes`0%,100%{opacity:1}50%{opacity:0.3}`;
const scaleIn = keyframes`from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}`;
const pulseRing = keyframes`0%{box-shadow:0 0 0 0 rgba(255,107,53,0.4)}70%{box-shadow:0 0 0 16px rgba(255,107,53,0)}100%{box-shadow:0 0 0 0 rgba(255,107,53,0)}`;

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  background: #f4f4f4;
  min-height: 100vh;
  padding-bottom: 40px;
`;

// ── Wallet Gate ───────────────────────────────────────────────────────────────

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

const GateIcon = styled.div`font-size: 4rem;`;
const GateTitle = styled.h1`font-size: 1.7rem;font-weight:900;color:#fff;margin:0;`;
const GateSubtitle = styled.p`font-size:0.9rem;color:rgba(255,255,255,0.6);max-width:270px;line-height:1.6;margin:0;`;

const FeatureList = styled.ul`list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px;width:100%;max-width:300px;`;
const FeatureItem = styled.li`
  display:flex;align-items:center;gap:12px;
  background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
  border-radius:14px;padding:12px 16px;font-size:0.88rem;color:rgba(255,255,255,0.8);text-align:left;
`;
const FeatureIcon = styled.div<{ bg?: string }>`
  width:32px;height:32px;border-radius:10px;
  background:${p => p.bg ?? 'linear-gradient(135deg,#FF6B35,#F7931E)'};
  display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:0.85rem;
`;

// ── Hero ──────────────────────────────────────────────────────────────────────

const Hero = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%);
  padding: 20px 20px 26px;
  color: #fff;
`;

const HeroTop = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;`;
const StatusDot = styled.span<{ $on: boolean }>`
  display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;
  background:${p => p.$on ? '#4caf50' : '#ff5252'};
  animation:${pulseDot} 1.5s ease infinite;vertical-align:middle;
`;
const HeroTitle = styled.h1`font-size:1.4rem;font-weight:900;margin:0 0 2px;`;
const HeroSub = styled.p`font-size:0.82rem;color:rgba(255,255,255,0.6);margin:0 0 16px;`;
const WalletChip = styled.div`
  background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);
  border-radius:20px;padding:4px 12px;font-size:0.7rem;color:rgba(255,255,255,0.7);
  font-family:'SF Mono',monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px;
`;

const EarningsStrip = styled.div`display:flex;gap:10px;`;
const ECard = styled.div`
  flex:1;background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);
  border:1px solid rgba(255,255,255,0.15);border-radius:14px;padding:12px;text-align:center;
`;
const EValue = styled.div`font-size:1.1rem;font-weight:800;color:#FFD23F;`;
const ELabel = styled.div`font-size:0.65rem;color:rgba(255,255,255,0.6);margin-top:2px;`;

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TabBar = styled.div`display:flex;background:#fff;border-bottom:1px solid rgba(0,0,0,0.06);position:sticky;top:0;z-index:10;`;
const Tab = styled.button<{ $active: boolean }>`
  flex:1;padding:13px;border:none;background:transparent;
  font-size:0.88rem;font-weight:${p => p.$active ? '800' : '500'};
  color:${p => p.$active ? '#FF6B35' : '#888'};
  border-bottom:3px solid ${p => p.$active ? '#FF6B35' : 'transparent'};
  cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:6px;
`;

// ── Order Card ────────────────────────────────────────────────────────────────

const CardList = styled.div`display:flex;flex-direction:column;gap:12px;padding:14px;`;
const Card = styled.div<{ $delay?: number; $accepted?: boolean }>`
  background:#fff;border-radius:20px;padding:18px;
  box-shadow:0 4px 16px rgba(0,0,0,0.07);
  animation:${fadeUp} 0.35s ease ${p => (p.$delay ?? 0) * 0.07}s both;
  border:2px solid ${p => p.$accepted ? '#4caf50' : 'transparent'};
  transition:border-color 0.3s;
`;
const CardHeader = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;`;
const OrderId = styled.span`font-weight:800;font-size:0.88rem;color:#1a1a1a;font-family:'SF Mono',monospace;`;
const Badge = styled.span<{ $color: string }>`background:${p => p.$color};color:#fff;font-size:0.68rem;font-weight:700;padding:3px 10px;border-radius:20px;`;

const Row = styled.div`display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;font-size:0.85rem;color:#555;`;
const Icon = styled.div<{ $bg?: string }>`
  width:26px;height:26px;border-radius:8px;
  background:${p => p.$bg ?? 'linear-gradient(135deg,#FF6B35,#F7931E)'};
  color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.7rem;flex-shrink:0;
`;
const InfoVal = styled.div`flex:1;font-size:0.82rem;`;

const EarnChip = styled.div`
  display:inline-flex;align-items:center;gap:6px;
  background:linear-gradient(90deg,#e8f5e9,#c8e6c9);color:#2e7d32;
  font-weight:800;font-size:0.9rem;padding:6px 14px;border-radius:12px;margin-top:8px;
`;

const AcceptBtn = styled.button<{ $disabled?: boolean; $accepted?: boolean }>`
  width:100%;padding:14px;border-radius:14px;border:none;margin-top:14px;
  font-size:0.95rem;font-weight:800;cursor:${p => p.$disabled ? 'not-allowed' : 'pointer'};
  background:${p => p.$accepted ? 'linear-gradient(135deg,#4caf50,#43a047)' : p.$disabled ? '#e0e0e0' : 'linear-gradient(135deg,#1a1a2e,#0f3460)'};
  color:${p => p.$disabled && !p.$accepted ? '#aaa' : '#fff'};
  box-shadow:${p => p.$accepted ? '0 4px 14px rgba(76,175,80,0.4)' : p.$disabled ? 'none' : '0 4px 14px rgba(15,52,96,0.4)'};
  transition:all 0.3s;display:flex;align-items:center;justify-content:center;gap:8px;
  &:active:not(:disabled){transform:scale(0.97);}
`;

// ── Active Delivery Panel ─────────────────────────────────────────────────────

const ActivePanel = styled.div`padding:14px;animation:${fadeUp} 0.4s ease;`;

const ActiveBanner = styled.div`
  background:linear-gradient(135deg,#e65100,#FF6B35);
  color:#fff;border-radius:20px;padding:18px;margin-bottom:14px;
  animation:${pulseRing} 2s ease-in-out infinite;
`;

const ActiveTitle = styled.p`font-size:1rem;font-weight:900;margin:0 0 4px;`;
const ActiveSub = styled.p`font-size:0.8rem;color:rgba(255,255,255,0.75);margin:0;`;

const StepCard = styled.div`background:#fff;border-radius:18px;padding:16px;margin-bottom:12px;box-shadow:0 4px 14px rgba(0,0,0,0.07);`;
const StepTitle = styled.p`font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#aaa;margin:0 0 6px;`;
const StepValue = styled.p`font-size:0.9rem;font-weight:600;color:#1a1a1a;margin:0;`;

const CodeSection = styled.div`background:#fff;border-radius:18px;padding:18px;box-shadow:0 4px 14px rgba(0,0,0,0.07);`;
const CodeTitle = styled.p`font-size:0.85rem;font-weight:800;color:#1a1a1a;margin:0 0 12px;`;
const CodeInput = styled.input`
  width:100%;padding:14px 16px;border-radius:12px;
  border:2px solid rgba(0,0,0,0.1);font-size:1.4rem;font-weight:900;
  letter-spacing:0.2em;text-align:center;font-family:'SF Mono',monospace;
  color:#1a1a2e;background:#f9f9f9;transition:border-color 0.2s;margin-bottom:12px;
  &:focus{outline:none;border-color:#FF6B35;}
`;
const ConfirmBtn = styled.button<{ $disabled?: boolean }>`
  width:100%;padding:14px;border-radius:14px;border:none;
  background:${p => p.$disabled ? '#e0e0e0' : 'linear-gradient(135deg,#4caf50,#2e7d32)'};
  color:${p => p.$disabled ? '#aaa' : '#fff'};font-size:0.95rem;font-weight:800;
  cursor:${p => p.$disabled ? 'not-allowed' : 'pointer'};
  display:flex;align-items:center;justify-content:center;gap:8px;
  box-shadow:${p => p.$disabled ? 'none' : '0 6px 16px rgba(76,175,80,0.4)'};
  transition:all 0.2s;
`;

// ── Utility States ─────────────────────────────────────────────────────────────

const Center = styled.div`
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:48px 24px;gap:14px;text-align:center;color:#888;
`;
const StateMsg = styled.p`font-size:0.9rem;max-width:260px;line-height:1.5;margin:0;`;
const Refresh = styled.button`
  padding:10px 22px;border-radius:12px;border:none;
  background:linear-gradient(135deg,#FF6B35,#F7931E);color:#fff;font-weight:700;font-size:0.88rem;
  cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(255,107,53,0.35);
  &:active{transform:scale(0.96);}
`;
const SpinIcon = styled(FontAwesomeIcon)`animation:${spin} 1s linear infinite;`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortAddr(a: string) {
    if (!a || a.length < 12) return a;
    return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

type TabType = "deliveries" | "earnings";

// ─── Component ────────────────────────────────────────────────────────────────

const CourierDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>("deliveries");
    const [orders, setOrders] = useState<BackendOrder[]>([]);
    const [activeOrder, setActiveOrder] = useState<BackendOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);
    const [codeInput, setCodeInput] = useState("");
    const [confirming, setConfirming] = useState(false);
    const [confirmError, setConfirmError] = useState<string | null>(null);
    const [confirmed, setConfirmed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Real earnings from on-chain (populated via WalletTxList component)
    // Local state for GPS status
    const [gpsStatus, setGpsStatus] = useState<"off" | "searching" | "broadcasting" | "error">("off");
    const [deliveryCount] = useState(0);

    const { connected, wallet, network } = useTonConnect();
    const { acceptDelivery, confirmDelivery, ready: contractReady } = useTONEatsEscrow();
    const { socket, connected: socketConnected } = useSocket();
    const gpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Fetch available orders ──────────────────────────────────────────────
    const fetchOrders = async () => {
        setError(null);
        try {
            const [data] = await Promise.all([
                api.getAvailableOrders(),
                new Promise(r => setTimeout(r, 1500)),
            ]);
            setOrders(data);
        } catch (e: any) {
            setError(e.message ?? "Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (connected) {
            fetchOrders();
            // Load active order from storage if exists
            const saved = localStorage.getItem("ton_eats_active_order");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setActiveOrder(parsed);
                } catch (e) { console.error("Failed to load active order", e); }
            }
        }
    }, [connected]);

    // Save active order whenever it changes
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
    }, [connected]);

    // ── Socket: real-time courier feed ─────────────────────────────────────
    useEffect(() => {
        if (!socket || !connected) return;
        socket.emit("join:couriers");

        const onNew = (order: BackendOrder) => {
            setOrders(prev => [order, ...prev.filter(o => o.id !== order.id)]);
        };
        const onTaken = (id: string) => {
            setOrders(prev => prev.filter(o => o.id !== id));
        };
        socket.on("orders:new", onNew);
        socket.on("orders:taken", onTaken);
        socket.on("orders:available", (list: BackendOrder[]) => setOrders(list));

        return () => {
            socket.off("orders:new", onNew);
            socket.off("orders:taken", onTaken);
        };
    }, [socket, connected]);

    // ── GPS broadcast when actively delivering ──────────────────────────────
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
                pos => {
                    setGpsStatus("broadcasting");
                    socket.emit("courier:location", {
                        orderId: activeOrder.orderId, // Important: use the timestamp ID that buyer listens to
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    });
                },
                err => {
                    console.error("GPS Error:", err);
                    setGpsStatus("error");
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        };

        broadcast();
        gpsIntervalRef.current = setInterval(broadcast, 5_000);
        return () => {
            if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
        };
    }, [activeOrder, socket]);

    // ── Accept a delivery ───────────────────────────────────────────────────
    const handleAccept = async (order: BackendOrder) => {
        if (!wallet || !contractReady) return;
        setAcceptingId(order.id);
        try {
            // 1. Sign on-chain accept_delivery tx
            await acceptDelivery(BigInt(order.orderId));
            // 2. Register with backend → emits order:accepted to buyer
            const updated = await api.acceptOrder(order.id, wallet);
            setActiveOrder(updated);
            setOrders(prev => prev.filter(o => o.id !== order.id));
        } catch (e: any) {
            console.error("[Courier] Accept failed:", e);
        } finally {
            setAcceptingId(null);
        }
    };

    // ── Mark picked up ──────────────────────────────────────────────────────
    const handlePickup = async () => {
        if (!activeOrder || !wallet) return;
        try {
            const updated = await api.pickupOrder(activeOrder.id, wallet);
            setActiveOrder(updated);
        } catch (e) { console.error(e); }
    };

    // ── Confirm delivery code ───────────────────────────────────────────────
    const handleConfirmCode = async () => {
        if (!activeOrder || !wallet || codeInput.length !== 4) return;
        setConfirming(true);
        setConfirmError(null);
        try {
            // 1. Courier signs on-chain confirmation to release funds (0.05 TON gas)
            //    IMPORTANT: use orderId (timestamp) not id (UUID) for the on-chain call
            await confirmDelivery(BigInt(activeOrder.orderId));

            // 2. We inform backend that the order is complete with the strict PIN
            await api.confirmDelivery(activeOrder.id, wallet, codeInput);

            setConfirmed(true);
            setActiveOrder(null);
            if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
        } catch (e: any) {
            setConfirmError(e.message ?? "Invalid code");
        } finally {
            setConfirming(false);
        }
    };

    // ── Wallet Gate ─────────────────────────────────────────────────────────
    if (!connected) {
        return (
            <Gate>
                <GateIcon>🛵</GateIcon>
                <GateTitle>Courier Login</GateTitle>
                <GateSubtitle>Connect your TON wallet to receive real orders and earn crypto on-chain.</GateSubtitle>
                <FeatureList>
                    <FeatureItem>
                        <FeatureIcon><FontAwesomeIcon icon={faBagShopping} /></FeatureIcon>
                        <span>Live orders from the escrow contract</span>
                    </FeatureItem>
                    <FeatureItem>
                        <FeatureIcon bg="linear-gradient(135deg,#4caf50,#43a047)">
                            <FontAwesomeIcon icon={faCoins} />
                        </FeatureIcon>
                        <span>Earn {DELIVERY_FEE_TON} TON per delivery, auto-sent</span>
                    </FeatureItem>
                    <FeatureItem>
                        <FeatureIcon bg="linear-gradient(135deg,#9c27b0,#7b1fa2)">
                            <FontAwesomeIcon icon={faShieldHalved} />
                        </FeatureIcon>
                        <span>Trustless — smart contract holds the funds</span>
                    </FeatureItem>
                </FeatureList>
                <TonConnectButton />
            </Gate>
        );
    }

    return (
        <Page>
            <Header showConnectButton />

            {/* ── Hero ── */}
            <Hero>
                <HeroTop>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>
                        <StatusDot $on={connected} />
                        {socketConnected ? "Online · Live feed active" : "Connecting…"}
                    </p>
                    {wallet && <WalletChip title={wallet}>{shortAddr(wallet)}</WalletChip>}
                </HeroTop>
                <HeroTitle>Courier Dashboard</HeroTitle>
                <HeroSub>TON-Eats · Real orders · Earn crypto on-chain 🚀</HeroSub>
                <EarningsStrip>
                    <ECard>
                        <EValue>{orders.length}</EValue>
                        <ELabel>Open Orders</ELabel>
                    </ECard>
                    <ECard>
                        <EValue>{DELIVERY_FEE_TON.toFixed(1)}</EValue>
                        <ELabel>TON / delivery</ELabel>
                    </ECard>
                    <ECard>
                        <EValue>{activeOrder ? "1" : "0"}</EValue>
                        <ELabel>Active Run</ELabel>
                    </ECard>
                </EarningsStrip>
            </Hero>

            {/* ── Tabs ── */}
            <TabBar>
                <Tab $active={activeTab === "deliveries"} onClick={() => setActiveTab("deliveries")} id="tab-deliveries">
                    <FontAwesomeIcon icon={faBagShopping} />
                    {activeOrder ? "Active Delivery" : `Available (${orders.length})`}
                </Tab>
                <Tab $active={activeTab === "earnings"} onClick={() => setActiveTab("earnings")} id="tab-earnings">
                    <FontAwesomeIcon icon={faClockRotateLeft} />
                    Earnings
                </Tab>
            </TabBar>

            {/* ── Deliveries Tab ── */}
            {activeTab === "deliveries" && (
                <>
                    {/* ── ACTIVE DELIVERY ── */}
                    {activeOrder && !confirmed && (
                        <ActivePanel>
                            <ActiveBanner>
                                <ActiveTitle>🛵 Delivery in progress!</ActiveTitle>
                                <ActiveSub>
                                    {gpsStatus === "broadcasting" && "✅ Live GPS: broadcasting location"}
                                    {gpsStatus === "searching" && "⏳ Live GPS: finding your location..."}
                                    {gpsStatus === "error" && "⚠️ Live GPS: error (check permissions)"}
                                    {gpsStatus === "off" && "GPS inactive"}
                                </ActiveSub>
                            </ActiveBanner>

                            {/* Step 1: Pickup */}
                            <StepCard>
                                <StepTitle>① Pick up from merchant</StepTitle>
                                <StepValue>Wallet: {shortAddr(activeOrder.merchantWallet)}</StepValue>
                                <StepValue style={{ marginTop: 4, fontSize: "0.78rem", color: "#888" }}>
                                    {activeOrder.items.map(i => `${i.qty}× ${i.name}`).join(", ")}
                                </StepValue>
                                {activeOrder.status === "accepted" && (
                                    <AcceptBtn
                                        $disabled={false}
                                        style={{ marginTop: 12 }}
                                        onClick={handlePickup}
                                    >
                                        <FontAwesomeIcon icon={faArrowRight} />
                                        I've picked up the order
                                    </AcceptBtn>
                                )}
                            </StepCard>

                            {/* Step 2: Deliver */}
                            {["picked_up", "delivered"].includes(activeOrder.status) && (
                                <StepCard>
                                    <StepTitle>② Deliver to customer</StepTitle>
                                    <StepValue>📍 {activeOrder.deliveryAddress}</StepValue>
                                </StepCard>
                            )}

                            {/* Step 3: Confirmation code */}
                            {activeOrder.status === "picked_up" && (
                                <CodeSection>
                                    <CodeTitle>③ Enter the customer's code</CodeTitle>
                                    <CodeInput
                                        type="number"
                                        maxLength={4}
                                        placeholder="••••"
                                        value={codeInput}
                                        onChange={e => {
                                            setCodeInput(e.target.value.slice(0, 4));
                                            setConfirmError(null);
                                        }}
                                    />
                                    {confirmError && (
                                        <p style={{ color: "#f44336", fontSize: "0.82rem", margin: "0 0 10px", textAlign: "center" }}>
                                            ❌ {confirmError}
                                        </p>
                                    )}
                                    <ConfirmBtn $disabled={codeInput.length !== 4 || confirming} onClick={handleConfirmCode}>
                                        {confirming ? <SpinIcon icon={faSpinner} /> : <FontAwesomeIcon icon={faCheckCircle} />}
                                        {confirming ? "Verifying…" : "Confirm Delivery & Get Paid"}
                                    </ConfirmBtn>
                                </CodeSection>
                            )}
                        </ActivePanel>
                    )}

                    {/* ── DELIVERY COMPLETE CELEBRATION ── */}
                    {confirmed && (
                        <Center>
                            <div style={{ fontSize: "3rem" }}>🎉</div>
                            <p style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>Payment sent on-chain!</p>
                            <StateMsg>The smart contract auto-sent your delivery fee. Check your wallet.</StateMsg>
                            <Refresh onClick={() => { setConfirmed(false); fetchOrders(); }}>
                                Back to orders
                            </Refresh>
                        </Center>
                    )}

                    {/* ── ORDER FEED ── */}
                    {!activeOrder && !confirmed && (
                        <>
                            {loading ? (
                                <Center>
                                    <LoadingAnimation message="Loading available deliveries…" size={140} />
                                </Center>
                            ) : error ? (
                                <Center>
                                    <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "2rem", color: "#f44336" }} />
                                    <StateMsg>{error}</StateMsg>
                                    <Refresh onClick={fetchOrders}><FontAwesomeIcon icon={faRotateRight} />Retry</Refresh>
                                </Center>
                            ) : orders.length === 0 ? (
                                <Center>
                                    <FontAwesomeIcon icon={faBoxOpen} style={{ fontSize: "2rem", opacity: 0.4 }} />
                                    <StateMsg>No open deliveries right now. Hang tight!</StateMsg>
                                    <Refresh onClick={fetchOrders}><FontAwesomeIcon icon={faRotateRight} />Refresh</Refresh>
                                </Center>
                            ) : (
                                <CardList>
                                    {orders.map((order, i) => {
                                        const isAccepting = acceptingId === order.id;
                                        return (
                                            <Card key={order.id} $delay={i}>
                                                <CardHeader>
                                                    <OrderId>Order #{order.orderId}</OrderId>
                                                    <Badge $color="#2196f3">Open</Badge>
                                                </CardHeader>

                                                <Row>
                                                    <Icon><FontAwesomeIcon icon={faLocationDot} /></Icon>
                                                    <InfoVal>
                                                        <strong>Delivery address</strong><br />
                                                        {order.deliveryAddress}
                                                    </InfoVal>
                                                </Row>

                                                <Row>
                                                    <Icon $bg="linear-gradient(135deg,#9c27b0,#7b1fa2)">
                                                        <FontAwesomeIcon icon={faBagShopping} />
                                                    </Icon>
                                                    <InfoVal>
                                                        {order.items.length > 0
                                                            ? order.items.map(it => `${it.qty}× ${it.name}`).join(", ")
                                                            : "Items not specified"}
                                                    </InfoVal>
                                                </Row>

                                                <Row>
                                                    <Icon $bg="linear-gradient(135deg,#4caf50,#43a047)">
                                                        <FontAwesomeIcon icon={faCircleDollarToSlot} />
                                                    </Icon>
                                                    <InfoVal>
                                                        <strong>Your earnings</strong><br />
                                                        {order.deliveryFeeTon.toFixed(3)} TON
                                                    </InfoVal>
                                                </Row>

                                                <EarnChip>
                                                    <FontAwesomeIcon icon={faCircleDollarToSlot} />
                                                    Earn {order.deliveryFeeTon.toFixed(3)} TON
                                                </EarnChip>

                                                <AcceptBtn
                                                    id={`accept-${order.id}`}
                                                    $disabled={!contractReady || isAccepting}
                                                    onClick={() => handleAccept(order)}
                                                >
                                                    {isAccepting ? (
                                                        <><SpinIcon icon={faSpinner} /> Signing on-chain…</>
                                                    ) : (
                                                        <><FontAwesomeIcon icon={faMotorcycle} /> Accept &amp; Earn {order.deliveryFeeTon.toFixed(3)} TON</>
                                                    )}
                                                </AcceptBtn>
                                            </Card>
                                        );
                                    })}
                                </CardList>
                            )}
                        </>
                    )}
                </>
            )}

            {/* ── Earnings Tab ── */}
            {activeTab === "earnings" && (
                <div style={{ padding: "0 16px 16px" }}>
                    {wallet ? (
                        <div style={{ marginTop: 16 }}>
                            <p style={{ color: "#888", fontSize: "0.8rem", margin: "0 0 12px", textAlign: "center" }}>
                                On-chain transactions for{" "}
                                <code style={{ fontSize: "0.75rem", background: "#f0f0f0", padding: "2px 6px", borderRadius: 6 }}>
                                    {shortAddr(wallet)}
                                </code>
                            </p>
                            <WalletTxList walletAddress={wallet} />
                        </div>
                    ) : (
                        <Center><StateMsg>Connect your wallet to see earnings.</StateMsg></Center>
                    )}
                </div>
            )}
        </Page>
    );
};

export default CourierDashboard;
