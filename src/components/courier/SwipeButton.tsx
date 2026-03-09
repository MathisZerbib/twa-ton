/**
 * SwipeButton — Uber-Eats-style swipe-to-confirm action button.
 *
 * The user drags a thumb from left to right to confirm an action.
 * Props:
 *   • label        — text displayed in the track
 *   • onSwipeComplete — fires when swipe reaches the end
 *   • color        — gradient start color
 *   • icon         — FontAwesome icon for the thumb
 *   • disabled     — prevent interaction
 *   • loading      — show spinner in thumb
 */

import React, { useRef, useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface Props {
  label: string;
  onSwipeComplete: () => void;
  color?: string;
  icon?: IconDefinition;
  disabled?: boolean;
  loading?: boolean;
}

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const spin = keyframes`to { transform: rotate(360deg); }`;

const Track = styled.div<{ $color: string; $disabled: boolean }>`
  position: relative;
  width: 100%;
  height: 60px;
  border-radius: 30px;
  background: ${(p) =>
    p.$disabled
      ? "#e0e0e0"
      : `linear-gradient(135deg, ${p.$color}, ${p.$color}dd)`};
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  box-shadow: ${(p) =>
    p.$disabled ? "none" : `0 4px 18px ${p.$color}55`};
  transition: box-shadow 0.3s;
`;

const Label = styled.span<{ $visible: boolean }>`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, ${(p) => (p.$visible ? 0.85 : 0)});
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  transition: opacity 0.2s;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    transparent 25%,
    rgba(255, 255, 255, 0.15) 50%,
    transparent 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 3s ease-in-out infinite;
`;

const Thumb = styled.div<{ $color: string; $completed: boolean }>`
  position: absolute;
  top: 4px;
  left: 4px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(p) => (p.$completed ? "#4caf50" : p.$color)};
  font-size: 1.1rem;
  cursor: grab;
  transition: ${(p) => (p.$completed ? "all 0.3s ease" : "none")};
  z-index: 2;

  &:active {
    cursor: grabbing;
  }
`;

const SpinnerIcon = styled(FontAwesomeIcon)`
  animation: ${spin} 0.8s linear infinite;
`;

const Arrows = styled.div`
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.8rem;
  display: flex;
  gap: 3px;
  pointer-events: none;
`;

const SwipeButton: React.FC<Props> = ({
  label,
  onSwipeComplete,
  color = "#FF6B35",
  icon = faChevronRight,
  disabled = false,
  loading = false,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [completed, setCompleted] = useState(false);
  const startXRef = useRef(0);
  const maxOffsetRef = useRef(0);

  const getMaxOffset = useCallback(() => {
    if (!trackRef.current) return 200;
    return trackRef.current.offsetWidth - 60; // track width - thumb width - padding
  }, []);

  const handleStart = useCallback(
    (clientX: number) => {
      if (disabled || loading || completed) return;
      startXRef.current = clientX - offsetX;
      maxOffsetRef.current = getMaxOffset();
    },
    [disabled, loading, completed, offsetX, getMaxOffset]
  );

  const handleMove = useCallback(
    (clientX: number) => {
      if (disabled || loading || completed) return;
      const delta = clientX - startXRef.current;
      const clamped = Math.max(0, Math.min(delta, maxOffsetRef.current));
      setOffsetX(clamped);
    },
    [disabled, loading, completed]
  );

  const handleEnd = useCallback(() => {
    if (disabled || loading || completed) return;
    const threshold = maxOffsetRef.current * 0.85;
    if (offsetX >= threshold) {
      setCompleted(true);
      setOffsetX(maxOffsetRef.current);
      onSwipeComplete();
    } else {
      setOffsetX(0);
    }
  }, [disabled, loading, completed, offsetX, onSwipeComplete]);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) =>
    handleStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) =>
    handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  // Mouse handlers
  const onMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX);
    const onMouseMove = (ev: MouseEvent) => handleMove(ev.clientX);
    const onMouseUp = () => {
      handleEnd();
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const progress = maxOffsetRef.current
    ? offsetX / maxOffsetRef.current
    : 0;

  return (
    <Track ref={trackRef} $color={color} $disabled={disabled || loading}>
      <Label $visible={progress < 0.3}>{label}</Label>
      <Thumb
        $color={color}
        $completed={completed}
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
      >
        {loading ? (
          <SpinnerIcon icon={faSpinner} />
        ) : (
          <FontAwesomeIcon icon={icon} />
        )}
      </Thumb>
      {!completed && progress < 0.2 && (
        <Arrows>
          <FontAwesomeIcon icon={faChevronRight} />
          <FontAwesomeIcon icon={faChevronRight} style={{ opacity: 0.6 }} />
          <FontAwesomeIcon icon={faChevronRight} style={{ opacity: 0.3 }} />
        </Arrows>
      )}
    </Track>
  );
};

export default SwipeButton;
