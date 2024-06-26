import React, { useState } from "react";
import styled from "styled-components";
interface CurrencySwitcherProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
}

const CurrencySwitcher: React.FC<CurrencySwitcherProps> = ({
  selectedCurrency,
  onCurrencyChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currencies = [
    { value: "USDT", label: "USDT" },
    { value: "TON", label: "TON" },
  ];

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleCurrencyClick = (currency: string) => {
    onCurrencyChange(currency);
    setIsOpen(false); // Close the dropdown after selection

    window.location.reload(); // Reload the page to reflect the changes
  };

  return (
    <StyledCurrencySwitcher>
      <div onClick={toggleDropdown} className="currency-title">
        <img
          src={`${selectedCurrency.toLowerCase()}.svg`}
          alt={`${selectedCurrency}`}
          style={{
            width: "20px",
            height: "20px",
          }}
        />
      </div>
      {isOpen && (
        <ul className="currency-list">
          {currencies.map((currency) => (
            <li
              key={currency.value}
              onClick={() => handleCurrencyClick(currency.value)}
              className="currency-item"
            >
              <img
                src={`${currency.value.toLowerCase()}.svg`}
                alt={`${currency.value}`}
                style={{
                  width: "20px",
                  height: "20px",
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </StyledCurrencySwitcher>
  );
};

const StyledCurrencySwitcher = styled.div`
  position: relative;
  cursor: pointer;
  color: var(--tg-theme-text-color);

  .currency-title {
    padding: 10px 14px;
    border: 1px solid #ccc;
    border-radius: 5px;
    display: flex;
    align-items: center;
  }

  .currency-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    border: 1px solid #ccc;
    border-top: none;
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
    background-color: var(--tg-theme-text-color);
    z-index: 1;
    list-style-type: none;
    padding: 0;
    margin: 0;
    display: inline-block;

    li {
      padding: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-around; /* Centers the image with the text */
      &:hover {
        background-color: #555; /* Darker shade for hover */
      }
    }
  }
`;

export default CurrencySwitcher;
