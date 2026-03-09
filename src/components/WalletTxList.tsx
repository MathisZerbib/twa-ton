import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { Address } from "@ton/core";
import { useTonConnect } from "../hooks/useTonConnect";
import { CHAIN } from "@tonconnect/protocol";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowUp,
  faCheckCircle,
  faTimesCircle,
  faMotorcycle,
  faClock,
  faExternalLinkAlt,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeUp = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;
const shimmer = keyframes`0%{background-position:-200%}100%{background-position:200%}`;
const spin = keyframes`to{transform:rotate(360deg)}`;

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const Title = styled.h3`
  font-size: 1.1rem;
  font-weight: 900;
  margin: 0;
  color: #1a1a1a;
`;

const Sub = styled.p`
  font-size: 0.82rem;
  color: #888;
  margin: 0;
`;

const TxCard = styled.div<{ $delay: number }>`
  background: #fff;
  border-radius: 20px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
  animation: ${fadeUp} 0.4s ease ${p => p.$delay * 0.05}s both;
  border: 1px solid rgba(0,0,0,0.04);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }
`;

const TxIconBox = styled.div<{ $incoming: boolean; $success: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  background: ${(p) =>
    !p.$success
      ? 'rgba(244, 67, 54, 0.1)'
      : p.$incoming
        ? 'rgba(76, 175, 80, 0.15)'
        : 'rgba(255, 107, 53, 0.1)'};
  color: ${(p) =>
    !p.$success ? '#f44336' : p.$incoming ? '#2e7d32' : '#FF6B35'};
  flex-shrink: 0;
`;

const TxInfo = styled.div`
  flex: 1;
  margin: 0 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TxTitle = styled.div`
  font-size: 0.95rem;
  font-weight: 800;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const TxSubtitle = styled.div`
  font-size: 0.75rem;
  color: #888;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TxAmount = styled.div<{ $incoming: boolean; $success: boolean }>`
  font-size: 1.1rem;
  font-weight: 900;
  font-family: 'SF Mono', 'Fira Mono', monospace;
  color: ${(p) =>
    !p.$success ? '#aaa' : p.$incoming ? '#4caf50' : '#1a1a1a'};
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const StatusBadge = styled.span<{ $success: boolean }>`
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 6px;
  color: #fff;
  background: ${(p) => (p.$success ? '#4caf50' : '#f44336')};
`;

const HashLink = styled.a`
  color: #aaa;
  font-size: 0.72rem;
  text-decoration: none;
  &:hover {
    color: #FF6B35;
    text-decoration: underline;
  }
`;

const ShimmerLine = styled.div<{ w: string; h?: string }>`
  width: ${p => p.w};
  height: ${p => p.h ?? "14px"};
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite linear;
`;

const EmptyState = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: #888;
  background: rgba(0,0,0,0.02);
  border-radius: 20px;
  border: 1px dashed rgba(0,0,0,0.1);
  font-size: 0.95rem;
`;

// ─── Component ────────────────────────────────────────────────────────────────

interface WalletTxListProps {
  walletAddress: string;
}

const WalletTxList: React.FC<WalletTxListProps> = ({ walletAddress }) => {
  const { network } = useTonConnect();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [totalEarned, setTotalEarned] = useState(0);

  useEffect(() => {
    const fetchTxList = async () => {
      try {
        setLoading(true);
        const urlPrefix = network === CHAIN.MAINNET ? "" : "testnet.";

        let parsedAddr = walletAddress;
        try {
          parsedAddr = Address.parse(walletAddress).toRawString(); // Convert to raw format for API if needed
        } catch (e) { }

        const queryToGetTransactions = `https://${urlPrefix}tonapi.io/v2/blockchain/accounts/${parsedAddr}/transactions?limit=25`;
        const response = await fetch(queryToGetTransactions);
        const data = await response.json();

        const txs = data.transactions || [];
        setTransactions(txs);

        // Calculate total earnings (incoming successful TON transfers)
        let earned = 0;
        txs.forEach((tx: any) => {
          if (tx.success && tx.in_msg && tx.in_msg.value) {
            // Ignore tiny dust transfers or gas refunds if needed, but for now sum it up
            earned += Number(tx.in_msg.value);
          }
        });
        setTotalEarned(earned / 1e9);

      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTxList();
  }, [walletAddress, network]);

  if (loading) {
    return (
      <Container>
        {[1, 2, 3, 4].map(i => (
          <TxCard key={i} $delay={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
              <ShimmerLine w="44px" h="44px" style={{ borderRadius: 14 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <ShimmerLine w="120px" />
                <ShimmerLine w="80px" h="10px" />
              </div>
              <ShimmerLine w="60px" h="20px" />
            </div>
          </TxCard>
        ))}
      </Container>
    );
  }

  // Define Tonviewer link prefix
  const explorerPrefix = network === CHAIN.MAINNET
    ? "https://tonviewer.com/transaction/"
    : "https://testnet.tonviewer.com/transaction/";

  return (
    <Container>
      <HeaderRow>
        <div>
          <Title>Recent Activity</Title>
          <Sub>On-chain payouts & transfers</Sub>
        </div>
        {totalEarned > 0 && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Total Earned</div>
            <div style={{ color: '#4caf50', fontWeight: 900, fontFamily: 'SF Mono', fontSize: '1.1rem' }}>
              +{totalEarned.toFixed(2)} TON
            </div>
          </div>
        )}
      </HeaderRow>

      {transactions.length === 0 ? (
        <EmptyState>
          <FontAwesomeIcon icon={faMotorcycle} style={{ fontSize: '2rem', marginBottom: 10, color: '#ccc' }} />
          <div>No transactions found.</div>
          <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Complete a delivery to see your earnings here.</div>
        </EmptyState>
      ) : (
        transactions.map((tx, index) => {
          const isSuccess = tx.success;
          const hashHex = tx.hash;
          const shortHash = hashHex.slice(0, 6) + "…" + hashHex.slice(-6);

          // Check if it's an incoming or outgoing transfer.
          // In tonAPI, in_msg has the value arriving. out_msgs are leaving.
          const inValue = tx.in_msg?.value ? Number(tx.in_msg.value) : 0;
          let outValue = 0;
          if (tx.out_msgs && tx.out_msgs.length > 0) {
            tx.out_msgs.forEach((m: any) => outValue += (m.value ? Number(m.value) : 0));
          }

          const isIncoming = inValue > outValue;
          const netValueTon = Math.abs(inValue - outValue) / 1e9;

          // Formatter for date
          const date = new Date(tx.utime * 1000);
          const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

          const title = isIncoming
            ? (inValue > 0 ? "Delivery Payout" : "Incoming tx")
            : "Outgoing transfer";

          return (
            <TxCard key={hashHex} $delay={index}>
              <TxIconBox $incoming={isIncoming} $success={isSuccess}>
                {isIncoming ? <FontAwesomeIcon icon={faArrowDown} /> : <FontAwesomeIcon icon={faArrowUp} />}
              </TxIconBox>

              <TxInfo>
                <TxTitle>
                  {title}
                  {!isSuccess && <StatusBadge $success={false}>Failed</StatusBadge>}
                </TxTitle>
                <TxSubtitle>
                  <span><FontAwesomeIcon icon={faClock} style={{ opacity: 0.6 }} /> {dateStr}, {timeStr}</span>
                  <span>•</span>
                  <HashLink href={`${explorerPrefix}${hashHex}`} target="_blank" rel="noreferrer">
                    {shortHash} <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: '0.65rem' }} />
                  </HashLink>
                </TxSubtitle>
              </TxInfo>

              <TxAmount $incoming={isIncoming} $success={isSuccess}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isIncoming ? '+' : '−'}{netValueTon.toFixed(2)} TON
                </span>
              </TxAmount>

            </TxCard>
          );
        })
      )}
    </Container>
  );
};

export default WalletTxList;
