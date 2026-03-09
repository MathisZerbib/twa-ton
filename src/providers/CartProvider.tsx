import React, { useState, createContext, useContext, useMemo, useEffect } from "react";
import { useCurrency } from "./useCurrency";
import { api } from "../services/api";

// Define the shape of the items in the cart
interface CartItem {
  id: string;
  name: string;
  quantity: number;
  priceUsdt: number;
  imageUrl?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeItem: (id: string) => void;
  totalPrice: number;
}

// Create the context with a default value
const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { selectedCurrency } = useCurrency();
  const [rate, setRate] = useState(6.0); // Fallback rate

  useEffect(() => {
    api.getTonUsdRate().then((data) => {
      if (data.priceUsd) setRate(data.priceUsd);
    }).catch(console.error);
  }, []);

  const addToCart = (item: CartItem) => {
    setCartItems((prev) => {
      // Check if item already exists
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, item];
    });
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const totalPrice = useMemo(() => {
    const totalUsdt = cartItems.reduce((acc, item) => acc + (item.priceUsdt * item.quantity), 0);
    if (selectedCurrency === "TON") {
      return parseFloat((totalUsdt / rate).toFixed(4));
    }
    return parseFloat(totalUsdt.toFixed(2));
  }, [cartItems, selectedCurrency, rate]);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeItem, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the CartContext
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
