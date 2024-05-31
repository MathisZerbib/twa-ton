// src/components/BuyCard.tsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faStarHalfStroke } from "@fortawesome/free-solid-svg-icons";
import "./BuyCard.css";
import styled from "styled-components";

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

  return (
    <BuyCardStyled>
      <img src={imageUrl} alt={name} className="product-image" />
      <h2 className="product-name">{name}</h2>
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
      <ul>
        {strains.map((strain, index) => (
          /// make a UI representation of the strains percentage
          <li key={index} className="strain">
            {strain}
          </li>
        ))}
      </ul>
      <p className="price">{price.toFixed(2)} €</p>
      <button className="buy-button">Buy Now</button>
    </BuyCardStyled>
  );
};

export default BuyCard;
