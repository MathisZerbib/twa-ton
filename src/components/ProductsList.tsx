// src/components/ProductsList.tsx
import React from "react";
import BuyCard from "./BuyCard";
import { ProductProps } from "./types";
import { StyledProductsList } from "./styled/styled";

interface ProductsListProps {
  products: ProductProps[];
}

const ProductsList: React.FC<ProductsListProps> = ({ products }) => {
  return (
    <StyledProductsList>
      {products.map((product) => (
        <BuyCard key={product.id} {...product} />
      ))}
    </StyledProductsList>
  );
};

export default ProductsList;
