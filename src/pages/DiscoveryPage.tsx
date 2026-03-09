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
  faStore
} from "@fortawesome/free-solid-svg-icons";
import Header from "../components/Header";
import { api } from "../services/api";

const fadeUp = keyframes`from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}`;

const Container = styled.div`
  background: #f7f7f7;
  min-height: 100vh;
  padding-bottom: 40px;
`;

const Content = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
`;

const SearchBar = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 12px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.03);
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  flex: 1;
  font-size: 0.95rem;
  outline: none;
  color: #1a1a1a;
  &::placeholder { color: #aaa; }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AddStoreBtn = styled.button`
  background: rgba(255, 107, 53, 0.1);
  color: #FF6B35;
  border: none;
  padding: 8px 12px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const RestaurantGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const RestaurantCard = styled.div<{ $delay: number }>`
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  cursor: pointer;
  animation: ${fadeUp} 0.5s ease ${p => p.$delay * 0.1}s both;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
`;

const Banner = styled.div<{ $src: string }>`
  height: 160px;
  background-image: url(${p => p.$src});
  background-size: cover;
  background-position: center;
  position: relative;
`;

const LogoBox = styled.div`
  position: absolute;
  bottom: -20px;
  left: 20px;
  width: 60px;
  height: 60px;
  background: #fff;
  border-radius: 14px;
  padding: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const CardInfo = styled.div`
  padding: 28px 20px 20px;
`;

const NameRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const Name = styled.h3`
  font-size: 1.15rem;
  font-weight: 800;
  margin: 0;
  color: #1a1a1a;
  min-height: 1.4rem; /* Safe slot for 1 line */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Rating = styled.span`
  background: #fdf2f2;
  color: #FF6B35;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Category = styled.p`
  font-size: 0.85rem;
  color: #666;
  margin: 0 0 12px;
  min-height: 1.2rem; /* Consistent spacing */
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 0.78rem;
  color: #888;
  font-weight: 600;
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const DiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState<any[]>([]);

  useEffect(() => {
    api.getMerchants().then(setMerchants).catch(console.error);
  }, []);

  return (
    <Container>
      <Header showConnectButton={true} />
      <Content>
        <SearchBar>
          <FontAwesomeIcon icon={faMagnifyingGlass} style={{ color: "#aaa" }} />
          <SearchInput placeholder="Search restaurants or cuisines..." />
        </SearchBar>

        <SectionHeader>
          <SectionTitle>
            <FontAwesomeIcon icon={faFire} style={{ color: "#FF6B35" }} />
            Trending on TON
          </SectionTitle>
          <AddStoreBtn onClick={() => navigate('/merchant/onboard')}>
            <FontAwesomeIcon icon={faStore} />
            Open Store
          </AddStoreBtn>
        </SectionHeader>

        <RestaurantGrid>
          {merchants.length === 0 && <p style={{ color: '#999', textAlign: 'center' }}>No restaurants found. Be the first to open a store!</p>}
          {merchants.map((res: any, i: number) => (
            <RestaurantCard
              key={res.id}
              $delay={i}
              onClick={() => navigate(`/store/${res.id}`)}
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
                    <FontAwesomeIcon icon={faStar} />
                    {res.rating.toFixed(1)}
                  </Rating>
                </NameRow>
                <Category>{res.category}</Category>
                <MetaRow>
                  <MetaItem>
                    <FontAwesomeIcon icon={faClock} style={{ color: "#22c55e" }} />
                    {res.deliveryTime || '20-30 min'}
                  </MetaItem>
                  <MetaItem>
                    <FontAwesomeIcon icon={faMotorcycle} />
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

