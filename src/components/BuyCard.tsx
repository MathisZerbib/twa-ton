import React, { useState, useEffect } from "react";
import { faStar, faStarHalfStroke } from "@fortawesome/free-solid-svg-icons";
import "./BuyCard.css";
import EmojiStrains from "./EmojiStrains";
import { AddToCartButton } from "./AddToCartButton";
import {
  ButtonCenterDiv,
  HeaderWrapper,
  Rating,
  Star,
  BuyCardStyled,
} from "./styled/styled";
import { convertToTon } from "../services/exchangeRateService";
import { useCurrency } from "../providers/useCurrency";
import { Typography } from "@mui/material";

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
  const { selectedCurrency, updateSelectedCurrency } = useCurrency();
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
      updateSelectedCurrency(currency);
    }
  }, []);

  // Function to update the total price based on the selected currency
  useEffect(() => {
    const convertPrice = async () => {
      try {
        const convertedPrice = await convertToTon(price, selectedCurrency);
        setTotalPrice(selectedQuantity * convertedPrice);
      } catch (error) {
        console.error("Failed to convert price:", error);
      }
    };

    convertPrice();
  }, [selectedCurrency, selectedQuantity, price]);

  return (
    <BuyCardStyled>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <img
          src={imageUrl}
          alt={name}
          style={{
            width: "100%",
            height: "150px",
            objectFit: "cover",
            borderRadius: "10px",
          }}
        />
      </div>
      <div style={{ padding: "5px" }}>
        <HeaderWrapper>
          <Typography>{name}</Typography>
          <Rating>
            <Typography>{rating.toString()}</Typography>
            <Star icon={faStar} />
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
        </ButtonCenterDiv>
      </div>
    </BuyCardStyled>
  );
};

export default BuyCard;
