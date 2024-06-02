// src/components/types.ts
export interface ProductProps {
    id: string;
    imageUrl: string;
    name: string;
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

export interface OrderProps {
    id: string;
    recipient: string;
    price: number;
    status: string;
    dateCreated: string;
}