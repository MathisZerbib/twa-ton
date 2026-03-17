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
  background: var(--bg-primary);
  min-height: 100vh;
  padding-bottom: 40px;
`;

const Content = styled.div`
  max-width: 1080px;
  margin: 0 auto;
  padding: 20px 16px;
  width: 100%;

  /* Full width on mobile */
  @media (max-width: 480px) {
    padding: 16px 12px;
  }

  /* Better padding on larger screens */
  @media (min-width: 768px) {
    padding: 24px 20px;
  }
`;

const OrdersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;

  @media (min-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 900;
  margin: 0 0 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
`;

const Loader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 0;
  color: var(--text-hint);
  font-size: 1.5rem;

  svg {
    animation: ${spin} 1s linear infinite;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: var(--text-hint);
  animation: ${fadeUp} 0.4s ease;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 16px;
  color: var(--bg-tertiary);
`;

const OrderCard = styled.div<{ $delay: number }>`
  background: var(--bg-secondary);
  border-radius: 18px;
  padding: 18px 20px;
  margin-bottom: 0;
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
  color: var(--text-primary);
`;

const DeliveredBadge = styled.span`
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 8px;
  background: hsla(var(--hue-success),var(--sat-success),var(--light-success),0.12);
  color: var(--success-dark);
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ItemsList = styled.div`
  font-size: 0.85rem;
  color: var(--text-hint);
  margin-bottom: 10px;
  line-height: 1.5;
`;

const CardBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 380px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
`;

const TotalPrice = styled.span`
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--text-primary);
`;

const DateLabel = styled.span`
  font-size: 0.78rem;
  color: var(--text-hint);
  font-weight: 600;
`;

const ReorderBtn = styled.button`
  background: hsla(var(--hue-brand),var(--sat-brand),var(--light-brand),0.1);
  color: var(--accent);
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
    background: hsla(var(--hue-brand),var(--sat-brand),var(--light-brand),0.18);
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
    api
      .getOrdersByWallet(wallet)
      .then((data) => {
        // Only delivered orders
        setOrders(data.filter((o) => o.status === "delivered"));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [wallet]);

  return (
    <Page>
      <Header showConnectButton />
      <Content>
        <Title>
          <FontAwesomeIcon
            icon={faClockRotateLeft}
            style={{ color: "var(--accent)" }}
          />
          Past Orders
        </Title>

        {loading && (
          <LoadingAnimation message="Loading order history…" />
        )}

        {!loading && !wallet && (
          <EmptyState>
            <EmptyIcon>
              <FontAwesomeIcon icon={faInbox} />
            </EmptyIcon>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-hint)" }}>
              Connect your wallet
            </p>
            <p style={{ fontSize: "0.85rem" }}>
              to see your past orders.
            </p>
          </EmptyState>
        )}

        {!loading && wallet && orders.length === 0 && (
          <EmptyState>
            <EmptyIcon>
              <FontAwesomeIcon icon={faInbox} />
            </EmptyIcon>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-hint)" }}>
              No past orders yet
            </p>
            <p style={{ fontSize: "0.85rem" }}>
              Delivered orders will appear here.
            </p>
          </EmptyState>
        )}

        <OrdersGrid>
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
                  Order Again
                </ReorderBtn>
              </CardBottom>
            </OrderCard>
          ))}
        </OrdersGrid>
      </Content>
    </Page>
  );
};

export default OrderHistoryPage;
