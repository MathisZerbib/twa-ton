// src/components/BuyCard.tsx
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faStarHalfStroke } from "@fortawesome/free-solid-svg-icons";
import "./BuyCard.css";
import styled from "styled-components";
import { BuyWithTon } from "./BuyWithTon";
import EmojiStrains from "./EmojiStrains";
import { AddToCartButton } from "./AddToCartButton";
import {
  ButtonCenterDiv,
  HeaderWrapper,
  ProductName,
  Rating,
  Star,
  HalfStar,
  BuyCardStyled,
} from "./styled/styled";

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
  const [selectedQuantity, setSelectedQuantity] = useState<number>(5);

  const intPart = Math.floor(rating);
  const fracPart = rating % 1;

  const handleQuantityChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const quantity = parseInt(event.target.value);
    if (!isNaN(quantity) && quantity > 0) {
      setSelectedQuantity(quantity);
    }
  };

  const totalPrice = selectedQuantity * price;

  return (
    <BuyCardStyled>
      <img src={imageUrl} alt={name} className="product-image" />
      <HeaderWrapper>
        <ProductName>{name}</ProductName>
        <Rating>
          {[...Array(intPart)].map((_, index) => (
            <Star icon={faStar} key={index} />
          ))}
          {fracPart > 0 && <Star icon={faStarHalfStroke} />}
          {[...Array(5 - Math.ceil(rating))].map((_, index) => (
            <HalfStar icon={faStar} key={index} />
          ))}
        </Rating>
      </HeaderWrapper>

      <EmojiStrains strains={strains} />
      <br />
      <ButtonCenterDiv>
        <select
          value={selectedQuantity}
          onChange={handleQuantityChange}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "1px solid #c2c2c2",
          }}
        >
          {[5, 10, 20, 50, 100].map((option) => (
            <option key={option} value={option}>
              {option}g
            </option>
          ))}
        </select>
        <AddToCartButton
          amount={totalPrice}
          item={{ id: id, quantity: selectedQuantity, price: totalPrice }}
        />
        <br />
      </ButtonCenterDiv>
    </BuyCardStyled>
  );
};

export default BuyCard;
