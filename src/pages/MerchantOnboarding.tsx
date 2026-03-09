import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faStore,
    faPlus,
    faTrash,
    faSpinner,
    faCheckCircle,
    faMapMarkerAlt,
    faExchangeAlt,
    faArrowLeft,
    faCoins,
    faBolt,
    faShieldAlt
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { AppContainer, FlexBoxCol } from "../components/styled/styled";
import Header from "../components/Header";
import MapWithGeocoder from "../components/MapWithGeocoder";
import { api } from "../services/api";

const PageHeader = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 60px 20px;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    right: -20%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255, 107, 53, 0.2) 0%, transparent 70%);
    z-index: 0;
  }
`;

const HeaderContent = styled.div`
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
`;

const Badge = styled.span`
  background: rgba(255, 107, 53, 0.2);
  color: #FF6B35;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 20px;
  display: inline-block;
`;

const ValueProps = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 40px auto;
  max-width: 1000px;
`;

const PropCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 24px;
  border-radius: 24px;
  text-align: center;
  transition: transform 0.3s;

  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.05);
  }

  svg {
    font-size: 2rem;
    color: #FF6B35;
    margin-bottom: 16px;
  }

  h4 {
    margin: 0 0 8px;
    font-size: 1.1rem;
    font-weight: 700;
  }

  p {
    margin: 0;
    font-size: 0.85rem;
    opacity: 0.7;
    line-height: 1.5;
  }
`;

const FormWrapper = styled.div`
  margin-top: -40px;
  position: relative;
  z-index: 2;
  padding: 0 20px 60px;
`;

const FormContainer = styled.form`
  background: #fff;
  border-radius: 32px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.1);
  max-width: 800px;
  margin: 0 auto;

  @media (max-width: 600px) {
    padding: 24px;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 800;
  margin: 40px 0 24px;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 12px;

  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #f0f0f0;
  }
`;

const InputGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 700;
  color: #333;
`;

const Input = styled.input`
  padding: 14px 20px;
  border-radius: 16px;
  border: 2px solid #f0f0f0;
  font-size: 1rem;
  transition: all 0.2s;
  background: #fafafa;
  
  &:focus {
    border-color: #FF6B35;
    background: #fff;
    outline: none;
    box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.1);
  }
`;

const Select = styled.select`
  padding: 14px 20px;
  border-radius: 16px;
  border: 2px solid #f0f0f0;
  font-size: 1rem;
  transition: all 0.2s;
  background: #fafafa;
  appearance: none;
  
  &:focus {
    border-color: #FF6B35;
    outline: none;
  }
`;

const Textarea = styled.textarea`
  padding: 14px 20px;
  border-radius: 16px;
  border: 2px solid #f0f0f0;
  font-size: 1rem;
  transition: all 0.2s;
  background: #fafafa;
  min-height: 100px;
  font-family: inherit;
  
  &:focus {
    border-color: #FF6B35;
    background: #fff;
    outline: none;
  }
`;

const ProductCard = styled.div`
  background: #fafafa;
  border: 2px dashed #eee;
  border-radius: 24px;
  padding: 30px;
  margin-bottom: 24px;
  position: relative;
  transition: border-color 0.2s;

  &:hover {
    border-color: #FF6B35;
  }
`;

const DeleteBtn = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: #fee2e2;
  color: #e53e3e;
  border: none;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover { background: #fecaca; }
`;

const AddBtn = styled.button`
  background: #fff;
  color: #FF6B35;
  border: 2px solid #FF6B35;
  padding: 16px 24px;
  border-radius: 16px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 auto 40px;
  transition: all 0.2s;

  &:hover { 
    background: #FF6B35;
    color: #fff;
    transform: scale(1.05);
  }
`;

const SubmitBtn = styled.button<{ disabled: boolean }>`
  width: 100%;
  padding: 20px;
  border-radius: 20px;
  border: none;
  font-size: 1.1rem;
  font-weight: 800;
  cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
  background: ${p => p.disabled ? '#ccc' : 'linear-gradient(135deg, #FF6B35, #F7931E)'};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 10px 30px rgba(255, 107, 53, 0.3);
  transition: all 0.3s;

  &:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 40px rgba(255, 107, 53, 0.4);
  }
`;

const LiveBanner = styled.div`
  background: #f0fff4;
  border: 1px solid #c6f6d5;
  color: #22543d;
  padding: 20px;
  border-radius: 20px;
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 30px;
  font-size: 0.9rem;
`;

export default function MerchantOnboarding() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [tonUsdRate, setTonUsdRate] = useState<number | null>(null);

    const [form, setForm] = useState({
        name: "",
        category: "",
        description: "",
        merchantWallet: "",
        imageUrl: "/assets/photos/burger.png",
        bannerUrl: "/assets/photos/burger_palace.png",
        lat: 0,
        lng: 0,
    });

    const [products, setProducts] = useState([
        { name: "", description: "", priceUsdt: "", category: "burgers", imageUrl: "/assets/photos/burger.png" }
    ]);

    useEffect(() => {
        api.getTonUsdRate().then(res => setTonUsdRate(res.priceUsd)).catch(console.error);
    }, []);

    const handleProductChange = (index: number, field: string, value: string) => {
        const updated = [...products];
        (updated[index] as any)[field] = value;
        setProducts(updated);
    };

    const addProduct = () => {
        setProducts([...products, { name: "", description: "", priceUsdt: "", category: "burgers", imageUrl: "/assets/photos/burger.png" }]);
    };

    const removeProduct = (index: number) => {
        setProducts(products.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.merchantWallet) return alert("Please fill required fields");
        setLoading(true);

        try {
            await api.onboardMerchant({
                ...form,
                products: products.map(p => ({
                    ...p,
                    priceUsdt: parseFloat(p.priceUsdt) || 0
                }))
            });
            setSuccess(true);
            setTimeout(() => navigate('/explore'), 2000);
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: '#fcfcfc', minHeight: '100vh', paddingBottom: 60 }}>
            <Header />

            <PageHeader>
                <HeaderContent>
                    <Badge>Revolutionizing Delivery</Badge>
                    <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: 16, color: '#fff' }}>Partner with TON-Eats 🚀</h1>
                    <p style={{ fontSize: '1.2rem', opacity: 0.8, maxWidth: 600, margin: '0 auto', color: '#fff' }}>
                        The world's first 0% commission decentralized food network. Keep 100% of your earnings, paid instantly in TON.
                    </p>

                    <ValueProps>
                        <PropCard>
                            <FontAwesomeIcon icon={faCoins} />
                            <h4 style={{ color: '#fff' }}>0% Commission</h4>
                            <p style={{ color: '#fff' }}>No parasitic middleman fees. What you sell is what you keep.</p>
                        </PropCard>
                        <PropCard>
                            <FontAwesomeIcon icon={faBolt} />
                            <h4 style={{ color: '#fff' }}>Instant Settlement</h4>
                            <p style={{ color: '#fff' }}>Payments route directly to your wallet via secure smart contracts.</p>
                        </PropCard>
                        <PropCard>
                            <FontAwesomeIcon icon={faShieldAlt} />
                            <h4 style={{ color: '#fff' }}>Safe Escrow</h4>
                            <p style={{ color: '#fff' }}>Funds are held in escrow until delivery is confirmed by both parties.</p>
                        </PropCard>
                    </ValueProps>
                </HeaderContent>
            </PageHeader>

            <FormWrapper>
                <FormContainer onSubmit={handleSubmit}>
                    <button type="button" onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 30, fontSize: '0.95rem', color: '#666', fontWeight: 600 }}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Back to explore
                    </button>

                    <SectionTitle>
                        <FontAwesomeIcon icon={faStore} style={{ color: '#FF6B35' }} />
                        Store Identity
                    </SectionTitle>

                    <InputGrid>
                        <InputGroup>
                            <Label>Restaurant Name *</Label>
                            <Input required placeholder="Gourmet Burger Kitchen" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        </InputGroup>
                        <InputGroup>
                            <Label>Cuisine Category *</Label>
                            <Input required placeholder="American • Burgers" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                        </InputGroup>
                    </InputGrid>

                    <InputGroup>
                        <Label>About the Restaurant</Label>
                        <Textarea placeholder="Tell customers what makes your food special..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </InputGroup>

                    <InputGroup>
                        <Label>Payout TON Wallet *</Label>
                        <Input required placeholder="UQB..." value={form.merchantWallet} onChange={e => setForm({ ...form, merchantWallet: e.target.value })} />
                        <p style={{ fontSize: '0.8rem', color: '#888', margin: '4px 0 0' }}>Your earnings will be sent here automatically upon delivery.</p>
                    </InputGroup>

                    <SectionTitle>
                        <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#FF6B35' }} />
                        Presence
                    </SectionTitle>
                    <div style={{ height: 350, borderRadius: 24, overflow: 'hidden', border: '2px solid #f0f0f0', marginBottom: 20 }}>
                        <MapWithGeocoder onSelectedAddress={(_addr, lat, lng) => setForm(prev => ({ ...prev, lat: lat || 0, lng: lng || 0 }))} />
                    </div>

                    <SectionTitle>
                        <FontAwesomeIcon icon={faBolt} style={{ color: '#FF6B35' }} />
                        Menu & Pricing
                    </SectionTitle>

                    {tonUsdRate && (
                        <LiveBanner>
                            <FontAwesomeIcon icon={faExchangeAlt} style={{ fontSize: '1.5rem' }} />
                            <div>
                                <strong>Dynamic TON Pricing Enabled</strong><br />
                                Current Rate: 1 TON = ${tonUsdRate.toFixed(2)}. Set your prices in USDT, and we'll auto-calculate the TON amount for customers.
                            </div>
                        </LiveBanner>
                    )}

                    {products.map((p, i) => (
                        <ProductCard key={i}>
                            {products.length > 1 && (
                                <DeleteBtn type="button" onClick={() => removeProduct(i)}>
                                    <FontAwesomeIcon icon={faTrash} /> Delete
                                </DeleteBtn>
                            )}

                            <InputGrid>
                                <InputGroup>
                                    <Label>Dish Name</Label>
                                    <Input required placeholder="Double Truffle Burger" value={p.name} onChange={e => handleProductChange(i, 'name', e.target.value)} />
                                </InputGroup>
                                <InputGroup>
                                    <Label>Category</Label>
                                    <Select value={p.category} onChange={e => handleProductChange(i, 'category', e.target.value)}>
                                        <option value="burgers">Burgers</option>
                                        <option value="pizzas">Pizzas</option>
                                        <option value="sushi">Sushi</option>
                                        <option value="sides">Sides</option>
                                        <option value="drinks">Drinks</option>
                                        <option value="dessert">Dessert</option>
                                    </Select>
                                </InputGroup>
                            </InputGrid>

                            <InputGroup>
                                <Label>Description</Label>
                                <Textarea placeholder="List main ingredients and allergens..." value={p.description} onChange={e => handleProductChange(i, 'description', e.target.value)} />
                            </InputGroup>

                            <InputGroup>
                                <Label>Price (USDT)</Label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <Input type="number" step="0.01" required placeholder="12.50" value={p.priceUsdt} onChange={e => handleProductChange(i, 'priceUsdt', e.target.value)} style={{ flex: 1 }} />
                                    <div style={{ background: '#eee', padding: '14px 20px', borderRadius: 16, fontWeight: 800, minWidth: 120, textAlign: 'center' }}>
                                        ≈ {tonUsdRate ? ((parseFloat(p.priceUsdt) || 0) / tonUsdRate).toFixed(2) : "0.00"} TON
                                    </div>
                                </div>
                            </InputGroup>
                        </ProductCard>
                    ))}

                    <AddBtn type="button" onClick={addProduct}>
                        <FontAwesomeIcon icon={faPlus} /> Add another item
                    </AddBtn>

                    <SubmitBtn disabled={loading || success} type="submit">
                        {success ? <><FontAwesomeIcon icon={faCheckCircle} /> Success! Redirecting...</> :
                            loading ? <><FontAwesomeIcon icon={faSpinner} spin /> Deploying Store...</> :
                                "Launch My Restaurant on TON-Eats"}
                    </SubmitBtn>
                </FormContainer>
            </FormWrapper>
        </div>
    );
}
