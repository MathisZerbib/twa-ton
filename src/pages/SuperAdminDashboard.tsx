/**
 * SuperAdminDashboard.tsx — Full admin panel for TON-Eats
 *
 * Features:
 *  • Platform-wide stats (orders, revenue, users)
 *  • Live order table with search & status filtering
 *  • Cancel any order (with confirmation)
 *  • Merchant overview
 *  • Auto-refresh every 15s
 */

import React, { useState, useEffect, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChartLine,
    faBoxOpen,
    faUsers,
    faStore,
    faMotorcycle,
    faCoins,
    faBan,
    faSearch,
    faRotateRight,
    faSpinner,
    faCheckCircle,
    faClock,
    faTruck,
    faTriangleExclamation,
    faShieldHalved,
    faArrowLeft,
    faArrowRight,
    faFilter,
    faReceipt,
    faCircleDollarToSlot,
    faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { api, BackendOrder, AdminStats } from "../services/api";

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeUp = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;
const spin = keyframes`to{transform:rotate(360deg)}`;
const scaleIn = keyframes`from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}`;

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  background: var(--bg-primary);
  min-height: 100vh;
    color: var(--text-primary);
`;

const TopBar = styled.div`
    background: var(--bg-secondary);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
    border-bottom: 1px solid var(--bg-tertiary);
    box-shadow: var(--shadow-sm);
`;
const TopLeft = styled.div`display: flex; align-items: center; gap: 16px;`;
const BackBtn = styled.button`
    background: var(--bg-primary);
    border: 1px solid var(--bg-tertiary);
    border-radius: 12px; width: 40px; height: 40px; color: var(--text-primary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all var(--transition-fast);
  &:active { transform: scale(0.9); }
`;
const Title = styled.h1`font-size: 1.4rem; font-weight: 900; margin: 0; color: var(--text-primary); letter-spacing: -0.02em;`;
const SubTitle = styled.p`font-size: 0.75rem; color: var(--text-hint); margin: 4px 0 0; font-weight: 500;`;
const RefreshBtn = styled.button<{ $spinning?: boolean }>`
  background: hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.15); 
  border: 1px solid hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.3);
  border-radius: 12px; padding: 10px 18px; color: var(--accent);
  font-size: 0.85rem; font-weight: 800; cursor: pointer;
  display: flex; align-items: center; gap: 8px;
  transition: all var(--transition-base);
  &:active { transform: scale(0.95); }
`;

// ── Stat Cards ────────────────────────────────────────────────────────────────

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  padding: 24px 24px 0;
`;
const StatCard = styled.div<{ $delay?: number; $accent?: string }>`
    background: var(--bg-secondary);
  backdrop-filter: blur(8px);
    border: 1px solid ${p => p.$accent ? p.$accent + '2e' : 'var(--bg-tertiary)'};
  border-radius: 20px;
  padding: 20px;
  animation: ${fadeUp} 0.5s var(--transition-smooth) ${p => (p.$delay ?? 0) * 0.08}s both;
  transition: all var(--transition-base);
    box-shadow: var(--shadow-sm);
  &:hover {
        background: var(--bg-primary);
    transform: translateY(-4px);
        border-color: ${p => p.$accent ? p.$accent + '66' : 'var(--accent-soft)'};
  }
`;
const StatIcon = styled.div<{ $bg: string }>`
  width: 38px; height: 38px; border-radius: 11px;
  background: ${p => p.$bg};
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 0.95rem; margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
`;
const StatValue = styled.div`font-size: 1.6rem; font-weight: 900; color: var(--text-primary); letter-spacing: -0.01em;`;
const StatLabel = styled.div`font-size: 0.7rem; color: var(--text-hint); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 800;`;

// ── Section ───────────────────────────────────────────────────────────────────

const Section = styled.div`padding: 24px; animation: ${fadeUp} 0.5s ease;`;
const SectionHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
`;
const SectionTitle = styled.h2`font-size: 1.1rem; font-weight: 900; margin: 0; display: flex; align-items: center; gap: 10px; color: var(--text-primary); letter-spacing: -0.01em;`;

// ── Search & Filters ──────────────────────────────────────────────────────────

const FiltersRow = styled.div`
  display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px;
`;
const SearchBox = styled.div`
  flex: 1; min-width: 250px;
    background: var(--bg-secondary);
    border: 1px solid var(--bg-tertiary);
  border-radius: 14px;
  display: flex; align-items: center; gap: 12px;
  padding: 0 16px;
  transition: all var(--transition-fast);
    &:focus-within { border-color: var(--accent); background: var(--bg-secondary); }
`;
const SearchInput = styled.input`
  background: transparent; border: none; outline: none;
    color: var(--text-primary); font-size: 0.9rem; padding: 12px 0; flex: 1;
    &::placeholder { color: var(--text-hint); }
`;
const FilterChip = styled.button<{ $active: boolean }>`
  padding: 10px 18px; border-radius: 12px; border: none;
  font-size: 0.78rem; font-weight: 800; cursor: pointer;
    background: ${p => p.$active ? 'var(--accent-soft)' : 'var(--bg-secondary)'};
    color: ${p => p.$active ? 'var(--accent-dark)' : 'var(--text-secondary)'};
    border: 1px solid ${p => p.$active ? 'hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.35)' : 'var(--bg-tertiary)'};
  transition: all var(--transition-fast);
  &:active { transform: scale(0.95); }
`;

// ── Order Table ───────────────────────────────────────────────────────────────

const OrderTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
const OrderRow = styled.div<{ $delay?: number }>`
    background: var(--bg-secondary);
    border: 1px solid var(--bg-tertiary);
  border-radius: 18px;
  padding: 18px 20px;
  animation: ${fadeUp} 0.4s var(--transition-smooth) ${p => (p.$delay ?? 0) * 0.05}s both;
  transition: all var(--transition-base);
    &:hover { background: var(--bg-primary); border-color: var(--accent-soft); }
`;
const OrderRowHeader = styled.div`display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;`;
const OrderIdText = styled.span`font-weight: 900; font-size: 0.85rem; font-family: 'SF Mono', 'Fira Mono', monospace; color: var(--text-primary); border-bottom: 1px dashed var(--bg-tertiary);`;
const OrderMeta = styled.div`display: flex; gap: 8px; align-items: center;`;
const StatusBadge = styled.span<{ $color: string }>`
  background: ${p => p.$color}15; color: ${p => p.$color};
  font-size: 0.65rem; font-weight: 800; padding: 4px 12px;
  border-radius: 10px; border: 1px solid ${p => p.$color}30;
  text-transform: uppercase; letter-spacing: 0.05em;
`;
const OrderDetails = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;
    font-size: 0.8rem; color: var(--text-secondary);
  line-height: 1.5;
`;
const DetailLabel = styled.span`color: var(--text-hint); font-weight: 600; text-transform: uppercase; font-size: 0.6rem; letter-spacing: 0.05em; display: block; margin-bottom: 2px;`;
const OrderActions = styled.div`display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end; border-top: 1px solid var(--bg-tertiary); padding-top: 14px;`;
const CancelBtn = styled.button<{ $disabled?: boolean }>`
  padding: 8px 16px; border-radius: 12px; border: none;
    background: ${p => p.$disabled ? 'var(--bg-tertiary)' : 'rgba(239, 68, 68, 0.12)'};
    color: ${p => p.$disabled ? 'var(--text-hint)' : 'var(--error)'};
  font-size: 0.78rem; font-weight: 800; cursor: ${p => p.$disabled ? 'not-allowed' : 'pointer'};
    border: 1px solid ${p => p.$disabled ? 'var(--bg-tertiary)' : 'rgba(239, 68, 68, 0.25)'};
  display: flex; align-items: center; gap: 8px;
  transition: all var(--transition-fast);
  &:active:not(:disabled) { transform: scale(0.96); }
`;

// ── Pagination ────────────────────────────────────────────────────────────────

const PaginationRow = styled.div`
  display: flex; align-items: center; justify-content: center; gap: 18px;
  padding: 24px 0;
`;
const PageBtn = styled.button<{ $disabled?: boolean }>`
  padding: 10px 20px; border-radius: 14px; border: none;
    background: ${p => p.$disabled ? 'var(--bg-tertiary)' : 'var(--bg-secondary)'};
    color: ${p => p.$disabled ? 'var(--text-hint)' : 'var(--text-primary)'};
  font-size: 0.85rem; font-weight: 800; cursor: ${p => p.$disabled ? 'default' : 'pointer'};
  display: flex; align-items: center; gap: 8px;
    border: 1px solid ${p => p.$disabled ? 'var(--bg-tertiary)' : 'var(--bg-tertiary)'};
  transition: all var(--transition-fast);
    &:active:not(:disabled) { background: var(--bg-primary); }
`;
const PageInfo = styled.span`font-size: 0.85rem; color: var(--text-hint); font-weight: 600;`;

// ── Merchants ─────────────────────────────────────────────────────────────────

const MerchantCard = styled.div<{ $delay?: number }>`
    background: var(--bg-secondary);
    border: 1px solid var(--bg-tertiary);
  border-radius: 18px;
  padding: 16px 20px;
  animation: ${fadeUp} 0.4s var(--transition-smooth) ${p => (p.$delay ?? 0) * 0.08}s both;
  display: flex; align-items: center; gap: 18px;
  transition: all var(--transition-base);
    &:hover { background: var(--bg-primary); border-color: var(--accent-soft); }
`;
const MerchantAvatar = styled.div`
  width: 50px; height: 50px; border-radius: 14px;
  background: linear-gradient(135deg, var(--accent), #F7931E);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem; font-weight: 900; color: #fff; flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
`;
const MerchantInfo = styled.div`flex: 1;`;
const MerchantName = styled.div`font-weight: 900; font-size: 1rem; color: var(--text-primary); letter-spacing: -0.01em;`;
const MerchantMeta = styled.div`font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px; font-weight: 500;`;
const MerchantStat = styled.div`text-align: right; margin-left: 12px;`;
const MerchantStatVal = styled.div`font-weight: 900; font-size: 1.1rem; color: #FFD23F;`;
const MerchantStatLbl = styled.div`font-size: 0.65rem; color: var(--text-hint); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;`;

// ── Utility ───────────────────────────────────────────────────────────────────

const Center = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 64px 24px; gap: 20px; text-align: center;
`;
const SpinIcon = styled(FontAwesomeIcon)`animation: ${spin} 1s linear infinite;`;

// ── Confirm Modal ─────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 500; display: flex; align-items: center; justify-content: center;
  animation: ${scaleIn} 0.3s var(--transition-smooth);
`;
const Modal = styled.div`
    background: var(--bg-secondary); border: 1px solid var(--bg-tertiary);
  border-radius: 28px; padding: 32px; max-width: 380px; width: 90%;
  text-align: center;
    box-shadow: var(--shadow-lg);
`;
const ModalTitle = styled.h3`font-size: 1.3rem; font-weight: 900; margin: 0 0 12px; color: var(--text-primary); letter-spacing: -0.02em;`;
const ModalText = styled.p`font-size: 0.9rem; color: var(--text-secondary); margin: 0 0 28px; line-height: 1.6; font-weight: 500;`;
const ModalActions = styled.div`display: flex; gap: 12px;`;
const ModalBtn = styled.button<{ $danger?: boolean }>`
  flex: 1; padding: 14px; border-radius: 16px; border: none;
  font-weight: 800; font-size: 0.95rem; cursor: pointer;
    background: ${p => p.$danger ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'var(--bg-tertiary)'};
    color: ${p => p.$danger ? '#fff' : 'var(--text-secondary)'};
  transition: all var(--transition-fast);
  &:active { transform: scale(0.96); }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortAddr(a: string) {
    if (!a || a.length < 12) return a;
    return a.slice(0, 6) + "…" + a.slice(-4);
}

function getStatusInfo(status: string) {
    switch (status) {
        case "pending": return { color: "#2196f3", label: "Pending", icon: faClock };
        case "accepted": return { color: "#FF6B35", label: "Accepted", icon: faMotorcycle };
        case "picked_up": return { color: "#9c27b0", label: "Picked Up", icon: faTruck };
        case "delivered": return { color: "#4caf50", label: "Delivered", icon: faCheckCircle };
        case "cancelled": return { color: "#f44336", label: "Cancelled", icon: faBan };
        default: return { color: "#888", label: status, icon: faBoxOpen };
    }
}

function formatDate(d: string | number): string {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const PAGE_SIZE = 20;

const STATUS_FILTERS = ["all", "pending", "accepted", "picked_up", "delivered", "cancelled"] as const;

// ─── Component ────────────────────────────────────────────────────────────────

const SuperAdminDashboard: React.FC = () => {
    const navigate = useNavigate();

    const [stats, setStats] = useState<AdminStats | null>(null);
    const [orders, setOrders] = useState<BackendOrder[]>([]);
    const [totalOrders, setTotalOrders] = useState(0);
    const [merchants, setMerchants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);

    // Cancel modal
    const [cancelTarget, setCancelTarget] = useState<BackendOrder | null>(null);
    const [cancelling, setCancelling] = useState(false);

    // Tab
    const [activeSection, setActiveSection] = useState<"orders" | "merchants">("orders");

    // ── Fetch ──────────────────────────────────────────────────────────────
    const fetchAll = useCallback(async (showLoader = false) => {
        if (showLoader) setLoading(true);
        setRefreshing(true);
        setErrorMessage(null);
        try {
            const [statsData, ordersData, merchantsData] = await Promise.all([
                api.getAdminStats(),
                api.getAdminOrders({
                    status: statusFilter,
                    limit: PAGE_SIZE,
                    offset: page * PAGE_SIZE,
                    search: searchQuery || undefined,
                }),
                api.getAdminMerchants(),
            ]);
            setStats(statsData);
            setOrders(ordersData.orders);
            setTotalOrders(ordersData.total);
            setMerchants(merchantsData);
        } catch (e) {
            setErrorMessage("Could not load the latest admin data. Please try again.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [statusFilter, page, searchQuery]);

    useEffect(() => { fetchAll(true); }, [fetchAll]);

    // Auto-refresh every 15s
    useEffect(() => {
        const id = setInterval(() => fetchAll(false), 15_000);
        return () => clearInterval(id);
    }, [fetchAll]);

    // Reset page when filters change
    useEffect(() => { setPage(0); }, [statusFilter, searchQuery]);

    // ── Cancel order ───────────────────────────────────────────────────────
    const handleCancel = async () => {
        if (!cancelTarget) return;
        setCancelling(true);
        setErrorMessage(null);
        try {
            await api.cancelOrder(cancelTarget.id);
            setCancelTarget(null);
            fetchAll(false);
        } catch (e) {
            setErrorMessage("Order cancellation failed. Please retry in a moment.");
        } finally {
            setCancelling(false);
        }
    };

    // ── Loading state ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <Page>
                <Center style={{ minHeight: "100vh" }}>
                    <SpinIcon icon={faSpinner} style={{ fontSize: "2rem", color: "#FF6B35" }} />
                    <p style={{ color: "var(--text-hint)", fontSize: "0.85rem" }}>Loading admin panel…</p>
                </Center>
            </Page>
        );
    }

    const totalPages = Math.ceil(totalOrders / PAGE_SIZE);

    return (
        <Page>
            {/* ── Top Bar ── */}
            <TopBar>
                <TopLeft>
                    <BackBtn onClick={() => navigate(-1)}>
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </BackBtn>
                    <div>
                        <Title>
                            <FontAwesomeIcon icon={faShieldHalved} style={{ color: "#FF6B35", marginRight: 6 }} />
                            Super Admin
                        </Title>
                        <SubTitle>TON-Eats Platform Control Panel</SubTitle>
                    </div>
                </TopLeft>
                <RefreshBtn onClick={() => fetchAll(false)} $spinning={refreshing}>
                    {refreshing ? <SpinIcon icon={faSpinner} /> : <FontAwesomeIcon icon={faRotateRight} />}
                    Refresh
                </RefreshBtn>
            </TopBar>

            {errorMessage && (
                <div style={{ padding: "16px 24px 0" }}>
                    <div role="alert">{errorMessage}</div>
                </div>
            )}

            {/* ── Stats Grid ── */}
            {stats && (
                <StatsGrid>
                    <StatCard $delay={0} $accent="#2196f3">
                        <StatIcon $bg="linear-gradient(135deg,#2196f3,#1976d2)">
                            <FontAwesomeIcon icon={faReceipt} />
                        </StatIcon>
                        <StatValue>{stats.orders.total}</StatValue>
                        <StatLabel>Total Orders</StatLabel>
                    </StatCard>
                    <StatCard $delay={1} $accent="#FF6B35">
                        <StatIcon $bg="linear-gradient(135deg,#FF6B35,#e65100)">
                            <FontAwesomeIcon icon={faClock} />
                        </StatIcon>
                        <StatValue>{stats.orders.pending + stats.orders.accepted + stats.orders.picked_up}</StatValue>
                        <StatLabel>Active Now</StatLabel>
                    </StatCard>
                    <StatCard $delay={2} $accent="#4caf50">
                        <StatIcon $bg="linear-gradient(135deg,#4caf50,#2e7d32)">
                            <FontAwesomeIcon icon={faCheckCircle} />
                        </StatIcon>
                        <StatValue>{stats.orders.delivered}</StatValue>
                        <StatLabel>Delivered</StatLabel>
                    </StatCard>
                    <StatCard $delay={3} $accent="#f44336">
                        <StatIcon $bg="linear-gradient(135deg,#f44336,#d32f2f)">
                            <FontAwesomeIcon icon={faBan} />
                        </StatIcon>
                        <StatValue>{stats.orders.cancelled}</StatValue>
                        <StatLabel>Cancelled</StatLabel>
                    </StatCard>
                    <StatCard $delay={4} $accent="#FFD23F">
                        <StatIcon $bg="linear-gradient(135deg,#FFD23F,#F7931E)">
                            <FontAwesomeIcon icon={faCoins} />
                        </StatIcon>
                        <StatValue>{stats.revenue.totalTon.toFixed(2)}</StatValue>
                        <StatLabel>Total Volume (TON)</StatLabel>
                    </StatCard>
                    <StatCard $delay={5} $accent="#9c27b0">
                        <StatIcon $bg="linear-gradient(135deg,#9c27b0,#7b1fa2)">
                            <FontAwesomeIcon icon={faCircleDollarToSlot} />
                        </StatIcon>
                        <StatValue>{stats.revenue.protocolFees.toFixed(3)}</StatValue>
                        <StatLabel>Protocol Fees (TON)</StatLabel>
                    </StatCard>
                    <StatCard $delay={6} $accent="#00bcd4">
                        <StatIcon $bg="linear-gradient(135deg,#00bcd4,#0097a7)">
                            <FontAwesomeIcon icon={faStore} />
                        </StatIcon>
                        <StatValue>{stats.users.totalMerchants}</StatValue>
                        <StatLabel>Merchants</StatLabel>
                    </StatCard>
                    <StatCard $delay={7} $accent="#FF6B35">
                        <StatIcon $bg="linear-gradient(135deg,#FF6B35,#F7931E)">
                            <FontAwesomeIcon icon={faUserGroup} />
                        </StatIcon>
                        <StatValue>{stats.users.totalCouriers + stats.users.totalBuyers}</StatValue>
                        <StatLabel>Users</StatLabel>
                    </StatCard>
                </StatsGrid>
            )}

            {/* ── Section Toggle ── */}
            <div style={{ display: "flex", gap: 8, padding: "16px 16px 0" }}>
                <FilterChip $active={activeSection === "orders"} onClick={() => setActiveSection("orders")}>
                    <FontAwesomeIcon icon={faReceipt} style={{ marginRight: 4 }} />
                    Orders
                </FilterChip>
                <FilterChip $active={activeSection === "merchants"} onClick={() => setActiveSection("merchants")}>
                    <FontAwesomeIcon icon={faStore} style={{ marginRight: 4 }} />
                    Merchants
                </FilterChip>
            </div>

            {/* ── Orders Section ── */}
            {activeSection === "orders" && (
                <Section>
                    <SectionHeader>
                        <SectionTitle>
                            <FontAwesomeIcon icon={faChartLine} style={{ color: "#FF6B35" }} />
                            All Orders
                            <span style={{ fontSize: "0.72rem", color: "var(--text-hint)", fontWeight: 500, marginLeft: 4 }}>
                                ({totalOrders})
                            </span>
                        </SectionTitle>
                    </SectionHeader>

                    {/* Search & Filters */}
                    <FiltersRow>
                        <SearchBox>
                            <FontAwesomeIcon icon={faSearch} style={{ color: "var(--text-hint)" }} />
                            <SearchInput
                                placeholder="Search by order ID, wallet, address..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </SearchBox>
                    </FiltersRow>
                    <FiltersRow>
                        {STATUS_FILTERS.map(s => (
                            <FilterChip key={s} $active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                                {s === "all" ? "All" : s.replace("_", " ").replace(/^\w/, c => c.toUpperCase())}
                            </FilterChip>
                        ))}
                    </FiltersRow>

                    {/* Order List */}
                    <OrderTable>
                        {orders.length === 0 ? (
                            <Center>
                                <FontAwesomeIcon icon={faBoxOpen} style={{ fontSize: "1.5rem", opacity: 0.3 }} />
                                <p style={{ color: "var(--text-hint)", fontSize: "0.82rem" }}>No orders found</p>
                            </Center>
                        ) : (
                            orders.map((order, i) => {
                                const info = getStatusInfo(order.status);
                                const canCancel = !["delivered", "cancelled"].includes(order.status);
                                return (
                                    <OrderRow key={order.id} $delay={i}>
                                        <OrderRowHeader>
                                            <OrderIdText>#{order.orderId.slice(-8)}</OrderIdText>
                                            <OrderMeta>
                                                <StatusBadge $color={info.color}>
                                                    <FontAwesomeIcon icon={info.icon} style={{ marginRight: 4 }} />
                                                    {info.label}
                                                </StatusBadge>
                                                <span style={{ fontSize: "0.65rem", color: "var(--text-hint)" }}>
                                                    {formatDate(order.createdAt)}
                                                </span>
                                            </OrderMeta>
                                        </OrderRowHeader>
                                        <OrderDetails>
                                            <div><DetailLabel>Buyer: </DetailLabel>{shortAddr(order.buyerWallet)}</div>
                                            <div><DetailLabel>Courier: </DetailLabel>{order.courierWallet ? shortAddr(order.courierWallet) : "—"}</div>
                                            <div><DetailLabel>Address: </DetailLabel>{order.deliveryAddress.slice(0, 30)}{order.deliveryAddress.length > 30 ? "…" : ""}</div>
                                            <div><DetailLabel>Amount: </DetailLabel><span style={{ color: "#FFD23F", fontWeight: 700 }}>{order.foodTotalTon.toFixed(3)} TON</span></div>
                                            <div><DetailLabel>Delivery fee: </DetailLabel>{order.deliveryFeeTon.toFixed(3)} TON</div>
                                            <div><DetailLabel>Protocol fee: </DetailLabel>{order.protocolFeeTon.toFixed(3)} TON</div>
                                            <div><DetailLabel>Items: </DetailLabel>{order.items?.map((it: any) => `${it.qty}× ${it.name}`).join(", ") || "—"}</div>
                                            <div><DetailLabel>Store: </DetailLabel>{order.storeId}</div>
                                        </OrderDetails>
                                        <OrderActions>
                                            <CancelBtn $disabled={!canCancel} onClick={() => canCancel && setCancelTarget(order)}>
                                                <FontAwesomeIcon icon={faBan} />
                                                Cancel
                                            </CancelBtn>
                                        </OrderActions>
                                    </OrderRow>
                                );
                            })
                        )}
                    </OrderTable>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <PaginationRow>
                            <PageBtn $disabled={page === 0} onClick={() => page > 0 && setPage(page - 1)}>
                                <FontAwesomeIcon icon={faArrowLeft} /> Prev
                            </PageBtn>
                            <PageInfo>
                                Page {page + 1} of {totalPages}
                            </PageInfo>
                            <PageBtn $disabled={page >= totalPages - 1} onClick={() => page < totalPages - 1 && setPage(page + 1)}>
                                Next <FontAwesomeIcon icon={faArrowRight} />
                            </PageBtn>
                        </PaginationRow>
                    )}
                </Section>
            )}

            {/* ── Merchants Section ── */}
            {activeSection === "merchants" && (
                <Section>
                    <SectionHeader>
                        <SectionTitle>
                            <FontAwesomeIcon icon={faStore} style={{ color: "#FF6B35" }} />
                            Merchants
                            <span style={{ fontSize: "0.72rem", color: "var(--text-hint)", fontWeight: 500, marginLeft: 4 }}>
                                ({merchants.length})
                            </span>
                        </SectionTitle>
                    </SectionHeader>

                    {merchants.length === 0 ? (
                        <Center>
                            <FontAwesomeIcon icon={faStore} style={{ fontSize: "1.5rem", opacity: 0.3 }} />
                            <p style={{ color: "var(--text-hint)", fontSize: "0.82rem" }}>No merchants yet</p>
                        </Center>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {merchants.map((m, i) => (
                                <MerchantCard key={m.id} $delay={i}>
                                    <MerchantAvatar>
                                        {m.name?.charAt(0)?.toUpperCase() ?? "?"}
                                    </MerchantAvatar>
                                    <MerchantInfo>
                                        <MerchantName>{m.name}</MerchantName>
                                        <MerchantMeta>
                                            {m.category} · {shortAddr(m.merchantWallet)} · ⭐ {m.rating?.toFixed(1) ?? "5.0"}
                                        </MerchantMeta>
                                    </MerchantInfo>
                                    <MerchantStat>
                                        <MerchantStatVal>{m._count?.orders ?? 0}</MerchantStatVal>
                                        <MerchantStatLbl>orders</MerchantStatLbl>
                                    </MerchantStat>
                                    <MerchantStat>
                                        <MerchantStatVal>{m._count?.products ?? 0}</MerchantStatVal>
                                        <MerchantStatLbl>products</MerchantStatLbl>
                                    </MerchantStat>
                                </MerchantCard>
                            ))}
                        </div>
                    )}
                </Section>
            )}

            {/* ── Cancel Confirmation Modal ── */}
            {cancelTarget && (
                <Overlay onClick={() => !cancelling && setCancelTarget(null)}>
                    <Modal onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>⚠️</div>
                        <ModalTitle>Cancel Order?</ModalTitle>
                        <ModalText>
                            This will cancel order <strong>#{cancelTarget.orderId.slice(-8)}</strong> and notify the buyer/courier.
                            This action cannot be undone.
                        </ModalText>
                        <ModalActions>
                            <ModalBtn onClick={() => setCancelTarget(null)} disabled={cancelling}>
                                Keep Order
                            </ModalBtn>
                            <ModalBtn $danger onClick={handleCancel} disabled={cancelling}>
                                {cancelling ? <SpinIcon icon={faSpinner} /> : <FontAwesomeIcon icon={faBan} />}
                                {cancelling ? " Cancelling…" : " Cancel Order"}
                            </ModalBtn>
                        </ModalActions>
                    </Modal>
                </Overlay>
            )}
        </Page>
    );
};

export default SuperAdminDashboard;
