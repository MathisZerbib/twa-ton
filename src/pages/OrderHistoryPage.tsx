/**
 * OrderHistoryPage.tsx
 *
 * Shows the user's past (delivered) orders.
 */

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClockRotateLeft,
  faCheckCircle,
  faRotateRight,
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
  animation: ${fadeUp} 0.4s ease ${(p) => p.$delay * 0.08}s both;
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

const DeliveredBadge = styled.span`
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(76, 175, 80, 0.12);
  color: #2e7d32;
  display: flex;
  align-items: center;
  gap: 4px;
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

const DateLabel = styled.span`
  font-size: 0.78rem;
  color: #999;
  font-weight: 600;
`;

const ReorderBtn = styled.button`
  background: rgba(255, 107, 53, 0.1);
  color: #ff6b35;
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s;

  &:hover {
    background: rgba(255, 107, 53, 0.18);
  }
`;

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

const OrderHistoryPage: React.FC = () => {
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
          // Only delivered orders
          setOrders(data.filter((o) => o.status === "delivered"));
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
          <FontAwesomeIcon
            icon={faClockRotateLeft}
            style={{ color: "#FF6B35" }}
          />
          Order History
        </Title>

        {loading && (
          <LoadingAnimation message="Loading order history…" />
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
              to see your order history
            </p>
          </EmptyState>
        )}

        {!loading && wallet && orders.length === 0 && (
          <EmptyState>
            <EmptyIcon>
              <FontAwesomeIcon icon={faInbox} />
            </EmptyIcon>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "#666" }}>
              No past orders yet
            </p>
            <p style={{ fontSize: "0.85rem" }}>
              Completed orders will appear here
            </p>
          </EmptyState>
        )}

        {orders.map((order, i) => (
          <OrderCard key={order.id} $delay={i}>
            <CardTop>
              <OrderId>Order #{order.orderId.slice(-6)}</OrderId>
              <DeliveredBadge>
                <FontAwesomeIcon icon={faCheckCircle} />
                Delivered
              </DeliveredBadge>
            </CardTop>

            <ItemsList>
              {order.items.map((item, idx) => (
                <div key={idx}>
                  {item.qty}× {item.name}
                </div>
              ))}
            </ItemsList>

            <CardBottom>
              <div>
                <TotalPrice>
                  {(order.foodTotalTon + order.deliveryFeeTon).toFixed(2)} TON
                </TotalPrice>
                <br />
                <DateLabel>{formatDate(order.createdAt)}</DateLabel>
              </div>
              <ReorderBtn
                onClick={() => navigate(`/store/${order.storeId}`)}
              >
                <FontAwesomeIcon icon={faRotateRight} />
                Reorder
              </ReorderBtn>
            </CardBottom>
          </OrderCard>
        ))}
      </Content>
    </Page>
  );
};

export default OrderHistoryPage;
