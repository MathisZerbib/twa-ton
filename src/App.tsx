import "./App.css";
import { TonConnectButton } from "@tonconnect/ui-react";
import { Counter } from "./components/Counter";
import { Jetton } from "./components/Jetton";
import { TransferTon } from "./components/TransferTon";
import styled from "styled-components";
import { Button, FlexBoxCol, FlexBoxRow } from "./components/styled/styled";
import { useTonConnect } from "./hooks/useTonConnect";
import { CHAIN } from "@tonconnect/protocol";
import "@twa-dev/sdk";
import { ProductProps } from "./components/types";
import ProductsList from "./components/ProductsList";
import WelcomeStore from "./components/WelcomeStore";

const StyledApp = styled.div`
  background-color: #e8e8e8;
  color: black;

  @media (prefers-color-scheme: dark) {
    background-color: #222;
    color: white;
  }
  min-height: 100vh;
  padding: 20px 20px;
`;

const AppContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const StoreLogo = styled.img`
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 50%;
`;

function App() {
  const { network } = useTonConnect();
  const products: ProductProps[] = [
    {
      id: "1",
      imageUrl: "public/product_1.png",
      name: "Blue Dream",
      rating: 4.5,
      strains: ["Sativa 60%", "Indica 40%"],
      price: 29.99,
    },
    {
      id: "2",
      imageUrl: "public/product_2.png",
      name: "Girl Scout Cookies",
      rating: 4.0,
      strains: ["Indica 60%", "Sativa 40%"],
      price: 60.0,
    },
    {
      id: "3",
      imageUrl: "public/product_3.png",
      name: "OG Kush",
      rating: 5.0,
      strains: ["Indica 75%", "Sativa 25%"],
      price: 70.0,
    },
    {
      id: "4",
      imageUrl: "public/product_4.png",
      name: "Sour Diesel",
      rating: 3,
      strains: ["Sativa 90%", "Indica 10%"],
      price: 39.99,
    },
    {
      id: "5",
      imageUrl: "public/product_5.png",
      name: "Granddaddy Purple",
      rating: 5,
      strains: ["Indica 80%", "Sativa 20%"],
      price: 80.0,
    },
    {
      id: "6",
      imageUrl: "public/product_6.png",
      name: "Pineapple Express",
      rating: 3.5,
      strains: ["Sativa 60%", "Indica 40%"],
      price: 20.0,
    },
    // Add more products as needed
  ];

  return (
    <StyledApp>
      <AppContainer>
        <FlexBoxCol>
          <FlexBoxRow>
            <StoreLogo src="public/logo.png" alt="Store Logo" />{" "}
            <TonConnectButton />
            <Button>
              {network
                ? network === CHAIN.MAINNET
                  ? "mainnet"
                  : "testnet"
                : "N/A"}
            </Button>
          </FlexBoxRow>
          {/* <Counter />
          <TransferTon />
          <Jetton /> */}
          <WelcomeStore />
          <br />
          <ProductsList products={products} />
        </FlexBoxCol>
      </AppContainer>
    </StyledApp>
  );
}

export default App;
