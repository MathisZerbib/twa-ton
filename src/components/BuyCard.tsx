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
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  height: 100%;
  border: 1px solid rgba(0,0,0,0.03);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.12);
  }
`;

const ImageWrapper = styled.div<{ src: string }>`
  width: 100%;
  height: 140px;
  background-image: url(${(p) => p.src});
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 40%);
  }
`;

const Body = styled.div`
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`;

const ItemName = styled.h3`
  font-size: 0.95rem;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.3;
  flex: 1;
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
`;

const Tag = styled.span`
  font-size: 0.7rem;
  font-weight: 800;
  color: #FF6B35;
  background: rgba(255,107,53,0.08);
  border-radius: 8px;
  padding: 3px 8px;
`;

const Desc = styled.p`
  font-size: 0.8rem;
  color: #666;
  line-height: 1.5;
  margin: 4px 0 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 2.4rem;
`;

const BottomAction = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
`;

const QtyWrapper = styled.div`
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 4px 8px;
  border: 1px solid #eee;
`;

const QtySelect = styled.select`
  border: none;
  background: transparent;
  color: #1a1a1a;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  padding-right: 2px;
`;

// ─── Component ────────────────────────────────────────────────────────────────

interface ProductProps {
  id: string;
  imageUrl: string;
  name: string;
  rating: number;
  strains?: string[];  // optional tags
  price: number;       // in TON
  description: string;
}

const BuyCard: React.FC<ProductProps> = ({
  id,
  imageUrl,
  name,
  rating,
  strains = [],
  price,
  description,
}) => {
  const [qty, setQty] = useState(1);
  const totalPrice = parseFloat((qty * price).toFixed(4));
  const safeStrains = Array.isArray(strains) ? strains : [];
  const safeDesc = typeof description === 'string' ? (description.split(".")[0] + ".") : "";

  return (
    <Card>
      <ImageWrapper src={imageUrl || "/assets/photos/burger.png"} />
      <Body>
        <TopRow>
          <ItemName>{name}</ItemName>
          <Rating>
            <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#1a1a1a" }}>{rating || 5}</span>
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
            amount={totalPrice}
            item={{ id, quantity: qty, price: totalPrice }}
          />
        </BottomAction>
      </Body>
    </Card>
  );
};

export default BuyCard;
