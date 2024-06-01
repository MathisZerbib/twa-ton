// src/components/WelcomeStore.tsx
import React from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const WelcomeText = styled.h1`
  color: white;
  font-size: 48px;
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

const WelcomeStore: React.FC = () => {
  return (
    <Container>
      <WelcomeText>Vite Mon CBD</WelcomeText>
      <br />
      <PaymentOptions>
        Commandez dès maintenant votre CBD sur Montpellier
        <br />
        <br />
        The Open Network (TON)
      </PaymentOptions>
    </Container>
  );
};

export default WelcomeStore;
