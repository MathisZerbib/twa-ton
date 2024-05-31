// src/components/BuyCard.tsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faStarHalfStroke } from "@fortawesome/free-solid-svg-icons";
import "./BuyCard.css";
import styled from "styled-components";
import { BuyWithTon } from "./BuyWithTon";
import axios from "axios";
import EmojiStrains from "./EmojiStrains";

interface ProductProps {
  id: string;
  imageUrl: string;
  name: string;
  rating: number;
  strains: string[];
  price: number;
}

const BuyCard: React.FC<ProductProps> = ({
  id,
  imageUrl,
  name,
  rating,
  strains,
  price,
}) => {
  // Calculate the integer part and the fractional part of the rating
  const intPart = Math.floor(rating);
  const fracPart = rating % 1;
  // styed component for buy-card
  const BuyCardStyled = styled.div`
    background-color: #ffffff;
    border-radius: 10px;
    padding: 20px;
    margin: 10px;
    width: 200px;
    min-height: 300px;
  `;

  // Function to get emoji based on strain
  function getStrainEmoji(strain: string) {
    return strain === "sleepy"
      ? "😴"
      : strain === "happy"
      ? "😀"
      : strain === "hungry"
      ? "🍔"
      : strain === "euphoric"
      ? "😇"
      : strain === "relaxed"
      ? "😌"
      : strain === "uplifted"
      ? "🚀"
      : strain === "creative"
      ? "🎨"
      : strain === "focused"
      ? "🧠"
      : strain === "energetic"
      ? "🔋"
      : strain === "talkative"
      ? "💬"
      : strain === "tingly"
      ? "🌟"
      : strain === "aroused"
      ? "🔞"
      : strain === "giggly"
      ? "😂"
      : "❓"; // Default emoji if no match found
  }

  const ButtonCenterDiv = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const ProductName = styled.h2`
    margin: 0;
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--tg-theme-text-color, #333); /* Fallback to dark gray */
  `;

  return (
    <BuyCardStyled>
      <img src={imageUrl} alt={name} className="product-image" />
      <ProductName>{name}</ProductName>
      <div className="rating">
        {/* the rating should be always counted on 5 scale and must include the partial star */}
        {[...Array(intPart)].map((_, index) => (
          <FontAwesomeIcon icon={faStar} key={index} className="star" />
        ))}

        {fracPart > 0 && (
          <FontAwesomeIcon icon={faStarHalfStroke} className="star" />
        )}

        {[...Array(5 - Math.ceil(rating))].map((_, index) => (
          <FontAwesomeIcon
            icon={faStar}
            style={{
              /// stroke the outline of the star in yellow
              stroke: "#FFD700",
              strokeWidth: "25px",
              color: "transparent",
            }}
            key={index}
          />
        ))}
      </div>
      <br />
      <EmojiStrains strains={strains} />
      <br />
      <br />

      <ButtonCenterDiv>
        <BuyWithTon amount={price} />
      </ButtonCenterDiv>
    </BuyCardStyled>
  );
};

export default BuyCard;
