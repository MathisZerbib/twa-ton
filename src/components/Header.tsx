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
  faMoon,
  faSun,
} from "@fortawesome/free-solid-svg-icons";
import { StoreLogo, FlexBoxRowSpaceBetween } from "../components/styled/styled";
import { TonConnectButton } from "@tonconnect/ui-react";
import { ThemeContext } from "../contexts/theme";
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

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
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
  color: var(--text-primary);
  padding: 8px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity var(--transition-fast);
  
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  
  &:active {
    opacity: 0.7;
  }
  
  @media (prefers-reduced-motion: reduce) {
    &:active {
      opacity: 1;
    }
  }
`;

const ThemeButton = styled.button`
  border: 1px solid var(--bg-tertiary);
  background: var(--bg-primary);
  color: var(--text-primary);
  border-radius: 12px;
  min-height: 44px;
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 700;
  transition: all var(--transition-fast);

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &:active {
    transform: scale(0.96);
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 200;
  animation: fadeIn var(--transition-base);
`;

const Drawer = styled.nav`
  position: fixed;
  top: 0;
  right: 0;
  width: 280px;
  max-width: 85vw;
  height: 100vh;
  background: var(--bg-secondary);
  color: var(--text-primary);
  z-index: 300;
  padding: 20px 0;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
`;

const DrawerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px 16px;
  border-bottom: 1px solid var(--bg-tertiary);
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
  padding: 8px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity var(--transition-fast);
  
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  
  &:active {
    opacity: 0.7;
  }
`;

const NavLink = styled.button<{ $accent?: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  background: none;
  border: none;
  color: ${(p) => (p.$accent ? "var(--accent)" : "inherit")};
  font-size: 0.95rem;
  font-weight: 700;
  padding: 16px 24px;
  min-height: 44px;
  cursor: pointer;
  text-align: left;
  transition: background var(--transition-fast);

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  &:hover {
    background: var(--bg-tertiary);
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid var(--bg-tertiary);
  margin: 8px 0;
`;

const Header: React.FC<Props> = ({
  showHome,
  showConnectButton,
}) => {
  const navigate = useNavigate();
  const themeContext = useContext(ThemeContext);
  const themeMode = themeContext?.[0]?.themeName === "dark" ? "dark" : "light";
  const toggleTheme = themeContext?.[0]?.toggleTheme;

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
    <>
      <HeaderContainer>
        <div onClick={showHome ?? (() => navigate("/"))}>
          <StoreLogo src="/logo.png" alt="Store Logo" />
        </div>
        <FlexBoxRowSpaceBetween>
          {showConnectButton && <TonConnectButton />}
          <ToggleBtn />
          <ThemeButton
            onClick={() => toggleTheme?.()}
            aria-label={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <FontAwesomeIcon icon={themeMode === "dark" ? faSun : faMoon} />
            {themeMode === "dark" ? "Light" : "Dark"}
          </ThemeButton>
          <MenuButton onClick={() => setMenuOpen(true)} aria-label="Menu">
            <FontAwesomeIcon icon={faBars} />
          </MenuButton>
        </FlexBoxRowSpaceBetween>
      </HeaderContainer>

      {/* ── Side Drawer ── */}
      {menuOpen && (
        <>
          <Overlay
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            role="presentation"
          />
          <Drawer ref={drawerRef} role="navigation" aria-label="Main navigation">
            <DrawerHeader>
              <DrawerTitle>Menu</DrawerTitle>
              <CloseBtn
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                title="Close menu"
              >
                <FontAwesomeIcon icon={faTimes} />
              </CloseBtn>
            </DrawerHeader>

            <NavLink $accent onClick={() => go("/merchant/onboard")}>
              <FontAwesomeIcon icon={faStore} />
              Open a Restaurant
            </NavLink>
            <NavLink $accent onClick={() => go("/courier")}>
              <FontAwesomeIcon icon={faMotorcycle} />
              Deliver with Us
            </NavLink>

            <Divider />

            <NavLink onClick={() => go("/my-orders")}>
              <FontAwesomeIcon icon={faReceipt} />
              My Orders
            </NavLink>
            <NavLink onClick={() => go("/order-history")}>
              <FontAwesomeIcon icon={faClockRotateLeft} />
              Past Orders
            </NavLink>

            <Divider />

            <NavLink $accent onClick={() => go("/admin")}>
              <FontAwesomeIcon icon={faShieldHalved} />
              Admin Panel
            </NavLink>
          </Drawer>
        </>
      )}
    </>
  );
};

export default Header;
