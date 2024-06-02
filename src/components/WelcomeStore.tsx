// src/components/WelcomeStore.tsx
import React from "react";
import styled from "styled-components";
import { useCurrency } from "../providers/useCurrency";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const WelcomeText = styled.h1`
  color: white;
  font-size: 46px;
  text-align: center;
  margin-bottom: 20px;
`;

const PaymentOptions = styled.p`
  color: white;
  font-size: 24px;
  text-align: center;
  max-width: 800px;
  margin: auto;
`;
const tonLogo = "ton.svg";
const usdtLogo = "usdt.svg";

const WelcomeStore: React.FC = () => {
  return (
    <Container>
      <WelcomeText>
        Vite {useCurrency().selectedCurrency === "TON" ? "TON" : "USDT"} CBD
        <img
          src={useCurrency().selectedCurrency === "TON" ? tonLogo : usdtLogo}
          alt="TON logo"
          style={{ width: 24, height: 24, marginLeft: 10, marginBottom: 25 }}
        />{" "}
      </WelcomeText>
      <br />
      <PaymentOptions>
        Commandez dès maintenant votre CBD sur Montpellier
        <br />
        <br />
        {useCurrency().selectedCurrency === "TON" ? (
          <>
            Payez en TON
            <br />
          </>
        ) : (
          <>
            Payez en USDT
            <br />
          </>
        )}
      </PaymentOptions>
    </Container>
  );
};

export default WelcomeStore;
