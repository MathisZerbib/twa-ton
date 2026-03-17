import React from "react";
import { useTONEatsEscrow } from "../hooks/useTONEatsEscrow";

const AdminRescuePanel: React.FC = () => {
  const { withdrawAll, contractAddress } = useTONEatsEscrow();

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <button
        onClick={withdrawAll}
        style={{
          background: "var(--bg-tertiary)",
          border: "none",
          padding: "10px 20px",
          borderRadius: 14,
          fontSize: 11,
          fontWeight: 800,
          color: "var(--text-secondary)",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        Withdraw Funds (Admin Only)
      </button>
      <code style={{ fontSize: 9, color: "var(--text-hint)", wordBreak: "break-all", maxWidth: 200 }}>
        {contractAddress}
      </code>
    </div>
  );
};

export default AdminRescuePanel;
