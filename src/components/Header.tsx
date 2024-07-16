import React, { useContext } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import CurrencySwitcher from "../components/CurrencySwitcher"; // Assuming this component is correctly implemented
import { StoreLogo, FlexBoxRowSpaceBetween } from "../components/styled/styled";
import { TonConnectButton } from "@tonconnect/ui-react";
import { ThemeContext, ThemeProvider } from "../contexts/theme"; // Import ThemeContext
import ToggleBtn from "./ToggleBtn/toggleBtn";
interface Props {
  totalPrice?: number;
  selectedCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
  showCheckout?: () => void;
  showHome?: () => void;
  showConnectButton?: boolean; // Add showConnectButton property
}

// Define theme variables for light and dark modes
interface DefaultTheme {
  bgColor: string;
  textColor: string;
  buttonColor: string;
  buttonText: string;
}

const lightTheme: DefaultTheme = {
  bgColor: "#ffffff",
  textColor: "#333333",
  buttonColor: "#2eaddc",
  buttonText: "#ffffff",
};

const darkTheme: DefaultTheme = {
  bgColor: "#2e2e2e",
  textColor: "#ffffff",
  buttonColor: "#1c8abf",
  buttonText: "#ffffff",
};

const HeaderContainer = styled.header<{ themeMode: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: ${(props) =>
    props.themeMode === "dark" ? darkTheme.bgColor : lightTheme.bgColor};
  color: ${(props) =>
    props.themeMode === "dark" ? darkTheme.textColor : lightTheme.textColor};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease, color 0.3s ease;
`;

const Header: React.FC<Props> = ({
  totalPrice = 0,
  selectedCurrency = "USD",
  onCurrencyChange = () => {}, // Provide a default function
  showCheckout,
  showHome,
  showConnectButton,
}) => {
  const themeContext = useContext(ThemeContext); // Access ThemeContext
  const themeName = localStorage.getItem("theme");
  const themeMode = themeName === "dark" ? "dark" : "light"; // Determine current theme mode

  return (
    <ThemeProvider>
      <HeaderContainer themeMode={themeMode}>
        <div onClick={showHome}>
          <StoreLogo src="logo.png" alt="Store Logo" />
        </div>
        <FlexBoxRowSpaceBetween>
          {/* <CurrencySwitcher
            selectedCurrency={selectedCurrency}
            onCurrencyChange={onCurrencyChange}
          /> */}
          {showConnectButton && <TonConnectButton />}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <ToggleBtn />
          </div>
          <div>
            {/* <Fab
              color="primary"
              aria-label="shopping-cart"
              size="large"
              onClick={showCheckout}
            >
              <FontAwesomeIcon icon={faShoppingCart} />
              <span>
                {totalPrice.toFixed(2)}{" "}
                <img
                  src={selectedCurrency.toLowerCase() + ".svg"}
                  alt={selectedCurrency + " icon"}
                  style={{
                    width: 20,
                    height: 20,
                  }}
                />
              </span>
            </Fab> */}
          </div>
        </FlexBoxRowSpaceBetween>
      </HeaderContainer>
    </ThemeProvider>
  );
};

export default Header;
