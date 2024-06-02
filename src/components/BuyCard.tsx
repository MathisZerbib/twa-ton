import React, { useState, useEffect } from "react";
import { faStar, faStarHalfStroke } from "@fortawesome/free-solid-svg-icons";
import "./BuyCard.css";
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
import performCurrencyConversion from "../services/exchangeRateService";

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
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    localStorage.getItem("selectedCurrency") || "USDT"
  );
  const [totalPrice, setTotalPrice] = useState<number>(5 * price); // State to hold the total price

  // Function to handle quantity change
  const handleQuantityChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const quantity = parseInt(event.target.value);
    if (!isNaN(quantity) && quantity > 0) {
      setSelectedQuantity(quantity);
    }
  };

  // Function to retrieve selected currency from localStorage
  useEffect(() => {
    const currency = localStorage.getItem("selectedCurrency");
    if (currency) {
      setSelectedCurrency(currency);
    }
  }, []);

  // Function to update the total price based on the selected currency
  useEffect(() => {
    const convertPrice = async () => {
      try {
        const convertedPrice = await performCurrencyConversion(
          price,
          selectedCurrency
        );
        setTotalPrice(selectedQuantity * convertedPrice);
      } catch (error) {
        console.error("Failed to convert price:", error);
      }
    };

    convertPrice();
  }, [selectedCurrency, selectedQuantity, price]);

  const intPart = Math.floor(rating);
  const fracPart = rating % 1;

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
