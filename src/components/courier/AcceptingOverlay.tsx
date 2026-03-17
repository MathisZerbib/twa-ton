/**
 * AcceptingOverlay — Full-screen loader shown while a courier accepts a delivery.
 *
 * Phases:
 *   signing    → Wallet is open, user is signing the TX
 *   confirming → TX sent, polling for on-chain confirmation
 *   confirmed  → Confirmed! Auto-transition to GPS navigation
 *   error      → Something went wrong, retry option
 */

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWallet,
  faLink,
  faCheckCircle,
  faTriangleExclamation,
  faMotorcycle,
  faArrowLeft,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

export type OverlayPhase = "signing" | "confirming" | "confirmed" | "error";

interface Props {
  phase: OverlayPhase;
  orderLabel: string;
  earnings: string;
  errorMessage?: string;
  onRetry?: () => void;
  onCancel?: () => void;
}

// ─── Animations ─────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: 0.85; }
`;

const ripple = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.4); }
  70% { box-shadow: 0 0 0 20px rgba(255, 107, 53, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const checkPop = keyframes`
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

// ─── Styled ─────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 250;
  background: linear-gradient(160deg, #0f0c29 0%, #1a1040 60%, #24243e 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  animation: ${fadeIn} 0.3s ease;
`;

const BackButton = styled.button`
  position: absolute;
  top: env(safe-area-inset-top, 16px);
  left: 16px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 16px;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &:active {
    transform: scale(0.92);
  }
`;

const IconRing = styled.div<{ $phase: OverlayPhase }>`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: ${(p) =>
    p.$phase === "confirmed"
      ? "linear-gradient(135deg, #4caf50, #2e7d32)"
      : p.$phase === "error"
      ? "linear-gradient(135deg, #f44336, #c62828)"
      : "linear-gradient(135deg, #FF6B35, #F7931E)"};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
  animation: ${(p) =>
    p.$phase === "confirmed"
      ? checkPop
      : p.$phase === "error"
      ? scaleIn
      : ripple}
    ${(p) => (p.$phase === "confirmed" ? "0.5s" : "2s")}
    ${(p) =>
      p.$phase === "confirmed" || p.$phase === "error"
        ? "ease"
        : "ease infinite"};
  font-size: 2.2rem;
  color: #fff;
`;

const Title = styled.h2<{ $phase: OverlayPhase }>`
  font-size: 1.4rem;
  font-weight: 900;
  color: #fff;
  margin: 0 0 8px;
  text-align: center;
  animation: ${slideUp} 0.4s ease;
`;

const Subtitle = styled.p`
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.55);
  text-align: center;
  margin: 0 0 32px;
  max-width: 300px;
  line-height: 1.6;
  animation: ${slideUp} 0.4s ease 0.05s both;
`;

const StepsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  max-width: 300px;
  animation: ${slideUp} 0.4s ease 0.1s both;
`;

const StepRow = styled.div<{ $active: boolean; $done: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: ${(p) =>
    p.$active ? "rgba(255, 107, 53, 0.1)" : "rgba(255, 255, 255, 0.04)"};
  border: 1px solid
    ${(p) =>
      p.$done
        ? "rgba(76, 175, 80, 0.3)"
        : p.$active
        ? "rgba(255, 107, 53, 0.3)"
        : "rgba(255, 255, 255, 0.06)"};
  border-radius: 16px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
`;

const StepIcon = styled.div<{ $active: boolean; $done: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${(p) =>
    p.$done
      ? "linear-gradient(135deg, #4caf50, #2e7d32)"
      : p.$active
      ? "linear-gradient(135deg, #FF6B35, #F7931E)"
      : "rgba(255, 255, 255, 0.08)"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${(p) => (p.$done || p.$active ? "#fff" : "rgba(255,255,255,0.3)")};
  font-size: 0.85rem;
`;

const SpinIcon = styled(FontAwesomeIcon)`
  animation: ${spin} 0.8s linear infinite;
`;

const StepText = styled.div<{ $active: boolean; $done: boolean }>`
  flex: 1;
`;

const StepLabel = styled.div<{ $active: boolean; $done: boolean }>`
  font-size: 0.88rem;
  font-weight: ${(p) => (p.$active ? 700 : 600)};
  color: ${(p) =>
    p.$done
      ? "#4caf50"
      : p.$active
      ? "#fff"
      : "rgba(255, 255, 255, 0.3)"};
`;

const StepSub = styled.div<{ $active: boolean }>`
  font-size: 0.72rem;
  color: ${(p) =>
    p.$active ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.2)"};
  margin-top: 2px;
`;

const EarningsChip = styled.div`
  margin-top: 24px;
  padding: 10px 20px;
  border-radius: 14px;
  background: rgba(255, 210, 63, 0.1);
  border: 1px solid rgba(255, 210, 63, 0.25);
  color: #ffd23f;
  font-size: 0.88rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: ${float} 2.5s ease infinite;
`;

const ErrorBox = styled.div`
  margin-top: 16px;
  padding: 14px 18px;
  border-radius: 14px;
  background: rgba(244, 67, 54, 0.12);
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.82rem;
  text-align: center;
  max-width: 300px;
  line-height: 1.5;
`;

const RetryBtn = styled.button`
  margin-top: 20px;
  padding: 14px 36px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #ff6b35, #f7931e);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(255, 107, 53, 0.4);
  &:active {
    transform: scale(0.96);
  }
`;

const ConfirmedMsg = styled.div`
  margin-top: 16px;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.45);
  animation: ${pulse} 1.5s ease infinite;
`;

// ─── Component ──────────────────────────────────────────────────────────────

const PHASE_CONTENT: Record<
  OverlayPhase,
  { title: string; subtitle: string; icon: typeof faWallet }
> = {
  signing: {
    title: "Sign Transaction",
    subtitle: "Confirm the transaction in your TON wallet to accept this delivery.",
    icon: faWallet,
  },
  confirming: {
    title: "Confirming on Chain",
    subtitle: "Transaction sent! Waiting for the TON blockchain to confirm…",
    icon: faLink,
  },
  confirmed: {
    title: "You're On!",
    subtitle: "Delivery accepted. Opening GPS navigation…",
    icon: faCheckCircle,
  },
  error: {
    title: "Something Went Wrong",
    subtitle: "The transaction could not be completed. Please try again.",
    icon: faTriangleExclamation,
  },
};

const AcceptingOverlay: React.FC<Props> = ({
  phase,
  orderLabel,
  earnings,
  errorMessage,
  onRetry,
  onCancel,
}) => {
  const content = PHASE_CONTENT[phase];
  const phaseIndex =
    phase === "signing" ? 0 : phase === "confirming" ? 1 : phase === "confirmed" ? 2 : -1;

  // Dots animation for subtitle
  const [dots, setDots] = useState("");
  useEffect(() => {
    if (phase !== "signing" && phase !== "confirming") return;
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(id);
  }, [phase]);

  return (
    <Overlay>
      {onCancel && phase !== "confirmed" && (
        <BackButton onClick={onCancel}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </BackButton>
      )}

      <IconRing $phase={phase}>
        {phase === "signing" && <SpinIcon icon={faWallet} />}
        {phase === "confirming" && <SpinIcon icon={faLink} />}
        {phase === "confirmed" && <FontAwesomeIcon icon={faMotorcycle} />}
        {phase === "error" && <FontAwesomeIcon icon={faTriangleExclamation} />}
      </IconRing>

      <Title $phase={phase}>{content.title}</Title>
      <Subtitle>
        {phase === "signing" || phase === "confirming"
          ? content.subtitle.replace("…", dots)
          : content.subtitle}
      </Subtitle>

      {/* Step progress */}
      <StepsContainer>
        <StepRow $active={phaseIndex === 0} $done={phaseIndex > 0}>
          <StepIcon $active={phaseIndex === 0} $done={phaseIndex > 0}>
            {phaseIndex === 0 ? (
              <SpinIcon icon={faSpinner} />
            ) : phaseIndex > 0 ? (
              <FontAwesomeIcon icon={faCheckCircle} />
            ) : (
              <FontAwesomeIcon icon={faWallet} />
            )}
          </StepIcon>
          <StepText $active={phaseIndex === 0} $done={phaseIndex > 0}>
            <StepLabel $active={phaseIndex === 0} $done={phaseIndex > 0}>
              Sign in Wallet
            </StepLabel>
            <StepSub $active={phaseIndex >= 0}>
              Approve the 0.08 TON gas fee
            </StepSub>
          </StepText>
        </StepRow>

        <StepRow $active={phaseIndex === 1} $done={phaseIndex > 1}>
          <StepIcon $active={phaseIndex === 1} $done={phaseIndex > 1}>
            {phaseIndex === 1 ? (
              <SpinIcon icon={faSpinner} />
            ) : phaseIndex > 1 ? (
              <FontAwesomeIcon icon={faCheckCircle} />
            ) : (
              <FontAwesomeIcon icon={faLink} />
            )}
          </StepIcon>
          <StepText $active={phaseIndex === 1} $done={phaseIndex > 1}>
            <StepLabel $active={phaseIndex === 1} $done={phaseIndex > 1}>
              Blockchain Confirmation
            </StepLabel>
            <StepSub $active={phaseIndex >= 1}>
              Usually takes 5-15 seconds
            </StepSub>
          </StepText>
        </StepRow>

        <StepRow $active={phaseIndex === 2} $done={false}>
          <StepIcon $active={phaseIndex === 2} $done={false}>
            {phaseIndex === 2 ? (
              <FontAwesomeIcon icon={faCheckCircle} />
            ) : (
              <FontAwesomeIcon icon={faMotorcycle} />
            )}
          </StepIcon>
          <StepText $active={phaseIndex === 2} $done={false}>
            <StepLabel $active={phaseIndex === 2} $done={false}>
              Start Navigation
            </StepLabel>
            <StepSub $active={phaseIndex >= 2}>
              Full-screen GPS to restaurant
            </StepSub>
          </StepText>
        </StepRow>
      </StepsContainer>

      {/* Order info */}
      <EarningsChip>
        <FontAwesomeIcon icon={faMotorcycle} />
        {orderLabel} · Earn {earnings} TON
      </EarningsChip>

      {/* Confirmed auto-transition message */}
      {phase === "confirmed" && (
        <ConfirmedMsg>Loading navigation…</ConfirmedMsg>
      )}

      {/* Error state */}
      {phase === "error" && (
        <>
          {errorMessage && <ErrorBox>{errorMessage}</ErrorBox>}
          {onRetry && <RetryBtn onClick={onRetry}>Try Again</RetryBtn>}
        </>
      )}
    </Overlay>
  );
};

export default AcceptingOverlay;
