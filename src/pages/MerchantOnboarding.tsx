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
  background: radial-gradient(circle at top right, #1a1a2e, #09090b);
  color: #fff;
  padding: 80px 20px 100px;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: url('/assets/grid-pattern.svg') repeat;
    opacity: 0.05;
    pointer-events: none;
  }
`;

const HeaderContent = styled.div`
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
`;

const Badge = styled.span`
  background: hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.15);
  color: var(--accent);
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 24px;
  display: inline-block;
  border: 1px solid hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.2);
`;

const ValueProps = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  margin: 60px auto 0;
  max-width: 1000px;
`;

const PropCard = styled.div`
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 32px 24px;
  border-radius: 24px;
  text-align: center;
  transition: all var(--transition-base);

  &:hover {
    transform: translateY(-8px);
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  }

  svg {
    font-size: 2.5rem;
    color: var(--accent);
    margin-bottom: 20px;
    filter: drop-shadow(0 4px 12px rgba(255,107,53,0.3));
  }

  h4 {
    margin: 0 0 12px;
    font-size: 1.25rem;
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  p {
    margin: 0;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.6;
    font-weight: 500;
  }
`;

const FormWrapper = styled.div`
  margin-top: -60px;
  position: relative;
  z-index: 2;
  padding: 0 24px 80px;
`;

const FormContainer = styled.form`
  background: var(--bg-primary);
  border-radius: var(--card-radius);
  padding: 48px;
  box-shadow: var(--shadow-lg);
  max-width: 850px;
  margin: 0 auto;
  border: 1px solid var(--bg-tertiary);

  @media (max-width: 600px) {
    padding: 24px;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.4rem;
  font-weight: 900;
  margin: 48px 0 28px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 16px;
  letter-spacing: -0.03em;

  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--bg-tertiary);
  }
`;

const InputGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
`;

const Label = styled.label`
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-secondary);
  letter-spacing: 0.02em;
`;

const Input = styled.input`
  padding: 16px 20px;
  border-radius: 16px;
  border: 2px solid var(--bg-tertiary);
  font-size: 1rem;
  transition: all var(--transition-fast);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  
  &::placeholder { color: var(--text-hint); }

  &:focus {
    border-color: var(--accent);
    background: var(--bg-primary);
    outline: none;
    box-shadow: 0 0 0 4px hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.1);
  }
`;

const Select = styled.select`
  padding: 16px 20px;
  border-radius: 16px;
  border: 2px solid var(--bg-tertiary);
  font-size: 1rem;
  transition: all var(--transition-fast);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 20px;
  padding-right: 48px;
  
  &:focus {
    border-color: var(--accent);
    outline: none;
  }
`;

const Textarea = styled.textarea`
  padding: 16px 20px;
  border-radius: 16px;
  border: 2px solid var(--bg-tertiary);
  font-size: 1rem;
  transition: all var(--transition-fast);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  min-height: 120px;
  font-family: inherit;
  resize: vertical;
  
  &::placeholder { color: var(--text-hint); }

  &:focus {
    border-color: var(--accent);
    background: var(--bg-primary);
    outline: none;
  }
`;

const ProductCard = styled.div`
  background: var(--bg-secondary);
  border: 2px dashed var(--bg-tertiary);
  border-radius: 24px;
  padding: 32px;
  margin-bottom: 28px;
  position: relative;
  transition: all var(--transition-base);

  &:hover {
    border-color: var(--accent);
    background: var(--bg-primary);
    box-shadow: var(--shadow-sm);
  }
`;

const DeleteBtn = styled.button`
  position: absolute;
  top: 24px;
  right: 24px;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: none;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all var(--transition-fast);

  &:hover { background: rgba(239, 68, 68, 0.2); }
`;

const AddBtn = styled.button`
  background: transparent;
  color: var(--accent);
  border: 2px solid var(--accent);
  padding: 18px 32px;
  border-radius: 18px;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0 auto 48px;
  transition: all var(--transition-base);
  width: 100%;
  max-width: 320px;

  &:hover { 
    background: var(--accent);
    color: #fff;
    transform: scale(1.02);
    box-shadow: 0 8px 20px hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.3);
  }
`;

const SubmitBtn = styled.button<{ disabled: boolean }>`
  width: 100%;
  padding: 22px;
  border-radius: 20px;
  border: none;
  font-size: 1.2rem;
  font-weight: 900;
  cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
  background: ${p => p.disabled ? 'var(--bg-tertiary)' : 'var(--accent)'};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  box-shadow: ${p => p.disabled ? 'none' : '0 12px 32px hsla(var(--hue-brand), var(--sat-brand), var(--light-brand), 0.4)'};
  transition: all var(--transition-base);

  &:not(:disabled):active {
    transform: scale(0.98);
  }
`;

const LiveBanner = styled.div`
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #065f46;
  padding: 24px;
  border-radius: 20px;
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 32px;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.5;

  strong { color: #064e3b; font-weight: 900; display: block; margin-bottom: 4px; }
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
