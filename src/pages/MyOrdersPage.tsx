/**
 * MyOrdersPage.tsx
 *
 * Shows the user's active orders (pending / accepted / picked_up).
 * Tapping an order navigates to the live OrderTracker.
 */

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faReceipt,
  faMotorcycle,
  faUtensils,
  faBoxOpen,
  faClock,
  faArrowRight,
  faInbox,
} from "@fortawesome/free-solid-svg-icons";
import Header from "../components/Header";
import LoadingAnimation from "../components/LoadingAnimation";
import { api, BackendOrder } from "../services/api";
import { useTonConnect } from "../hooks/useTonConnect";

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeUp = keyframes`from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}`;
const spin = keyframes`to{transform:rotate(360deg)}`;

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  background: #f7f7f7;
  min-height: 100vh;
  padding-bottom: 40px;
`;

const Content = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px 16px;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 900;
  margin: 0 0 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1a1a1a;
`;

const Loader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 0;
  color: #aaa;
  font-size: 1.5rem;

  svg {
    animation: ${spin} 1s linear infinite;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #999;
  animation: ${fadeUp} 0.4s ease;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 16px;
  color: #ddd;
`;

const OrderCard = styled.div<{ $delay: number }>`
  background: #fff;
  border-radius: 18px;
  padding: 18px 20px;
  margin-bottom: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  animation: ${fadeUp} 0.4s ease ${(p) => p.$delay * 0.08}s both;
  transition: transform 0.15s, box-shadow 0.15s;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const OrderId = styled.span`
  font-weight: 800;
  font-size: 0.9rem;
  color: #1a1a1a;
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 8px;
  background: ${(p) =>
    p.$status === "pending"
      ? "rgba(255,152,0,0.12)"
      : p.$status === "accepted"
        ? "rgba(33,150,243,0.12)"
        : "rgba(76,175,80,0.12)"};
  color: ${(p) =>
    p.$status === "pending"
      ? "#e65100"
      : p.$status === "accepted"
        ? "#1565c0"
        : "#2e7d32"};
`;

const ItemsList = styled.div`
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 10px;
  line-height: 1.5;
`;

const CardBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TotalPrice = styled.span`
  font-weight: 800;
  font-size: 0.95rem;
  color: #1a1a1a;
`;

const TrackBtn = styled.span`
  color: #ff6b35;
  font-weight: 700;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const statusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return faUtensils;
    case "accepted":
      return faMotorcycle;
    case "picked_up":
      return faBoxOpen;
    default:
      return faClock;
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "pending":
      return "Preparing";
    case "accepted":
      return "Courier assigned";
    case "picked_up":
      return "On the way";
    default:
      return status;
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

const MyOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { wallet } = useTonConnect();
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wallet) {
      setLoading(false);
      return;
    }
    const minDelay = new Promise(r => setTimeout(r, 1500));
    Promise.all([
      api
        .getOrdersByWallet(wallet)
        .then((data) => {
          // Only active orders (not delivered)
          setOrders(data.filter((o) => o.status !== "delivered"));
        })
        .catch(console.error),
      minDelay,
    ]).finally(() => setLoading(false));
  }, [wallet]);

  return (
    <Page>
      <Header showConnectButton />
      <Content>
        <Title>
          <FontAwesomeIcon icon={faReceipt} style={{ color: "#FF6B35" }} />
          My Orders
        </Title>

        {loading && (
          <LoadingAnimation message="Loading your orders…" />
        )}

        {!loading && !wallet && (
          <EmptyState>
            <EmptyIcon>
              <FontAwesomeIcon icon={faInbox} />
            </EmptyIcon>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "#666" }}>
              Connect your wallet
            </p>
            <p style={{ fontSize: "0.85rem" }}>
              to see your active orders
            </p>
          </EmptyState>
        )}

        {!loading && wallet && orders.length === 0 && (
          <EmptyState>
            <EmptyIcon>
              <FontAwesomeIcon icon={faInbox} />
            </EmptyIcon>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "#666" }}>
              No active orders
            </p>
            <p style={{ fontSize: "0.85rem" }}>
              Your current orders will appear here
            </p>
          </EmptyState>
        )}

        {orders.map((order, i) => (
          <OrderCard
            key={order.id}
            $delay={i}
            onClick={() => navigate(`/track/${order.id}`)}
          >
            <CardTop>
              <OrderId>
                <FontAwesomeIcon
                  icon={statusIcon(order.status)}
                  style={{ marginRight: 8, color: "#FF6B35" }}
                />
                Order #{order.orderId.slice(-6)}
              </OrderId>
              <StatusBadge $status={order.status}>
                {statusLabel(order.status)}
              </StatusBadge>
            </CardTop>

            <ItemsList>
              {order.items.map((item, idx) => (
                <div key={idx}>
                  {item.qty}× {item.name}
                </div>
              ))}
            </ItemsList>

            <CardBottom>
              <TotalPrice>
                {(order.foodTotalTon + order.deliveryFeeTon).toFixed(2)} TON
              </TotalPrice>
              <TrackBtn>
                Track <FontAwesomeIcon icon={faArrowRight} />
              </TrackBtn>
            </CardBottom>
          </OrderCard>
        ))}
      </Content>
    </Page>
  );
};

export default MyOrdersPage;
