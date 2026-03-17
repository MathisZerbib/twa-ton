/**
 * BuyCard.tsx — TON-Eats food item card
 *
 * Clean vertical card with:
 * - Food image
 * - Name + star rating
 * - Tag chips (e.g. "Spicy", "Beef")
 * - Short description
 * - Quantity selector (1–10 portions) + Add to Cart button
 * - Price displayed in TON
 */

import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AddToCartButton } from "./AddToCartButton";
import { Rating, Star } from "./styled/styled";

// ─── Animations ───────────────────────────────────────────────────────────────
const lift = keyframes`
  from { transform: translateY(0) scale(1); box-shadow: 0 4px 12px rgba(0,0,0,0.07); }
  to   { transform: translateY(-3px) scale(1.01); box-shadow: 0 12px 28px rgba(0,0,0,0.13); }
`;

// ─── Styled Components ────────────────────────────────────────────────────────

const Card = styled.div`
  background: var(--bg-secondary);
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all var(--transition-base);
  height: 100%;
  border: 1px solid var(--bg-tertiary);

  &:hover {
    transform: translateY(-6px);
    box-shadow: var(--shadow-md);
    border-color: var(--accent-soft);
  }
`;

const ImageWrapper = styled.div<{ src: string }>`
  width: 100%;
  height: 170px;
  background-image: url(${(p) => p.src});
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  position: relative;
  transition: transform var(--transition-base);

  ${Card}:hover & {
    transform: scale(1.04);
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%);
  }
`;

const ImageContainer = styled.div`
  width: 100%;
  height: 170px;
  overflow: hidden;
  position: relative;
`;

const Body = styled.div`
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const ItemName = styled.h3`
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
  flex: 1;
  letter-spacing: -0.02em;
  min-height: 2.6rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Tag = styled.span`
  font-size: 0.725rem;
  font-weight: 900;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 8px;
  padding: 5px 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.1);
`;

const Desc = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  font-weight: 500;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 2.8rem;
`;

const BottomAction = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: auto;
  padding-top: 18px;
  border-top: 1px solid var(--bg-tertiary);
`;

const QtyWrapper = styled.div`
  display: flex;
  align-items: center;
  background: var(--bg-tertiary);
  border-radius: 14px;
  padding: 8px 14px;
  transition: background var(--transition-fast);
  
  &:focus-within {
    background: var(--bg-secondary);
    box-shadow: 0 0 0 2px var(--accent-soft);
  }
`;

const QtySelect = styled.select`
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 900;
  cursor: pointer;
  outline: none;
  appearance: none;
  padding-right: 4px;
`;

// ─── Component ────────────────────────────────────────────────────────────────

interface ProductProps {
  id: string;
  imageUrl: string;
  name: string;
  rating: number;
  strains?: string[];  // optional tags
  price: number;       // Converted price for UI
  priceUsdt: number;   // Base price in USDT for cart/checkout
  description: string;
}

const BuyCard: React.FC<ProductProps> = ({
  id,
  imageUrl,
  name,
  rating,
  strains = [],
  price,
  priceUsdt,
  description,
}) => {
  const [qty, setQty] = useState(1);
  // For TON, use .toFixed(3) precision; for other currencies use .toFixed(2)
  const displayPrice = parseFloat((qty * price).toFixed(price >= 1 ? 2 : 3));
  const safeStrains = Array.isArray(strains) ? strains : [];
  const safeDesc = typeof description === 'string' ? (description.split(".")[0] + ".") : "";

  return (
    <Card>
      <ImageContainer>
        <ImageWrapper src={imageUrl || "/assets/photos/burger.png"} />
      </ImageContainer>
      <Body>
        <TopRow>
          <ItemName>{name}</ItemName>
          <Rating>
            <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--text-primary)" }}>{rating || 5}</span>
            <Star icon={faStar} />
          </Rating>
        </TopRow>

        <TagRow>
          {safeStrains.length > 0 ? safeStrains.slice(0, 2).map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          )) : (
            <Tag>Fresh</Tag>
          )}
        </TagRow>

        <Desc>{safeDesc}</Desc>

        <BottomAction>
          <QtyWrapper>
            <QtySelect
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value))}
              aria-label="Quantity"
            >
              {[1, 2, 3, 4, 5, 10].map((n) => (
                <option key={n} value={n}>×{n}</option>
              ))}
            </QtySelect>
          </QtyWrapper>

          <AddToCartButton
            amount={displayPrice}
            item={{ id, name, quantity: qty, priceUsdt: priceUsdt, imageUrl }}
          />
        </BottomAction>
      </Body>
    </Card>
  );
};

export default BuyCard;
