// src/components/ProductsList.tsx
import React from "react";
import BuyCard from "./BuyCard";
import { ProductProps } from "./types";
import styled from "styled-components";

interface ProductsListProps {
  products: ProductProps[]; // Array of ProductProps objects
}

// cstyled component
const StyledProductsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
`;

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
