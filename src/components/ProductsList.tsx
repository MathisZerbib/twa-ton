// src/components/ProductsList.tsx
import React, { useMemo } from "react";
import styled from "styled-components";
import BuyCard from "./BuyCard";
import { ProductProps } from "./types";

interface ProductsListProps {
  products: ProductProps[];
}

const SectionTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 24px 0 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  letter-spacing: -0.02em;
`;

const HorizontalScroll = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding: 8px 16px 24px;
  margin: 0 -16px; 
  
  &::-webkit-scrollbar { display: none; }
  scrollbar-width: none;

  &::after {
    content: "";
    flex: 0 0 16px;
  }

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    overflow: visible;
    scroll-snap-type: none;
    margin: 0;
    padding: 8px 0 24px;

    &::after {
      content: none;
    }
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (min-width: 1280px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
  }

  @media (min-width: 1536px) {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
`;

const CardWrapper = styled.div`
  scroll-snap-align: start;
  flex-shrink: 0;
  /* Responsive card width: 160px (mobile) to 240px (desktop) */
  width: clamp(160px, 45vw, 240px);

  /* Full width on very small viewports with horizontal scroll */
  @media (max-width: 320px) {
    width: 100%;
    min-width: 100%;
  }

  @media (min-width: 768px) {
    width: 100%;
    min-width: 0;
  }
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

  const productsByCategory = useMemo(() => {
    const grouped = new Map<string, ProductProps[]>();
    products.forEach((p) => {
      if (!p?.category) return;
      const list = grouped.get(p.category) ?? [];
      list.push(p);
      grouped.set(p.category, list);
    });
    return grouped;
  }, [products]);

  return (
    <>
      {categories.map((cat) => {
        const items = productsByCategory.get(cat) ?? [];
        const icon = CATEGORY_ICONS[cat] || "🍱";
        const label = (cat || "").charAt(0).toUpperCase() + (cat || "").slice(1);

        return (
          <div key={cat}>
            <SectionTitle>
              {icon} {label}
            </SectionTitle>
            <HorizontalScroll>
              {items.map((product) => (
                <CardWrapper key={product.id}>
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
