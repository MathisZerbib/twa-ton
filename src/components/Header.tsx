import React, { useContext, useState, useRef, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faTimes,
  faStore,
  faMotorcycle,
  faReceipt,
  faClockRotateLeft,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { StoreLogo, FlexBoxRowSpaceBetween } from "../components/styled/styled";
import { TonConnectButton } from "@tonconnect/ui-react";
import { ThemeContext, ThemeProvider } from "../contexts/theme";
import { useNavigate } from "react-router-dom";
import ToggleBtn from "./ToggleBtn/toggleBtn";

interface Props {
  totalPrice?: number;
  selectedCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
  showCheckout?: () => void;
  showHome?: () => void;
  showConnectButton?: boolean;
}

const lightTheme = {
  bgColor: "#ffffff",
  textColor: "#333333",
};

const darkTheme = {
  bgColor: "#2e2e2e",
  textColor: "#ffffff",
};

const HeaderContainer = styled.header<{ themeMode: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background-color: ${(p) =>
    p.themeMode === "dark" ? darkTheme.bgColor : lightTheme.bgColor};
  color: ${(p) =>
    p.themeMode === "dark" ? darkTheme.textColor : lightTheme.textColor};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease, color 0.3s ease;
  position: relative;
  z-index: 100;
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: inherit;
  padding: 6px;
  display: flex;
  align-items: center;
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 200;
`;

const Drawer = styled.nav<{ themeMode: string }>`
  position: fixed;
  top: 0;
  right: 0;
  width: 280px;
  max-width: 85vw;
  height: 100vh;
  background: ${(p) =>
    p.themeMode === "dark" ? "#1e1e2e" : "#ffffff"};
  color: ${(p) =>
    p.themeMode === "dark" ? "#f0f0f0" : "#1a1a1a"};
  z-index: 300;
  padding: 20px 0;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.18);
  animation: ${fadeIn} 0.2s ease;
  display: flex;
  flex-direction: column;
`;

const DrawerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px 16px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.15);
  margin-bottom: 8px;
`;

const DrawerTitle = styled.span`
  font-weight: 800;
  font-size: 1.1rem;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: inherit;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px;
`;

const NavLink = styled.button<{ $accent?: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  background: none;
  border: none;
  color: ${(p) => (p.$accent ? "#FF6B35" : "inherit")};
  font-size: 0.95rem;
  font-weight: 700;
  padding: 14px 24px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;

  &:hover {
    background: rgba(128, 128, 128, 0.08);
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(128, 128, 128, 0.15);
  margin: 8px 0;
`;

const Header: React.FC<Props> = ({
  showHome,
  showConnectButton,
}) => {
  const navigate = useNavigate();
  const themeContext = useContext(ThemeContext);
  const themeName = localStorage.getItem("theme");
  const themeMode = themeName === "dark" ? "dark" : "light";

  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const go = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <ThemeProvider>
      <HeaderContainer themeMode={themeMode}>
        <div onClick={showHome ?? (() => navigate("/"))}>
          <StoreLogo src="/logo.png" alt="Store Logo" />
        </div>
        <FlexBoxRowSpaceBetween>
          {showConnectButton && <TonConnectButton />}
          <ToggleBtn />
          <MenuButton onClick={() => setMenuOpen(true)} aria-label="Menu">
            <FontAwesomeIcon icon={faBars} />
          </MenuButton>
        </FlexBoxRowSpaceBetween>
      </HeaderContainer>

      {/* ── Side Drawer ── */}
      {menuOpen && (
        <>
          <Overlay onClick={() => setMenuOpen(false)} />
          <Drawer themeMode={themeMode} ref={drawerRef}>
            <DrawerHeader>
              <DrawerTitle>Menu</DrawerTitle>
              <CloseBtn onClick={() => setMenuOpen(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </CloseBtn>
            </DrawerHeader>

            <NavLink $accent onClick={() => go("/merchant/onboard")}>
              <FontAwesomeIcon icon={faStore} />
              Join as a Restaurant
            </NavLink>
            <NavLink $accent onClick={() => go("/courier")}>
              <FontAwesomeIcon icon={faMotorcycle} />
              Join as a Courier
            </NavLink>

            <Divider />

            <NavLink onClick={() => go("/my-orders")}>
              <FontAwesomeIcon icon={faReceipt} />
              My Orders
            </NavLink>
            <NavLink onClick={() => go("/order-history")}>
              <FontAwesomeIcon icon={faClockRotateLeft} />
              Order History
            </NavLink>

            <Divider />

            <NavLink $accent onClick={() => go("/admin")}>
              <FontAwesomeIcon icon={faShieldHalved} />
              Super Admin
            </NavLink>
          </Drawer>
        </>
      )}
    </ThemeProvider>
  );
};

export default Header;
