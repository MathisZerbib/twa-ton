import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled from "styled-components";

// styled-components v6 requires explicit DefaultTheme augmentation
declare module "styled-components" {
  export interface DefaultTheme {
    bgColor: string;
    textColor: string;
    buttonColor: string;
    buttonText: string;
    darkBgColor?: string;
    darkTextColor?: string;
  }
}

export const Card = styled.div`
  padding: 16px 24px;
  border-radius: var(--card-radius);
  background: var(--bg-secondary);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
`;

export const FlexBoxRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
`;

export const FlexBoxRowSpaceBetween = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
`;

export const FlexBoxCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const Button = styled.button`
  background: ${(props) =>
    props.disabled ? "var(--text-hint)" : "var(--accent)"};
  border: 0;
  border-radius: var(--btn-radius);
  padding: 12px 24px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
  pointer-events: ${(props) => (props.disabled ? "none" : "inherit")};
  
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  
  &:active:not(:disabled) {
    transform: scale(0.96);
  }
  
  @media (prefers-reduced-motion: reduce) {
    &:active:not(:disabled) {
      transform: none;
    }
  }
`;

export const Ellipsis = styled.div`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

export const Input = styled("input")`
  padding: 12px 20px;
  border-radius: 12px;
  width: 100%;
  border: 1.5px solid var(--bg-tertiary);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color var(--transition-fast);
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: var(--accent);
  }
  
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-color: var(--accent);
  }
  
  &:invalid {
    border-color: var(--error);
  }
  
  &[aria-invalid="true"] {
    border-color: var(--error);
  }
`;

export const AddToCartButtonCard = styled(Button)`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 20px;
  min-height: 44px;
  background-color: var(--accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  transition: all 0.3s;
  
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  
  &:hover:not(:disabled) {
    background-color: var(--accent-dark);
  }

  &:disabled {
    background-color: var(--bg-tertiary);
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const HeaderWrapper = styled.div`
  display: flex;
  flex-direction: row;
`;

export const ButtonSpaceBetweenContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const ProductName = styled.h2`
  margin: 0;
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--tg-theme-text-color);
`;

export const Quantity = styled.p`
  margin: 0;
  font-size: 1rem;
  font-style: italic;
  color: var(--tg-theme-text-color);
`;

export const Rating = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
`;

export const Star = styled(FontAwesomeIcon)`
  color: #f8d64e;
  height: 1rem;
  width: 1rem;
`;

export const HalfStar = styled(FontAwesomeIcon)`
  color: transparent;
  stroke: #f8d64e;
  stroke-width: 50px;
  height: 0.85rem;
  width: 0.85rem;
`;

export const CenterDiv = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
`;

export const ButtonBuyTonStyled = styled(Button)`
  position: relative;
  display: flex;
  min-width: 250px;
  min-height: 50px;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 20px;
  background-color: var(--accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  transition: all 0.3s;
  
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &:disabled {
    background-color: var(--bg-tertiary);
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Chip = styled.span`
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(0, 0, 0, 0.48);
  border-style: solid;
  border-width: 1px;
  color: var(--tg-theme-text-color);
  border-radius: 15px;
  padding: 5px 10px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

export const StrainText = styled.p`
  margin: 0;
  font-size: 12px;
  color: inherit;
`;

export const ProductsListContainer = styled.div`
  background-color: var(--tg-theme-bg-color);
`;

export const StyledProductContainer = styled.div`
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

export const NetworkBadge = styled.span<{ network: string }>`
  display: inline-block;
  padding: 5px;
  height: 1px;
  width: 1px;
  background-color: ${(props) => {
    switch (props.network) {
      case "mainnet":
        return "#007bff"; // Example color for Mainnet
      case "testnet":
        return "#ffc107"; // Example color for Testnet
      default:
        return "#6c757d"; // Default color for other cases
    }
  }};
  border-radius: 30px;
`;

export const StyledApp = styled.div`
  background-color: ${({ theme }) => theme.bgColor};
  color: ${({ theme }) => theme.textColor};

  @media (prefers-color-scheme: dark) {
    background-color: ${({ theme }) => theme.darkBgColor};
    color: ${({ theme }) => theme.darkTextColor};
  }

  padding: 40px 20px;

  /* Additional responsive styles can be added here */
`;

export const AppContainer = styled.div`
  margin: 0 auto;
  margin-bottom: 100px;
`;

export const StoreLogo = styled.img`
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 50%;
`;

export const CheckoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f5f5f5;
`;

export const CartItemStyled = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  background-color: #fff;
  border-radius: 5px;
`;

export const CheckoutButton = styled.button`
  padding: 12px 20px;
  min-height: 44px;
  margin-top: 20px;
  background-color: var(--tg-theme-button-color);
  color: var(--tg-theme-button-text-color);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 700;
  transition: all var(--transition-fast);
  
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  
  &:hover:not(:disabled) {
    background-color: #0056b3;
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (prefers-reduced-motion: reduce) {
    &:hover:not(:disabled) {
      transform: none;
    }
  }
`;
