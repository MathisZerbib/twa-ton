// src/components/types.ts
export interface ProductProps {
    id: string;
    imageUrl: string;
    name: string;
    grams: number;
    rating: number;
    strains: string[];
    price: number;
    description: string;
}


export interface CartItemProps {
    id: string;
    quantity: number;
    price: number;
}