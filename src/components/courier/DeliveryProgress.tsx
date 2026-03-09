/**
 * DeliveryProgress — Step-by-step progress indicator for the active delivery.
 *
 * Shows: Accept → Pickup → Deliver → Complete with animated connectors.
 */

import React from "react";
import styled, { keyframes } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMotorcycle,
  faStore,
  faLocationDot,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

export type DeliveryStep = "heading_to_store" | "at_store" | "heading_to_customer" | "at_customer" | "delivered";

interface Props {
  step: DeliveryStep;
}

const STEPS: { key: DeliveryStep; label: string; icon: any }[] = [
  { key: "heading_to_store", label: "Go to store", icon: faMotorcycle },
  { key: "at_store", label: "Pick up", icon: faStore },
  { key: "heading_to_customer", label: "Deliver", icon: faLocationDot },
  { key: "delivered", label: "Done", icon: faCircleCheck },
];

function stepIndex(step: DeliveryStep): number {
  if (step === "at_customer") return 2; // same visual position as heading_to_customer
  return STEPS.findIndex((s) => s.key === step);
}

const pulse = keyframes`0%,100%{box-shadow:0 0 0 0 rgba(255,107,53,0.4)}70%{box-shadow:0 0 0 8px rgba(255,107,53,0)}`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  width: 100%;
`;

const StepDot = styled.div<{ $state: "done" | "active" | "pending" }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  flex-shrink: 0;
  transition: all 0.4s ease;

  background: ${(p) =>
    p.$state === "done"
      ? "#4caf50"
      : p.$state === "active"
      ? "linear-gradient(135deg, #FF6B35, #F7931E)"
      : "#e0e0e0"};
  color: ${(p) => (p.$state === "pending" ? "#999" : "#fff")};
  ${(p) => p.$state === "active" && `animation: ${pulse} 2s ease-in-out infinite;`}
`;

const Connector = styled.div<{ $done: boolean }>`
  flex: 1;
  height: 3px;
  margin: 0 4px;
  border-radius: 2px;
  background: ${(p) => (p.$done ? "#4caf50" : "#e0e0e0")};
  transition: background 0.4s ease;
`;

const StepGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const StepLabel = styled.span<{ $active: boolean }>`
  font-size: 0.6rem;
  font-weight: ${(p) => (p.$active ? 700 : 500)};
  color: ${(p) => (p.$active ? "#FF6B35" : "#999")};
  white-space: nowrap;
`;

const DeliveryProgress: React.FC<Props> = ({ step }) => {
  const currentIdx = stepIndex(step);

  return (
    <Wrapper>
      {STEPS.map((s, i) => {
        const state =
          i < currentIdx ? "done" : i === currentIdx ? "active" : "pending";
        return (
          <React.Fragment key={s.key}>
            {i > 0 && <Connector $done={i <= currentIdx} />}
            <StepGroup>
              <StepDot $state={state}>
                <FontAwesomeIcon icon={s.icon} />
              </StepDot>
              <StepLabel $active={state === "active"}>{s.label}</StepLabel>
            </StepGroup>
          </React.Fragment>
        );
      })}
    </Wrapper>
  );
};

export default DeliveryProgress;
