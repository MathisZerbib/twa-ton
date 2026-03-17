import React, { useState, useEffect } from "react";
import { Button } from "@mui/material";
import { CartItemStyled } from "../components/styled/styled";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { useCurrency } from "../providers/useCurrency";
import { api } from "../services/api";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  priceUsdt: number;
  imageUrl?: string;
}

interface CartItemProps {
  item: CartItem;
  onRemoveItem: (id: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onRemoveItem }) => {
  const { selectedCurrency } = useCurrency();
  const [rate, setRate] = useState(6.0);

  useEffect(() => {
    api.getTonUsdRate().then((data: any) => {
      if (data.priceUsd) setRate(data.priceUsd);
    }).catch(console.error);
  }, []);

  const displayPrice = selectedCurrency === "TON"
    ? (item.priceUsdt * item.quantity / rate)
    : (item.priceUsdt * item.quantity);

  return (
    <CartItemStyled
      key={item.id}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: "1px solid rgba(0,0,0,0.05)"
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.name}
            style={{
              width: "50px",
              height: "50px",
              borderRadius: '8px',
              objectFit: 'cover',
              flexShrink: 0
            }}
          />
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#999' }}>Qty: {item.quantity}</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', minWidth: '80px', textAlign: 'right' }}>
          {displayPrice.toFixed(selectedCurrency === "TON" ? 3 : 2)} {selectedCurrency}
        </p>
        <Button
          onClick={() => onRemoveItem(item.id)}
          style={{ minWidth: 'auto', padding: '8px', minHeight: '44px' }}
          aria-label={`Remove ${item.name} from cart`}
        >
          <FontAwesomeIcon
            icon={faCircleXmark}
            style={{
              color: "#ccc",
              fontSize: "1.2rem",
            }}
          />
        </Button>
      </div>
    </CartItemStyled>
  );
};

export default CartItem;
