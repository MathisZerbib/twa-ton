// src/components/ProductsList.tsx
import React, { useMemo } from "react";
import styled, { keyframes } from "styled-components";
import BuyCard from "./BuyCard";
import { ProductProps } from "./types";

interface ProductsListProps {
  products: ProductProps[];
}

const fadeIn = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--tg-theme-text-color, #1a1a1a);
  margin: 20px 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HorizontalScroll = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding: 8px 16px 20px;
  margin: 0 -16px; /* Offset parent padding for full-bleed feel */

  &::-webkit-scrollbar { display: none; }
  scrollbar-width: none;

  &::after {
    content: "";
    flex: 0 0 16px;
  }
`;

const CardWrapper = styled.div`
  scroll-snap-align: start;
  flex-shrink: 0;
  width: 230px;
  animation: ${fadeIn} 0.5s cubic-bezier(0.23, 1, 0.32, 1) both;
`;

const CATEGORY_ICONS: Record<string, string> = {
  burgers: "🍔",
  pizzas: "🍕",
  sushi: "🍣",
  sides: "🍟",
  drinks: "🥤",
  dessert: "🍰"
};

const ProductsList: React.FC<ProductsListProps> = ({ products }) => {
  // Extract unique categories in order of appearance or priority
  const categories = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    const seen = new Set<string>();
    const order: string[] = [];
    products.forEach(p => {
      if (p && typeof p.category === 'string' && p.category.trim()) {
        const cat = p.category.trim();
        if (!seen.has(cat)) {
          seen.add(cat);
          order.push(cat);
        }
      }
    });
    return order;
  }, [products]);

  return (
    <>
      {categories.map((cat) => {
        const items = products.filter((p) => p && p.category === cat);
        const icon = CATEGORY_ICONS[cat] || "🍱";
        const label = (cat || "").charAt(0).toUpperCase() + (cat || "").slice(1);

        return (
          <div key={cat}>
            <SectionTitle>
              {icon} {label}
            </SectionTitle>
            <HorizontalScroll>
              {items.map((product, i) => (
                <CardWrapper key={product.id} style={{ animationDelay: `${i * 0.05}s` }}>
                  <BuyCard {...product} />
                </CardWrapper>
              ))}
            </HorizontalScroll>
          </div>
        );
      })}
    </>
  );
};

export default ProductsList;
