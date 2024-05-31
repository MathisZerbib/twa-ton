import React, { useState } from "react";
import styled from "styled-components";

// Enhanced styled component for the select button
const SelectChainButton = styled.select`
  -webkit-appearance: none; /* Removes default browser styling */
  appearance: none; /* Ensures cross-browser compatibility */
  background-color: transparent; /* Makes the background transparent */
  border: 2px solid #007bff; /* Adds a border */
  color: white; /* Text color */
  padding: 10px 20px; /* Padding */
  margin: 5px; /* Margin */
  font-size: 16px; /* Font size */
  border-radius: 10px; /* Rounded corners */
  cursor: pointer; /* Cursor style */
  transition: all 0.3s ease; /* Transition effect */
  width: 100px; /* Width */
  box-sizing: border-box; /* Includes padding and border in element's total width and height */

  &:focus {
    outline: none; /* Removes focus outline */
    border-color: #5cabff; /* Changes border color on focus */
  }

  &::placeholder {
    color: #999; /* Placeholder text color */
    opacity: 1; /* Makes placeholder visible */
  }
`;

// Consider using react-select or another library for more advanced styling capabilities

// ChainSelector component
function ChainSelector() {
  const [selectedChain, setSelectedChain] = useState("TON");

  const handleChainChange = (chainName: string) => {
    setSelectedChain(chainName);
  };
  const tonLogoUrl = "ton.svg";

  return (
    <SelectChainButton
      value={selectedChain}
      onChange={(e) => handleChainChange(e.target.value)}
    >
      <option value="TON">TON</option>
      <option value="USDT">USDT</option>
    </SelectChainButton>
  );
}

export default ChainSelector;
