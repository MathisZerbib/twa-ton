import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { fetchInitialExchangeRate } from "../services/exchangeRateService";
import { SwipeableDrawer } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalculator } from "@fortawesome/free-solid-svg-icons";

const ConverterContainer = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: #f9f9f9;
  text-align: center;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  font-size: 1.5em;
  color: #333;
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0;
`;

const Input = styled.input`
  width: 70%;
  padding: 10px;
  margin-right: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1em;
`;

const Icon = styled.img`
  width: 30px;
  height: 30px;
`;

const Result = styled.p`
  margin-top: 10px;
  font-size: 1.2em;
  color: #555;
`;
const Button = styled.button`
  position: fixed;
  bottom: 120px;
  right: 20px;

  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  background-color: #333;
  color: #fff;
  font-size: 1em;
  cursor: pointer;
  &:hover {
    background-color: #555;
    right: 20px;
    content: "Price Converter";
  }
`;

const PriceConverter: React.FC = () => {
  const [tonUsdtRate, setTonUsdtRate] = useState<number>(0);
  const [usdAmount, setUsdAmount] = useState<string>("");
  const [tonAmount, setTonAmount] = useState<string>("");
  const [openDrawer, setOpenDrawer] = useState(false);

  useEffect(() => {
    const getInitialRate = async () => {
      try {
        const rate = await fetchInitialExchangeRate("TON", "USDT");
        setTonUsdtRate(rate);
      } catch (error) {
        console.error("Failed to fetch initial exchange rate:", error);
      }
    };

    getInitialRate();
  }, []);

  const convertUsdToTon = (amount: string): number => {
    if (!tonUsdtRate || !amount) return 0;
    return parseFloat(amount) / tonUsdtRate;
  };

  const convertTonToUsd = (amount: string): number => {
    if (!tonUsdtRate || !amount) return 0;
    return parseFloat(amount) * tonUsdtRate;
  };

  const handleUsdAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let usd = e.target.value;
    if (parseFloat(usd) < 0) {
      usd = "0";
    }
    setUsdAmount(usd);
    if (usd) {
      setTonAmount(convertUsdToTon(usd).toFixed(6)); // Update TON amount
    } else {
      setTonAmount("");
    }
  };

  const handleTonAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let ton = e.target.value;
    if (parseFloat(ton) < 0) {
      ton = "0";
    }
    setTonAmount(ton);
    if (ton) {
      setUsdAmount(convertTonToUsd(ton).toFixed(2)); // Update USD amount
    } else {
      setUsdAmount("");
    }
  };

  const toggleDrawer = (open: boolean) => {
    setOpenDrawer(open);
  };

  return (
    <>
      <Button onClick={() => toggleDrawer(true)}>
        <FontAwesomeIcon icon={faCalculator} />
      </Button>
      <SwipeableDrawer
        anchor="bottom"
        open={openDrawer}
        onClose={() => toggleDrawer(false)}
        onOpen={() => toggleDrawer(true)}
      >
        <ConverterContainer>
          <Title>TON to USDT Converter</Title>
          <InputContainer>
            <Input
              type="number"
              value={usdAmount}
              onChange={handleUsdAmountChange}
              placeholder="Enter USD amount"
            />
            <Icon src="usdt.svg" alt="USDT" />
          </InputContainer>
          <InputContainer>
            <Input
              type="number"
              value={tonAmount}
              onChange={handleTonAmountChange}
              placeholder="Enter TON amount"
            />
            <Icon src="ton.svg" alt="TON" />
          </InputContainer>
        </ConverterContainer>
      </SwipeableDrawer>
    </>
  );
};

export default PriceConverter;
