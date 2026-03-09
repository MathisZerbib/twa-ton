// src/components/types.ts

export interface ProductProps {
    /** e.g. "burgers" | "pizzas" | "sides" */
    category: string;
    id: string;
    imageUrl: string;
    name: string;
    rating: number;
    /** Generic tag badges (e.g. ["Spicy", "Beef"]) */
    strains: string[];
    /** Price in TON (Legacy/Calculated) */
    price: number;
    /** Base price in USDT */
    priceUsdt: number;
    description: string;
    /** Which restaurant owns this product */
    storeId?: string;
}

export interface Restaurant {
    id: string;
    name: string;
    category: string;
    imageUrl: string; // The logo/square image
    bannerUrl: string; // The wide banner image
    rating: number;
    deliveryTime: string;
    description: string;
    merchantWallet: string;
    color?: string;
}

export interface CartItemProps {
    id: string;
    quantity: number;
    price: number;
}

export interface OrderProps {
    id: string;
    recipient: string;
    price: number;
    status: string;
    dateCreated: string;
}