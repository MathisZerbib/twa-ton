/**
 * CourierBottomNav — Uber-Eats-style bottom tab bar for the courier app.
 *
 * Three tabs: Orders · My Deliveries · Earnings
 * Shows badges for open order count and active delivery indicator.
 */

import React from "react";
import styled, { keyframes } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMotorcycle,
  faListCheck,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";

export type CourierTab = "feed" | "my-orders" | "earnings";

interface Props {
  active: CourierTab;
  onChange: (tab: CourierTab) => void;
  orderCount?: number;
  hasActiveDelivery?: boolean;
}

const pulse = keyframes`0%,100%{transform:scale(1)}50%{transform:scale(1.15)}`;

const Bar = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  z-index: 100;
  box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.06);
`;

const TabBtn = styled.button<{ $active: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 0 8px;
  min-height: 44px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${(p) => (p.$active ? "#FF6B35" : "#999")};
  font-size: 0.66rem;
  font-weight: ${(p) => (p.$active ? "700" : "500")};
  transition: color 0.2s;
  position: relative;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  .icon {
    font-size: 1.15rem;
    transition: transform 0.2s;
    ${(p) => p.$active && `transform: translateY(-1px);`}
  }
`;

const BadgeEl = styled.span`
  position: absolute;
  top: 3px;
  right: calc(50% - 20px);
  background: #f44336;
  color: #fff;
  font-size: 0.58rem;
  font-weight: 800;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const ActiveDot = styled.div`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #ff6b35;
  position: absolute;
  bottom: 4px;
`;

const BottomNav: React.FC<Props> = ({
  active,
  onChange,
  orderCount,
  hasActiveDelivery,
}) => (
  <Bar>
    <TabBtn $active={active === "feed"} onClick={() => onChange("feed")}>
      <FontAwesomeIcon icon={faMotorcycle} className="icon" />
      <span>Orders</span>
      {(orderCount ?? 0) > 0 && active !== "feed" && (
        <BadgeEl>{orderCount}</BadgeEl>
      )}
      {active === "feed" && <ActiveDot />}
    </TabBtn>
    <TabBtn
      $active={active === "my-orders"}
      onClick={() => onChange("my-orders")}
    >
      <FontAwesomeIcon icon={faListCheck} className="icon" />
      <span>My Deliveries</span>
      {hasActiveDelivery && active !== "my-orders" && <BadgeEl>!</BadgeEl>}
      {active === "my-orders" && <ActiveDot />}
    </TabBtn>
    <TabBtn
      $active={active === "earnings"}
      onClick={() => onChange("earnings")}
    >
      <FontAwesomeIcon icon={faChartLine} className="icon" />
      <span>Earnings</span>
      {active === "earnings" && <ActiveDot />}
    </TabBtn>
  </Bar>
);

export default BottomNav;
