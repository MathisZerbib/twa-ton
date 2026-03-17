/**
 * OrderFeed — Available deliveries feed for the courier.
 *
 * Shows open orders sorted by distance from the courier's GPS position.
 * Each card displays: restaurant, delivery address, distance, ETA, earnings.
 * Real-time updates via Socket.io.
 */

import React, { useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faBagShopping,
  faCoins,
  faMotorcycle,
  faSpinner,
  faBoxOpen,
  faRotateRight,
  faTriangleExclamation,
  faRoute,
  faClock,
  faArrowDown19,
  faArrowUpShortWide,
} from "@fortawesome/free-solid-svg-icons";
import { BackendOrder } from "../../services/api";
import {
  useCourierLocation,
  formatDistance,
  formatETA,
} from "../../hooks/useCourierLocation";
import LoadingAnimation from "../../components/LoadingAnimation";

interface Props {
  orders: BackendOrder[];
  loading: boolean;
  error: string | null;
  contractReady: boolean;
  acceptingId: string | null;
  onAccept: (order: BackendOrder) => void;
  onRefresh: () => void;
}

// ─── Animations ─────────────────────────────────────────────────────────────

const fadeUp = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}`;
const spin = keyframes`to{transform:rotate(360deg)}`;

// ─── Styled ─────────────────────────────────────────────────────────────────

const Container = styled.div`
  max-width: 1080px;
  margin: 0 auto;
  width: 100%;
  padding: 12px 14px 100px;

  @media (max-width: 480px) {
    padding: 10px 12px 96px;
  }

  @media (min-width: 768px) {
    padding: 16px 20px 110px;
  }
`;

const SortBar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0 12px;
  font-size: 0.78rem;
  color: #888;
`;

const FeedGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;

  @media (min-width: 860px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const SortOption = styled.button<{ $active: boolean }>`
  border: none;
  background: ${(p) => (p.$active ? 'var(--text-primary)' : 'var(--bg-secondary)')};
  color: ${(p) => (p.$active ? '#fff' : 'var(--text-hint)')};
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
`;

const Card = styled.div<{ $delay: number }>`
  background: #fff;
  border-radius: 20px;
  padding: 0;
  margin-bottom: 0;
  height: 100%;
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.06);
  animation: ${fadeUp} 0.35s ease ${(p) => p.$delay * 0.06}s both;
  overflow: hidden;
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
`;

const StoreName = styled.div`
  font-weight: 800;
  font-size: 0.95rem;
  color: #1a1a1a;
`;

const DistanceBadge = styled.div<{ $near: boolean }>`
  background: ${(p) =>
    p.$near ? "linear-gradient(135deg,var(--success),var(--success-dark))" : "var(--bg-secondary)"};
  color: ${(p) => (p.$near ? "#fff" : "var(--text-hint)")};
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const CardBody = styled.div`
  padding: 10px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.83rem;
  color: var(--text-hint);
`;

const Icon = styled.div<{ $bg?: string }>`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: ${(p) => p.$bg ?? "linear-gradient(135deg,var(--accent),#F7931E)"};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  flex-shrink: 0;
`;

const InfoVal = styled.div`
  flex: 1;
  font-size: 0.82rem;
  line-height: 1.4;
`;

const MetaRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 2px;
`;

const MetaChip = styled.div<{ $bg: string; $color: string }>`
  background: ${(p) => p.$bg};
  color: ${(p) => p.$color};
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const AcceptBtn = styled.button<{ $disabled: boolean }>`
  width: 100%;
  padding: 14px;
  border: none;
  background: ${(p) =>
    p.$disabled
      ? "var(--bg-tertiary)"
      : "linear-gradient(135deg,#1a1a2e,#0f3460)"};
  color: ${(p) => (p.$disabled ? "var(--text-hint)" : "#fff")};
  font-size: 0.92rem;
  font-weight: 800;
  cursor: ${(p) => (p.$disabled ? "not-allowed" : "pointer")};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;

  &:active:not(:disabled) {
    transform: scale(0.97);
  }
`;

const SpinIcon = styled(FontAwesomeIcon)`
  animation: ${spin} 0.8s linear infinite;
`;

const Center = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  gap: 14px;
  text-align: center;
  color: var(--text-hint);
`;

const RefreshBtn = styled.button`
  padding: 10px 22px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, var(--accent), #f7931e);
  color: #fff;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 12px hsla(var(--hue-brand),var(--sat-brand),var(--light-brand),0.35);
  &:active {
    transform: scale(0.96);
  }
`;

// ─── Helpers ────────────────────────────────────────────────────────────────

function shortAddr(a: string) {
  if (!a || a.length < 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

type SortMode = "distance" | "earnings" | "newest";

// ─── Component ──────────────────────────────────────────────────────────────

const OrderFeed: React.FC<Props> = ({
  orders,
  loading,
  error,
  contractReady,
  acceptingId,
  onAccept,
  onRefresh,
}) => {
  const { position, distanceTo, etaTo } = useCourierLocation();
  const [sort, setSort] = useState<SortMode>("distance");

  // Enrich orders with distance/ETA from courier
  const enrichedOrders = useMemo(() => {
    return orders.map((order) => {
      const storeDist =
        order.storeLat && order.storeLng
          ? distanceTo(order.storeLat, order.storeLng)
          : null;
      const storeEta =
        order.storeLat && order.storeLng
          ? etaTo(order.storeLat, order.storeLng)
          : null;
      const deliveryDist =
        order.deliveryLat && order.deliveryLng
          ? distanceTo(order.deliveryLat, order.deliveryLng)
          : null;
      return { order, storeDist, storeEta, deliveryDist };
    });
  }, [orders, distanceTo, etaTo]);

  // Sort
  const sorted = useMemo(() => {
    const copy = [...enrichedOrders];
    switch (sort) {
      case "distance":
        copy.sort(
          (a, b) => (a.storeDist ?? 99999) - (b.storeDist ?? 99999)
        );
        break;
      case "earnings":
        copy.sort(
          (a, b) => b.order.deliveryFeeTon - a.order.deliveryFeeTon
        );
        break;
      case "newest":
        copy.sort((a, b) => b.order.createdAt - a.order.createdAt);
        break;
    }
    return copy;
  }, [enrichedOrders, sort]);

  if (loading) {
    return (
      <Center>
        <LoadingAnimation message="Finding deliveries near you…" size={140} />
      </Center>
    );
  }

  if (error) {
    return (
      <Center>
        <FontAwesomeIcon
          icon={faTriangleExclamation}
          style={{ fontSize: "2rem", color: "var(--error, #f44336)" }}
        />
        <p style={{ fontSize: "0.88rem", maxWidth: 260, lineHeight: 1.5, margin: 0 }}>
          {error}
        </p>
        <RefreshBtn onClick={onRefresh}>
          <FontAwesomeIcon icon={faRotateRight} /> Retry
        </RefreshBtn>
      </Center>
    );
  }

  if (orders.length === 0) {
    return (
      <Center>
        <FontAwesomeIcon
          icon={faBoxOpen}
          style={{ fontSize: "2.5rem", opacity: 0.3 }}
        />
        <p
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            margin: 0,
            color: "#555",
          }}
        >
          No deliveries available
        </p>
        <p
          style={{
            fontSize: "0.82rem",
            maxWidth: 260,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          New orders pop up in real-time. Stay online!
        </p>
        <RefreshBtn onClick={onRefresh}>
          <FontAwesomeIcon icon={faRotateRight} /> Refresh
        </RefreshBtn>
      </Center>
    );
  }

  return (
    <Container>
      {/* Sort bar */}
      <SortBar>
        <span style={{ fontWeight: 600 }}>Sort:</span>
        <SortOption
          $active={sort === "distance"}
          onClick={() => setSort("distance")}
        >
          <FontAwesomeIcon icon={faRoute} /> Nearest
        </SortOption>
        <SortOption
          $active={sort === "earnings"}
          onClick={() => setSort("earnings")}
        >
          <FontAwesomeIcon icon={faArrowDown19} /> Best pay
        </SortOption>
        <SortOption
          $active={sort === "newest"}
          onClick={() => setSort("newest")}
        >
          <FontAwesomeIcon icon={faArrowUpShortWide} /> Newest
        </SortOption>
      </SortBar>

      <FeedGrid>
        {sorted.map(({ order, storeDist, storeEta }, i) => {
          const isAccepting = acceptingId === order.id;
          const isNear = storeDist !== null && storeDist < 3000;
          return (
            <Card key={order.id} $delay={i}>
              <CardTop>
                <div>
                  <StoreName>
                    Order #{order.orderId.slice(-6)}
                  </StoreName>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-hint)",
                      marginTop: 2,
                    }}
                  >
                    {order.items.length > 0
                      ? order.items.map((it) => `${it.qty}× ${it.name}`).join(", ")
                      : "Items loading…"}
                  </div>
                </div>
                {storeDist !== null && (
                  <DistanceBadge $near={isNear}>
                    <FontAwesomeIcon icon={faRoute} />
                    {formatDistance(storeDist)}
                  </DistanceBadge>
                )}
              </CardTop>

              <CardBody>
                <Row>
                  <Icon>
                    <FontAwesomeIcon icon={faLocationDot} />
                  </Icon>
                  <InfoVal>
                    <strong>Deliver to</strong>
                    <br />
                    {order.deliveryAddress}
                  </InfoVal>
                </Row>

                <MetaRow>
                  {storeEta !== null && (
                    <MetaChip $bg="#e8f5e9" $color="var(--success-dark)">
                      <FontAwesomeIcon icon={faClock} />
                      {formatETA(storeEta)} to store
                    </MetaChip>
                  )}
                  <MetaChip $bg="#fff3e0" $color="var(--accent-dark)">
                    <FontAwesomeIcon icon={faCoins} />
                    {order.deliveryFeeTon.toFixed(2)} TON
                  </MetaChip>
                </MetaRow>
              </CardBody>

              <AcceptBtn
                $disabled={!contractReady || isAccepting}
                onClick={() => !isAccepting && contractReady && onAccept(order)}
              >
                {isAccepting ? (
                  <>
                    <SpinIcon icon={faSpinner} /> Signing on-chain…
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faMotorcycle} /> Accept delivery ·{" "}
                    {order.deliveryFeeTon.toFixed(2)} TON
                  </>
                )}
              </AcceptBtn>
            </Card>
          );
        })}
      </FeedGrid>
    </Container>
  );
};

export default OrderFeed;
