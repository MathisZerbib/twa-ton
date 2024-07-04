import React, { useState, useEffect } from "react";
import { faStar, faStarHalfStroke } from "@fortawesome/free-solid-svg-icons";
import "./BuyCard.css";
import EmojiStrains from "./EmojiStrains";
import { AddToCartButton } from "./AddToCartButton";
import {
  ButtonSpaceBetweenContainer,
  HeaderWrapper,
  Rating,
  Star,
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
  description: string;
}

const BuyCard: React.FC<ProductProps> = ({
  id,
  imageUrl,
  name,
  rating,
  strains,
  price,
  description,
}) => {
  const [selectedQuantity, setSelectedQuantity] = useState<number>(5);
  const { selectedCurrency, updateSelectedCurrency } = useCurrency();
  const [totalPrice, setTotalPrice] = useState<number>(5 * price);
  const descriptionFirstSentence = description.split(".")[0] + ".";
  const handleQuantityChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const quantity = parseInt(event.target.value);
    if (!isNaN(quantity) && quantity > 0) {
      setSelectedQuantity(quantity);
    }
  };

  useEffect(() => {
    const currency = localStorage.getItem("selectedCurrency");
    if (currency) {
      updateSelectedCurrency(currency);
    }
  }, []);

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
    <div
      style={{
        background: "white",
        borderRadius: "10px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        padding: "10px",
        margin: "10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        // width: "300px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            width: "200px",
            objectFit: "contain",
            borderRadius: "10px",
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            height: "200px",
          }}
        ></div>
      </div>
      <div
        style={{
          padding: "5px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          justifyContent: "space-between",
          height: "200px",
        }}
      >
        <HeaderWrapper>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Typography variant="h6">{name}</Typography>
            <Rating>
              <Typography>{rating.toString()}</Typography>
              <Star icon={faStar} />
            </Rating>
          </div>
        </HeaderWrapper>

        <EmojiStrains strains={strains} />
        <div style={{ height: "100px", overflow: "hidden" }}>
          {/* Description with a link */}
          <Typography variant="body2">{descriptionFirstSentence}</Typography>
        </div>

        <ButtonSpaceBetweenContainer>
          <select
            value={selectedQuantity}
            onChange={handleQuantityChange}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "1px solid #c2c2c2",
              backgroundColor: "white",
              color: "black",
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
        </ButtonSpaceBetweenContainer>
      </div>
    </div>
  );
};

export default BuyCard;
