/**
 * MyDeliveries — Courier's order history and active deliveries.
 *
 * Shows all orders the courier has accepted, in 2 sections:
 *   • Active (accepted / picked_up)
 *   • Completed (delivered)
 */

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMotorcycle,
  faLocationDot,
  faCheckCircle,
  faClock,
  faBoxOpen,
  faSpinner,
  faBagShopping,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { api, BackendOrder } from "../../services/api";

interface Props {
  courierWallet: string;
  onResumeDelivery: (order: BackendOrder) => void;
}

const fadeUp = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;
const spin = keyframes`to{transform:rotate(360deg)}`;

const Container = styled.div`
  padding: 14px;
  padding-bottom: 100px;
`;

const SectionLabel = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #aaa;
  margin: 16px 0 10px 4px;
`;

const Card = styled.div<{ $delay: number }>`
  background: #fff;
  border-radius: 16px;
  padding: 14px 16px;
  margin-bottom: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  animation: ${fadeUp} 0.3s ease ${(p) => p.$delay * 0.05}s both;
`;

const CardRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const OrderInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const OrderTitle = styled.div`
  font-weight: 800;
  font-size: 0.88rem;
  color: #1a1a1a;
`;

const OrderSub = styled.div`
  font-size: 0.76rem;
  color: #888;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StatusBadge = styled.span<{ $color: string }>`
  background: ${(p) => p.$color};
  color: #fff;
  font-size: 0.66rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  white-space: nowrap;
`;

const ResumeBtn = styled.button`
  background: linear-gradient(135deg, #ff6b35, #f7931e);
  border: none;
  color: #fff;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
  &:active {
    transform: scale(0.96);
  }
`;

const EarnChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #e8f5e9;
  color: #2e7d32;
  font-weight: 700;
  font-size: 0.76rem;
  padding: 4px 10px;
  border-radius: 8px;
  margin-top: 6px;
`;

const Center = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  gap: 12px;
  text-align: center;
  color: #888;
`;

const SpinIcon = styled(FontAwesomeIcon)`
  animation: ${spin} 0.8s linear infinite;
  font-size: 1.5rem;
  color: #ccc;
`;

function formatTime(ts: number): string {
  const d = new Date(typeof ts === "number" && ts < 1e12 ? ts * 1000 : ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

function statusColor(status: string): string {
  switch (status) {
    case "accepted":
      return "#2196f3";
    case "picked_up":
      return "#FF6B35";
    case "delivered":
      return "#4caf50";
    case "cancelled":
      return "#f44336";
    default:
      return "#999";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "accepted":
      return "Picking up";
    case "picked_up":
      return "Delivering";
    case "delivered":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

const MyDeliveries: React.FC<Props> = ({ courierWallet, onResumeDelivery }) => {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getCourierOrders(courierWallet);
        if (!cancelled) setOrders(data);
      } catch (e) {
        console.error("Failed to fetch courier orders:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courierWallet]);

  if (loading) {
    return (
      <Center>
        <SpinIcon icon={faSpinner} />
        <p style={{ fontSize: "0.85rem", margin: 0 }}>Loading your deliveries…</p>
      </Center>
    );
  }

  const active = orders.filter(
    (o) => o.status === "accepted" || o.status === "picked_up"
  );
  const completed = orders.filter(
    (o) => o.status === "delivered" || o.status === "cancelled"
  );

  if (orders.length === 0) {
    return (
      <Center>
        <FontAwesomeIcon
          icon={faBoxOpen}
          style={{ fontSize: "2.5rem", opacity: 0.3 }}
        />
        <p style={{ fontWeight: 700, fontSize: "1rem", margin: 0 }}>
          No deliveries yet
        </p>
        <p style={{ maxWidth: 260, lineHeight: 1.5, margin: 0, fontSize: "0.82rem" }}>
          Accept an order from the feed to start earning!
        </p>
      </Center>
    );
  }

  return (
    <Container>
      {/* Active */}
      {active.length > 0 && (
        <>
          <SectionLabel>
            <FontAwesomeIcon icon={faMotorcycle} style={{ marginRight: 6 }} />
            Active ({active.length})
          </SectionLabel>
          {active.map((order, i) => (
            <Card key={order.id} $delay={i}>
              <CardRow>
                <OrderInfo>
                  <OrderTitle>Order #{order.orderId.slice(-6)}</OrderTitle>
                  <OrderSub>
                    <FontAwesomeIcon icon={faLocationDot} style={{ marginRight: 4 }} />
                    {order.deliveryAddress}
                  </OrderSub>
                </OrderInfo>
                <StatusBadge $color={statusColor(order.status)}>
                  {statusLabel(order.status)}
                </StatusBadge>
              </CardRow>
              <EarnChip>
                +{order.deliveryFeeTon.toFixed(3)} TON
              </EarnChip>
              <ResumeBtn onClick={() => onResumeDelivery(order)}>
                <FontAwesomeIcon icon={faArrowRight} />
                Resume delivery
              </ResumeBtn>
            </Card>
          ))}
        </>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <>
          <SectionLabel>
            <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: 6 }} />
            Completed ({completed.length})
          </SectionLabel>
          {completed.map((order, i) => (
            <Card key={order.id} $delay={i + active.length}>
              <CardRow>
                <OrderInfo>
                  <OrderTitle>Order #{order.orderId.slice(-6)}</OrderTitle>
                  <OrderSub>
                    <FontAwesomeIcon icon={faLocationDot} style={{ marginRight: 4 }} />
                    {order.deliveryAddress}
                  </OrderSub>
                  <OrderSub>
                    <FontAwesomeIcon icon={faClock} style={{ marginRight: 4 }} />
                    {formatTime(order.updatedAt)}
                  </OrderSub>
                </OrderInfo>
                <StatusBadge $color={statusColor(order.status)}>
                  {statusLabel(order.status)}
                </StatusBadge>
              </CardRow>
              <EarnChip>
                {order.status === "delivered" ? "+" : ""}
                {order.deliveryFeeTon.toFixed(3)} TON
              </EarnChip>
            </Card>
          ))}
        </>
      )}
    </Container>
  );
};

export default MyDeliveries;
