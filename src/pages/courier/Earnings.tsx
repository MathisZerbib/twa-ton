/**
 * Earnings — Courier earnings dashboard.
 *
 * Bold, asymmetric redesign emphasizing today's momentum and weekly progress.
 * Shows: Today's pace, Weekly performance (primary), Lifetime impact,
 * On-chain transaction history with celebratory moments.
 */

import React, { useEffect, useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCoins,
  faCalendarDay,
  faCalendarWeek,
  faMotorcycle,
  faSpinner,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import WalletTxList from "../../components/WalletTxList";
import { api, BackendOrder } from "../../services/api";

interface Props {
  wallet: string;
}

const fadeUp = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;
const scaleIn = keyframes`from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}`;
const spin = keyframes`to{transform:rotate(360deg)}`;

const Container = styled.div`
  max-width: 1080px;
  margin: 0 auto;
  width: 100%;
  padding: 18px 14px;
  padding-bottom: 100px;

  @media (max-width: 480px) {
    padding: 12px;
    padding-bottom: 96px;
  }

  @media (min-width: 768px) {
    padding: 18px 20px 110px;
  }
`;

/* ─────────────────────────────────────────────────────────────────── 
   HERO: Asymmetric layout with left accent stripe
   Today's earnings + pace context, no decorative gradient
   ─────────────────────────────────────────────────────────────────── */

const HeroCard = styled.div`
  background: var(--bg-secondary);
  border-radius: 28px;
  padding: 0;
  color: var(--text-primary);
  margin-bottom: 28px;
  animation: ${fadeUp} 0.4s ease;
  border: 1px solid var(--bg-tertiary);
  display: grid;
  grid-template-columns: 6px 1fr;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }

  @media (max-width: 560px) {
    grid-template-columns: 4px 1fr;
  }
`;

const HeroStripe = styled.div`
  background: linear-gradient(180deg, var(--accent) 0%, #FF6B35 100%);
  width: 100%;
  height: auto;
`;

const HeroContent = styled.div`
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  @media (max-width: 560px) {
    padding: 24px 18px;
  }
`;

const HeroTop = styled.div`
  margin-bottom: 20px;
`;

const HeroKicker = styled.div`
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-hint);
  margin-bottom: 6px;
`;

const HeroTitle = styled.div`
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-hint);
  margin-bottom: 2px;
  letter-spacing: -0.01em;
`;

const HeroValue = styled.div`
  font-size: clamp(2.8rem, 7vw, 4.2rem);
  font-weight: 900;
  color: var(--accent);
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 8px;
`;

const HeroPace = styled.div`
  font-size: 0.88rem;
  color: var(--text-primary);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const PaceValue = styled.span`
  font-weight: 800;
  color: #4caf50;
`;

/* ─────────────────────────────────────────────────────────────────── 
   STATS: Asymmetric differentiation by size & weight
   Primary (This week) is 40% larger, secondary (Today), tertiary (Impact)
   ─────────────────────────────────────────────────────────────────── */

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  margin-bottom: 28px;

  @media (min-width: 1024px) {
    grid-template-columns: 1.6fr 1fr 1fr;
    gap: 16px;
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
    gap: 14px;
  }
`;

const StatCard = styled.div<{ $delay: number; $primary?: boolean }>`
  background: var(--bg-secondary);
  border-radius: 20px;
  padding: ${(p) => p.$primary ? "28px 24px" : "20px 18px"};
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--bg-tertiary);
  animation: ${fadeUp} 0.3s ease ${(p) => p.$delay * 0.08}s both;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.06);
  }

  @media (max-width: 560px) {
    padding: ${(p) => p.$primary ? "22px 18px" : "16px 14px"};
  }
`;

const StatIconBox = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${(p) => `color-mix(in srgb, ${p.$color} 12%, var(--bg-primary))`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(p) => p.$color};
  font-size: 1rem;
  margin-bottom: 12px;
  flex-shrink: 0;
`;

const StatValue = styled.div<{ $primary?: boolean }>`
  font-size: ${(p) => p.$primary ? "clamp(1.8rem, 5vw, 2.6rem)" : "clamp(1.4rem, 4vw, 1.8rem)"};
  font-weight: 900;
  color: var(--text-primary);
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 0.72rem;
  color: var(--text-hint);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const StatSub = styled.div`
  font-size: 0.8rem;
  color: var(--text-primary);
  margin-top: 8px;
  line-height: 1.4;
`;

/* ─────────────────────────────────────────────────────────────────── 
   MILESTONE CELEBRATION
   Shows momentary celebratory message for achievements
   ─────────────────────────────────────────────────────────────────── */

const MilestoneCard = styled.div`
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(255, 152, 0, 0.08) 100%);
  border: 1px solid color-mix(in srgb, #4caf50 25%, transparent);
  border-radius: 16px;
  padding: 16px 18px;
  margin-bottom: 20px;
  animation: ${scaleIn} 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.4;

  svg {
    font-size: 1.3rem;
    color: #4caf50;
    flex-shrink: 0;
  }
`;

const SectionTitle = styled.div`
  font-size: 0.76rem;
  font-weight: 800;
  color: var(--text-hint);
  text-transform: uppercase;
  letter-spacing: 0.09em;
  margin: 32px 0 14px 0;
`;

const ErrorCard = styled.div`
  background: color-mix(in srgb, var(--error) 10%, var(--bg-secondary));
  border: 1px solid color-mix(in srgb, var(--error) 30%, transparent);
  border-radius: 14px;
  padding: 12px 14px;
  color: var(--text-primary);
  font-size: 0.8rem;
  margin-bottom: 14px;
`;

const SpinIcon = styled(FontAwesomeIcon)`
  animation: ${spin} 0.8s linear infinite;
`;

const Earnings: React.FC<Props> = ({ wallet }) => {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoadError(null);
      const data = await api.getCourierOrders(wallet);
      setOrders(data);
    } catch {
      setLoadError("We're fetching your latest earnings in the background. Check back in a moment.");
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

  // Earnings calculations
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

  // Calculate "pace" — if earned X today, weekly pace would be 7x that
  const weeklyPace = todayTON * 7;
  const weeklyPaceFormatted = weeklyPace.toFixed(2);
  const paceComparison = weekTON >= weeklyPace ? "💪 Ahead of pace" : `On pace for ${weeklyPaceFormatted} TON this week`;

  // Milestone celebrations
  const milestones = [200, 500, 1000];
  const nextMilestone = milestones.find((m) => m <= delivered.length && m > delivered.length - 5);
  const showMilestone = nextMilestone && delivered.length === nextMilestone;

  // Today's deliveries count
  const todayDeliveries = delivered
    .filter((o) => {
      const t = typeof o.updatedAt === "number" && o.updatedAt < 1e12
        ? o.updatedAt * 1000
        : o.updatedAt;
      return t >= dayAgo;
    }).length;

  return (
    <Container>
      {loadError && <ErrorCard>{loadError}</ErrorCard>}

      {showMilestone && (
        <MilestoneCard>
          <FontAwesomeIcon icon={faTrophy} />
          <div>
            🎉 You've delivered for {delivered.length} customers. That's incredible growth! Keep the momentum going.
          </div>
        </MilestoneCard>
      )}

      {/* ─── HERO: Today's momentum with weekly pace context ─── */}
      <HeroCard>
        <HeroStripe />
        <HeroContent>
          <HeroTop>
            <HeroKicker>Today's earnings</HeroKicker>
            <HeroTitle>How you're doing right now</HeroTitle>
            <HeroValue>
              {loading ? (
                <SpinIcon icon={faSpinner} style={{ fontSize: "1.5rem" }} />
              ) : (
                `${todayTON.toFixed(3)}`
              )}
            </HeroValue>
            <HeroValue style={{ fontSize: "clamp(0.95rem, 2.5vw, 1.2rem)", color: "var(--text-primary)", fontWeight: 600, marginBottom: 0 }}>
              TON
            </HeroValue>
          </HeroTop>
          <HeroPace>
            {loading ? (
              <SpinIcon icon={faSpinner} style={{ fontSize: "0.85rem" }} />
            ) : (
              <>
                <span>{paceComparison}</span>
                {todayDeliveries > 0 && (
                  <span style={{ marginLeft: "auto", color: "var(--text-hint)", fontSize: "0.75rem" }}>
                    {todayDeliveries} {todayDeliveries === 1 ? "delivery" : "deliveries"} so far
                  </span>
                )}
              </>
            )}
          </HeroPace>
        </HeroContent>
      </HeroCard>

      {/* ─── STATS: Asymmetric layout emphasizing weekly performance ─── */}
      <StatsGrid>
        {/* Primary: This week (larger) */}
        <StatCard $delay={0} $primary>
          <StatIconBox $color="var(--accent)">
            <FontAwesomeIcon icon={faCalendarWeek} />
          </StatIconBox>
          <StatValue $primary>{weekTON.toFixed(3)}</StatValue>
          <StatLabel>This week performance</StatLabel>
          <StatSub>
            {delivered
              .filter((o) => {
                const t = typeof o.updatedAt === "number" && o.updatedAt < 1e12
                  ? o.updatedAt * 1000
                  : o.updatedAt;
                return t >= weekAgo;
              })
              .length.toString()} deliveries completed
          </StatSub>
        </StatCard>

        {/* Secondary: Today */}
        <StatCard $delay={1}>
          <StatIconBox $color="#FF6B35">
            <FontAwesomeIcon icon={faCalendarDay} />
          </StatIconBox>
          <StatValue>{todayTON.toFixed(3)}</StatValue>
          <StatLabel>Today</StatLabel>
        </StatCard>

        {/* Tertiary: Lifetime impact (desktop only shows on 3-col, wraps on mobile) */}
        <StatCard $delay={2}>
          <StatIconBox $color="#4caf50">
            <FontAwesomeIcon icon={faMotorcycle} />
          </StatIconBox>
          <StatValue>{delivered.length}</StatValue>
          <StatLabel>Lifetime reached</StatLabel>
          <StatSub style={{ fontSize: "0.75rem" }}>
            customers delivered for
          </StatSub>
        </StatCard>
      </StatsGrid>

      <SectionTitle>
        <FontAwesomeIcon icon={faCoins} />
        Recent transactions
      </SectionTitle>
      <WalletTxList walletAddress={wallet} />
    </Container>
  );
};

export default Earnings;
