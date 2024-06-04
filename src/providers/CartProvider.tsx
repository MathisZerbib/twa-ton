import React, { useState, createContext, useContext } from "react";

// Define the shape of the items in the cart
interface CartItem {
  id: string;
  quantity?: number;
  price: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeItem: (item: CartItem) => void;
  totalPrice: number;
}

// Create the context with a default value
const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // Update the addToCart function to add items to the cart array
  const addToCart = (item: CartItem) => {
    setCartItems((prevItems) => [...prevItems, item]);
    setTotalPrice((prevPrice) => prevPrice + item.price);
  };

  const removeItem = (item: CartItem) => {
    setCartItems(
      (prevItems) => prevItems && prevItems.filter((i) => i !== item)
    );
    setTotalPrice((prevPrice) => prevPrice - item.price);
  };

  // const totalGrams = cartItems.reduce((acc, item) => {
  //   return acc + (item.quantity ?? 0);
  // }, 0);

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
  //console log the total amount of items in the cart
  // console.log(context?.cartItems.length);
  // console.log(context?.totalPrice + " TON");
  /// total amount of grams in the cart (every item has a grams property represented by quantity)
  if (context && context?.totalPrice < 0.0000000001) {
    context.totalPrice = 0;
  }
  console.log();
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
