import React, { useContext, useState } from "react";
import styled, {
  ThemeProvider as StyledThemeProvider,
} from "styled-components";
import Header from "./components/Header";
import Shop from "./pages/Shop";
import { ThemeContext, ThemeProvider } from "./contexts/theme";

const HeroSection = styled.header`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 80vh;
  background-color: ${(props) => props.theme["--tg-theme-bg-color"]};
  color: ${(props) => props.theme["--tg-theme-text-color"]};

  @media (min-width: 768px) {
    /* Tablet and larger */
    flex-direction: row;
    padding: 0 50px;
  }

  @media (min-width: 1024px) {
    /* Desktop and larger */
    padding: 0 100px;
  }
`;

const HeroContent = styled.div`
  max-width: 600px;
  text-align: center;

  @media (min-width: 768px) {
    /* Tablet and larger */
    text-align: left;
    margin-right: 50px;
  }

  @media (min-width: 1024px) {
    /* Desktop and larger */
    max-width: 800px;
  }
`;

const HeroImage = styled.div`
  display: none; /* Hide image by default */

  @media (min-width: 768px) {
    /* Tablet and larger */
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50%; /* Take 50% width on tablets */
    height: 100%;
  }

  @media (min-width: 1024px) {
    /* Desktop and larger */
    width: 40%; /* Reduce width on desktop */
  }

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
    border-radius: 10px;
  }
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 20px;
`;

const HeroDescription = styled.p`
  font-size: 1.2rem;
  margin-bottom: 20px;
`;

const CtaButton = styled.button`
  padding: 10px 20px;
  font-size: 1.2rem;
  background-color: ${(props) => props.theme["--tg-theme-button-color"]};
  color: ${(props) => props.theme["--tg-theme-button-text-color"]};
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${(props) =>
      props.theme.themeMode === "dark" ? "#1c8abf" : "#1c8abf"};
  }
`;

const AppContainer = styled.div`
  background-color: var(--tg-theme-bg-color);
  color: var(--tg-theme-text-color);
`;

function App() {
  const themeContext = useContext(ThemeContext);
  const themeMode = themeContext ? themeContext[0].themeName! : "light";

  const [showShop, setShowShop] = useState(false);
  const [showHome, setShowHome] = useState(false);
  const handleShopClick = () => {
    setShowShop(true);
  };

  return (
    <ThemeProvider>
      <StyledThemeProvider
        theme={{
          "--tg-theme-bg-color": themeMode === "light" ? "#ffffff" : "#2e2e2e",
          "--tg-theme-text-color":
            themeMode === "light" ? "#333333" : "#ffffff",
          "--tg-theme-button-color":
            themeMode === "light" ? "#2eaddc" : "#1c8abf",
          "--tg-theme-button-text-color": "#ffffff",
        }}
      >
        <AppContainer className={`app ${themeMode}`}>
          {!showShop && (
            <>
              <Header showConnectButton={showShop} />
              <HeroSection>
                <HeroContent>
                  <HeroTitle>Welcome to the TON Shop!</HeroTitle>
                  <HeroDescription>
                    Discover the finest CBD products,
                    <br />
                    with seamless delivery and crypto payments.
                  </HeroDescription>
                  <CtaButton
                    onClick={() => {
                      handleShopClick();
                    }}
                  >
                    Shop Now
                  </CtaButton>
                </HeroContent>
                <HeroImage>
                  <img
                    src="home.jpg"
                    alt="CBD products"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "500px",
                      objectFit: "cover",
                      borderRadius: "10px",
                    }}
                  />
                </HeroImage>
              </HeroSection>
            </>
          )}
          {showShop && <Shop />}
        </AppContainer>
      </StyledThemeProvider>
    </ThemeProvider>
  );
}

export default App;
