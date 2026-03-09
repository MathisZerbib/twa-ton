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
  background: #0f0f1a;
  min-height: 100vh;
  color: #f0f0f0;
`;

const TopBar = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255,255,255,0.06);
`;
const TopLeft = styled.div`display: flex; align-items: center; gap: 14px;`;
const BackBtn = styled.button`
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px; width: 36px; height: 36px; color: #fff;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  &:active { transform: scale(0.95); }
`;
const Title = styled.h1`font-size: 1.3rem; font-weight: 900; margin: 0; color: #fff;`;
const SubTitle = styled.p`font-size: 0.72rem; color: rgba(255,255,255,0.5); margin: 2px 0 0;`;
const RefreshBtn = styled.button<{ $spinning?: boolean }>`
  background: rgba(255,107,53,0.15); border: 1px solid rgba(255,107,53,0.3);
  border-radius: 10px; padding: 8px 14px; color: #FF6B35;
  font-size: 0.78rem; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  &:active { transform: scale(0.96); }
`;

// ── Stat Cards ────────────────────────────────────────────────────────────────

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  padding: 16px 16px 0;
`;
const StatCard = styled.div<{ $delay?: number; $accent?: string }>`
  background: linear-gradient(145deg, #1e1e30, #252540);
  border: 1px solid ${p => p.$accent ? p.$accent + '30' : 'rgba(255,255,255,0.06)'};
  border-radius: 16px;
  padding: 16px;
  animation: ${fadeUp} 0.35s ease ${p => (p.$delay ?? 0) * 0.06}s both;
`;
const StatIcon = styled.div<{ $bg: string }>`
  width: 32px; height: 32px; border-radius: 10px;
  background: ${p => p.$bg};
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 0.8rem; margin-bottom: 10px;
`;
const StatValue = styled.div`font-size: 1.4rem; font-weight: 900; color: #fff;`;
const StatLabel = styled.div`font-size: 0.68rem; color: rgba(255,255,255,0.45); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600;`;

// ── Section ───────────────────────────────────────────────────────────────────

const Section = styled.div`padding: 16px; animation: ${fadeUp} 0.4s ease;`;
const SectionHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
`;
const SectionTitle = styled.h2`font-size: 1rem; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 8px;`;

// ── Search & Filters ──────────────────────────────────────────────────────────

const FiltersRow = styled.div`
  display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;
`;
const SearchBox = styled.div`
  flex: 1; min-width: 200px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  display: flex; align-items: center; gap: 8px;
  padding: 0 12px;
`;
const SearchInput = styled.input`
  background: transparent; border: none; outline: none;
  color: #fff; font-size: 0.85rem; padding: 10px 0; flex: 1;
  &::placeholder { color: rgba(255,255,255,0.3); }
`;
const FilterChip = styled.button<{ $active: boolean }>`
  padding: 8px 14px; border-radius: 10px; border: none;
  font-size: 0.72rem; font-weight: 700; cursor: pointer;
  background: ${p => p.$active ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.06)'};
  color: ${p => p.$active ? '#FF6B35' : 'rgba(255,255,255,0.5)'};
  border: 1px solid ${p => p.$active ? 'rgba(255,107,53,0.4)' : 'rgba(255,255,255,0.08)'};
  transition: all 0.2s;
  &:active { transform: scale(0.96); }
`;

// ── Order Table ───────────────────────────────────────────────────────────────

const OrderTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const OrderRow = styled.div<{ $delay?: number }>`
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 14px 16px;
  animation: ${fadeUp} 0.3s ease ${p => (p.$delay ?? 0) * 0.04}s both;
  transition: background 0.2s;
  &:hover { background: rgba(255,255,255,0.07); }
`;
const OrderRowHeader = styled.div`display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;`;
const OrderIdText = styled.span`font-weight: 800; font-size: 0.82rem; font-family: 'SF Mono', monospace; color: #fff;`;
const OrderMeta = styled.div`display: flex; gap: 6px; align-items: center;`;
const StatusBadge = styled.span<{ $color: string }>`
  background: ${p => p.$color}20; color: ${p => p.$color};
  font-size: 0.65rem; font-weight: 700; padding: 3px 10px;
  border-radius: 8px; border: 1px solid ${p => p.$color}40;
`;
const OrderDetails = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
  font-size: 0.76rem; color: rgba(255,255,255,0.5);
`;
const DetailLabel = styled.span`color: rgba(255,255,255,0.3);`;
const OrderActions = styled.div`display: flex; gap: 8px; margin-top: 10px; justify-content: flex-end;`;
const CancelBtn = styled.button<{ $disabled?: boolean }>`
  padding: 7px 14px; border-radius: 10px; border: none;
  background: ${p => p.$disabled ? 'rgba(255,255,255,0.05)' : 'rgba(244,67,54,0.15)'};
  color: ${p => p.$disabled ? 'rgba(255,255,255,0.2)' : '#f44336'};
  font-size: 0.75rem; font-weight: 700; cursor: ${p => p.$disabled ? 'not-allowed' : 'pointer'};
  border: 1px solid ${p => p.$disabled ? 'transparent' : 'rgba(244,67,54,0.3)'};
  display: flex; align-items: center; gap: 5px;
  &:active:not(:disabled) { transform: scale(0.96); }
`;

// ── Pagination ────────────────────────────────────────────────────────────────

const PaginationRow = styled.div`
  display: flex; align-items: center; justify-content: center; gap: 14px;
  padding: 14px 0;
`;
const PageBtn = styled.button<{ $disabled?: boolean }>`
  padding: 8px 14px; border-radius: 10px; border: none;
  background: ${p => p.$disabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'};
  color: ${p => p.$disabled ? 'rgba(255,255,255,0.2)' : '#fff'};
  font-size: 0.78rem; font-weight: 700; cursor: ${p => p.$disabled ? 'default' : 'pointer'};
  display: flex; align-items: center; gap: 5px;
`;
const PageInfo = styled.span`font-size: 0.75rem; color: rgba(255,255,255,0.4);`;

// ── Merchants ─────────────────────────────────────────────────────────────────

const MerchantCard = styled.div<{ $delay?: number }>`
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 14px 16px;
  animation: ${fadeUp} 0.3s ease ${p => (p.$delay ?? 0) * 0.06}s both;
  display: flex; align-items: center; gap: 14px;
`;
const MerchantAvatar = styled.div`
  width: 44px; height: 44px; border-radius: 12px;
  background: linear-gradient(135deg, #FF6B35, #F7931E);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; flex-shrink: 0;
`;
const MerchantInfo = styled.div`flex: 1;`;
const MerchantName = styled.div`font-weight: 800; font-size: 0.88rem;`;
const MerchantMeta = styled.div`font-size: 0.72rem; color: rgba(255,255,255,0.4); margin-top: 2px;`;
const MerchantStat = styled.div`text-align: right;`;
const MerchantStatVal = styled.div`font-weight: 800; font-size: 0.95rem; color: #FFD23F;`;
const MerchantStatLbl = styled.div`font-size: 0.62rem; color: rgba(255,255,255,0.3);`;

// ── Utility ───────────────────────────────────────────────────────────────────

const Center = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 48px 24px; gap: 14px; text-align: center;
`;
const SpinIcon = styled(FontAwesomeIcon)`animation: ${spin} 1s linear infinite;`;

// ── Confirm Modal ─────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  z-index: 500; display: flex; align-items: center; justify-content: center;
  animation: ${scaleIn} 0.2s ease;
`;
const Modal = styled.div`
  background: #1e1e30; border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px; padding: 24px; max-width: 340px; width: 90%;
  text-align: center;
`;
const ModalTitle = styled.h3`font-size: 1.05rem; font-weight: 800; margin: 0 0 8px; color: #fff;`;
const ModalText = styled.p`font-size: 0.82rem; color: rgba(255,255,255,0.5); margin: 0 0 20px; line-height: 1.5;`;
const ModalActions = styled.div`display: flex; gap: 10px;`;
const ModalBtn = styled.button<{ $danger?: boolean }>`
  flex: 1; padding: 12px; border-radius: 12px; border: none;
  font-weight: 800; font-size: 0.88rem; cursor: pointer;
  background: ${p => p.$danger ? 'linear-gradient(135deg,#f44336,#d32f2f)' : 'rgba(255,255,255,0.08)'};
  color: ${p => p.$danger ? '#fff' : 'rgba(255,255,255,0.6)'};
  &:active { transform: scale(0.97); }
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
            console.error("Admin fetch failed:", e);
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
        try {
            await api.cancelOrder(cancelTarget.id);
            setCancelTarget(null);
            fetchAll(false);
        } catch (e) {
            console.error("Cancel failed:", e);
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
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>Loading admin panel…</p>
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
                            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", fontWeight: 500, marginLeft: 4 }}>
                                ({totalOrders})
                            </span>
                        </SectionTitle>
                    </SectionHeader>

                    {/* Search & Filters */}
                    <FiltersRow>
                        <SearchBox>
                            <FontAwesomeIcon icon={faSearch} style={{ color: "rgba(255,255,255,0.3)" }} />
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
                                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.82rem" }}>No orders found</p>
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
                                                <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>
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
                            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", fontWeight: 500, marginLeft: 4 }}>
                                ({merchants.length})
                            </span>
                        </SectionTitle>
                    </SectionHeader>

                    {merchants.length === 0 ? (
                        <Center>
                            <FontAwesomeIcon icon={faStore} style={{ fontSize: "1.5rem", opacity: 0.3 }} />
                            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.82rem" }}>No merchants yet</p>
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
