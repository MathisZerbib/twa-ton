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
import products from "./shop/Products";
// import ChainSelector from "./components/ChainSelector";
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

  return (
    <StyledApp>
      <AppContainer>
        <FlexBoxCol>
          <FlexBoxRow>
            <StoreLogo src="logo.png" alt="Store Logo" />
            <Button>
              {network
                ? network === CHAIN.MAINNET
                  ? "mainnet"
                  : "testnet"
                : "N/A"}
            </Button>
            <TonConnectButton />
            {/* <ChainSelector /> */}
          </FlexBoxRow>
          {/* <Counter />
          <TransferTon />*/}
          {/* <Jetton /> */}
          <WelcomeStore />
          <br />
          <ProductsList products={products} />
        </FlexBoxCol>
      </AppContainer>
    </StyledApp>
  );
}

export default App;
