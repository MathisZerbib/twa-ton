import { useCurrency } from "../../providers/useCurrency";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate } from "@fortawesome/free-solid-svg-icons";

const SwitcherButton = styled.button`
  background: #f5f5f5;
  border: 1.5px solid #eee;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 800;
  font-size: 0.85rem;
  outline: none;

  &:hover {
    background: #fff;
    border-color: #FF6B35;
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.15);
  }

  &:active {
    transform: scale(0.95);
  }

  .icon-rotation {
    color: #FF6B35;
    transition: transform 0.3s;
  }

  &:hover .icon-rotation {
    transform: rotate(180deg);
  }
`;

const CurrencyBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ToggleBtn = () => {
  const { selectedCurrency, updateSelectedCurrency } = useCurrency();

  const handleToggle = () => {
    const next = selectedCurrency === "TON" ? "USDT" : "TON";
    updateSelectedCurrency(next);
  };

  return (
    <SwitcherButton
      type="button"
      onClick={handleToggle}
      aria-label={`Switch to ${selectedCurrency === "TON" ? "USDT" : "TON"}`}
    >
      <CurrencyBadge>
        <img
          src={selectedCurrency.toLowerCase() + ".svg"}
          alt={selectedCurrency}
          style={{ width: 18, height: 18 }}
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
        <span>{selectedCurrency}</span>
      </CurrencyBadge>

      <FontAwesomeIcon icon={faRotate} className="icon-rotation" />
    </SwitcherButton>
  );
};

export default ToggleBtn;
