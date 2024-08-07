import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled from "styled-components";

export const Card = styled.div`
  padding: 10px 20px;
  border-radius: 8px;
  background-color: var(--tg-theme-text-color);

  @media (prefers-color-scheme: dark) {
    background-color: #111;
  }
`;

export const FlexBoxRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
`;

export const FlexBoxRowSpaceBetween = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
`;

export const FlexBoxCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const Button = styled.button`
  background-color: ${(props) =>
    props.disabled ? "#6e6e6e" : "var(--tg-theme-button-color)"};
  border: 0;
  border-radius: 8px;
  padding: 10px 20px;
  color: var(--tg-theme-button-text-color);
  font-weight: 700;
  cursor: pointer;
  pointer-events: ${(props) => (props.disabled ? "none" : "inherit")};
`;

export const Ellipsis = styled.div`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

export const Input = styled("input")`
  padding: 10px 20px;
  border-radius: 10px;
  width: 100%;
  border: 1px solid #c2c2c2;

  @media (prefers-color-scheme: dark) {
    border: 1px solid #fefefe;
  }
`;

export const AddToCartButtonCard = styled(Button)`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 20px;
  background-color: #000;
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
  &:hover {
    background-color: #333;
    &::after {
      content: "Add to Cart";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.9);
      color: #000;
      font-size: 14px;
    }
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  animation: fadeIn 0.5s;
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
  padding: 10px 20px;
  background-color: #000;
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  animation: fadeIn 0.5s;
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
  padding: 10px 20px;
  margin-top: 20px;
  background-color: var(--tg-theme-button-color);
  color: var(--tg-theme-button-text-color);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;
