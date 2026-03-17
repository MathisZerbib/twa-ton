import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faClock,
  faMotorcycle,
  faMagnifyingGlass,
  faFire,
} from "@fortawesome/free-solid-svg-icons";
import Header from "../components/Header";
import { api } from "../services/api";

const fadeUp = keyframes`from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}`;

const Container = styled.div`
  background: var(--bg-primary);
  min-height: 100vh;
  padding-bottom: 60px;
  transition: background var(--transition-base);
`;

const Content = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: 16px;
  width: 100%;

  /* Full width on mobile */
  @media (max-width: 480px) {
    padding: 12px;
  }

  /* Better padding on larger screens */
  @media (min-width: 768px) {
    padding: 20px;
  }

  @media (min-width: 1024px) {
    padding: 24px;
  }
`;

const SearchBar = styled.div`
  background: var(--bg-secondary);
  border-radius: 18px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 32px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--bg-tertiary);
  transition: all var(--transition-fast);

  &:focus-within {
    border-color: var(--accent);
    box-shadow: var(--shadow-md);
  }
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  flex: 1;
  font-size: 1rem;
  font-weight: 600;
  outline: none;
  color: var(--text-primary);
  &::placeholder { color: var(--text-hint); }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 900;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  letter-spacing: -0.03em;
  color: var(--text-primary);
`;

const RestaurantGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 1280px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const RestaurantCard = styled.div<{ $delay: number }>`
  background: var(--bg-secondary);
  border-radius: var(--card-radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  animation: ${fadeUp} 0.6s var(--transition-smooth) ${p => p.$delay * 0.08}s both;
  transition: all var(--transition-base);
  border: 1px solid var(--bg-tertiary);
  height: 100%;
  
  &:active {
    transform: scale(0.97);
    box-shadow: var(--shadow-md);
  }
`;

const Banner = styled.div<{ $src: string }>`
  height: 180px;
  background-image: url(${p => p.$src});
  background-size: cover;
  background-position: center;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%);
  }
`;

const LogoBox = styled.div`
  position: absolute;
  bottom: -24px;
  left: 20px;
  width: 64px;
  height: 64px;
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 8px;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid var(--bg-secondary);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 8px;
  }
`;

const CardInfo = styled.div`
  padding: 32px 20px 20px;
`;

const NameRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`;

const Name = styled.h3`
  font-size: 1.3rem;
  font-weight: 900;
  margin: 0;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Rating = styled.span`
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 0.85rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const CategoryString = styled.p`
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin: 0 0 16px;
  font-weight: 600;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 700;
  padding-top: 16px;
  border-top: 1px solid var(--bg-tertiary);
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
`;

import { SkeletonCard, SkeletonLine } from "../components/Skeleton";

const DiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getMerchants()
      .then(res => {
        setMerchants(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <Container>
      <Header showConnectButton={true} />
      <Content>
        <SearchBar>
          <FontAwesomeIcon icon={faMagnifyingGlass} style={{ color: "var(--text-hint)", opacity: 0.5 }} />
          <SearchInput placeholder="Search restaurants, cuisines, or areas..." />
        </SearchBar>

        <SectionHeader>
          <SectionTitle>
            <FontAwesomeIcon icon={faFire} style={{ color: "var(--accent)" }} />
            Popular Restaurants
          </SectionTitle>
        </SectionHeader>

        <RestaurantGrid>
          {loading ? (
            <>
              <SkeletonCard style={{ height: 280 }} />
              <SkeletonCard style={{ height: 280 }} />
              <SkeletonCard style={{ height: 280 }} />
            </>
          ) : merchants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.6 }}>
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>🏠</div>
              <p style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>No restaurants available yet</p>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Check back soon or open the first restaurant in your area.</p>
            </div>
          ) : merchants.map((res: any, i: number) => (
            <RestaurantCard
              key={res.id}
              $delay={i}
              onClick={() => navigate(`/store/${res.id}`)}
              style={{ height: 'auto' }}
            >
              <Banner $src={res.bannerUrl || '/gourmet_burger.png'}>
                <LogoBox>
                  <img src={res.imageUrl || '/burger_logo.png'} alt={res.name} />
                </LogoBox>
              </Banner>
              <CardInfo>
                <NameRow>
                  <Name>{res.name}</Name>
                  <Rating>
                    <FontAwesomeIcon icon={faStar} style={{ color: "#FFD23F" }} />
                    {res.rating.toFixed(1)}
                  </Rating>
                </NameRow>
                <CategoryString>{res.category}</CategoryString>
                <MetaRow>
                  <MetaItem>
                    <FontAwesomeIcon icon={faClock} style={{ color: "var(--success)", opacity: 0.8 }} />
                    {res.deliveryTime || '20-30 min'}
                  </MetaItem>
                  <MetaItem>
                    <FontAwesomeIcon icon={faMotorcycle} style={{ opacity: 0.6 }} />
                    0.2 TON delivery
                  </MetaItem>
                </MetaRow>
              </CardInfo>
            </RestaurantCard>
          ))}
        </RestaurantGrid>
      </Content>
    </Container>
  );
};

export default DiscoveryPage;

