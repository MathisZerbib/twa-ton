/**
 * Earnings — Courier earnings dashboard.
 *
 * Shows:
 *   • Today / This week / All time earnings in TON
 *   • Total delivery count
 *   • On-chain transaction history
 */

import React, { useEffect, useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCoins,
  faCalendarDay,
  faCalendarWeek,
  faInfinity,
  faMotorcycle,
  faArrowTrendUp,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import WalletTxList from "../../components/WalletTxList";
import { api, BackendOrder } from "../../services/api";

interface Props {
  wallet: string;
}

const fadeUp = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;
const spin = keyframes`to{transform:rotate(360deg)}`;

const Container = styled.div`
  padding: 14px;
  padding-bottom: 100px;
`;

const HeroCard = styled.div`
  background: linear-gradient(135deg, #1a1a2e, #0f3460);
  border-radius: 22px;
  padding: 24px 20px;
  color: #fff;
  margin-bottom: 14px;
  animation: ${fadeUp} 0.4s ease;
`;

const HeroTitle = styled.div`
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 6px;
`;

const HeroValue = styled.div`
  font-size: 2.2rem;
  font-weight: 900;
  color: #ffd23f;
  margin-bottom: 2px;
`;

const HeroSub = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 18px;
`;

const StatCard = styled.div<{ $delay: number }>`
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  animation: ${fadeUp} 0.3s ease ${(p) => p.$delay * 0.1}s both;
`;

const StatIcon = styled.div<{ $bg: string }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${(p) => p.$bg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.85rem;
  margin-bottom: 8px;
`;

const StatValue = styled.div`
  font-size: 1.15rem;
  font-weight: 800;
  color: #1a1a1a;
`;

const StatLabel = styled.div`
  font-size: 0.7rem;
  color: #999;
  margin-top: 2px;
`;

const SectionTitle = styled.div`
  font-size: 0.78rem;
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 20px 0 10px 4px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SpinIcon = styled(FontAwesomeIcon)`
  animation: ${spin} 0.8s linear infinite;
`;

const Earnings: React.FC<Props> = ({ wallet }) => {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const data = await api.getCourierOrders(wallet);
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const delivered = orders.filter((o) => o.status === "delivered");
  const now = Date.now();
  const dayAgo = now - 86400000;
  const weekAgo = now - 7 * 86400000;

  const totalTON = delivered.reduce((s, o) => s + o.deliveryFeeTon, 0);
  const todayTON = delivered
    .filter((o) => {
      const t = typeof o.updatedAt === "number" && o.updatedAt < 1e12
        ? o.updatedAt * 1000
        : o.updatedAt;
      return t >= dayAgo;
    })
    .reduce((s, o) => s + o.deliveryFeeTon, 0);
  const weekTON = delivered
    .filter((o) => {
      const t = typeof o.updatedAt === "number" && o.updatedAt < 1e12
        ? o.updatedAt * 1000
        : o.updatedAt;
      return t >= weekAgo;
    })
    .reduce((s, o) => s + o.deliveryFeeTon, 0);

  return (
    <Container>
      <HeroCard>
        <HeroTitle>Total Earnings</HeroTitle>
        <HeroValue>
          {loading ? (
            <SpinIcon icon={faSpinner} style={{ fontSize: "1.5rem" }} />
          ) : (
            `${totalTON.toFixed(3)} TON`
          )}
        </HeroValue>
        <HeroSub>
          {delivered.length} deliver{delivered.length !== 1 ? "ies" : "y"}{" "}
          completed
        </HeroSub>
      </HeroCard>

      <StatsGrid>
        <StatCard $delay={0}>
          <StatIcon $bg="linear-gradient(135deg,#FF6B35,#F7931E)">
            <FontAwesomeIcon icon={faCalendarDay} />
          </StatIcon>
          <StatValue>{todayTON.toFixed(3)}</StatValue>
          <StatLabel>Today (TON)</StatLabel>
        </StatCard>

        <StatCard $delay={1}>
          <StatIcon $bg="linear-gradient(135deg,#2196f3,#1976d2)">
            <FontAwesomeIcon icon={faCalendarWeek} />
          </StatIcon>
          <StatValue>{weekTON.toFixed(3)}</StatValue>
          <StatLabel>This week (TON)</StatLabel>
        </StatCard>

        <StatCard $delay={2}>
          <StatIcon $bg="linear-gradient(135deg,#4caf50,#2e7d32)">
            <FontAwesomeIcon icon={faMotorcycle} />
          </StatIcon>
          <StatValue>{delivered.length}</StatValue>
          <StatLabel>Deliveries</StatLabel>
        </StatCard>

        <StatCard $delay={3}>
          <StatIcon $bg="linear-gradient(135deg,#9c27b0,#7b1fa2)">
            <FontAwesomeIcon icon={faArrowTrendUp} />
          </StatIcon>
          <StatValue>
            {delivered.length > 0
              ? `${(totalTON / delivered.length).toFixed(3)}`
              : "0"}
          </StatValue>
          <StatLabel>Avg / delivery (TON)</StatLabel>
        </StatCard>
      </StatsGrid>

      <SectionTitle>
        <FontAwesomeIcon icon={faCoins} />
        On-chain Transactions
      </SectionTitle>
      <WalletTxList walletAddress={wallet} />
    </Container>
  );
};

export default Earnings;
