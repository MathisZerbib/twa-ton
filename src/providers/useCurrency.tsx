import React, { useState, useEffect, createContext, useContext } from "react";

interface CurrencyContextType {
  selectedCurrency: string;
  updateSelectedCurrency: (newCurrency: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState(
    localStorage.getItem("selectedCurrency") || "USDT"
  );

  const updateSelectedCurrency = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    localStorage.setItem("selectedCurrency", newCurrency);
  };

  // Listen for cross-tab changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "selectedCurrency" && e.newValue && e.newValue !== selectedCurrency) {
        setSelectedCurrency(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [selectedCurrency]);

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, updateSelectedCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Custom hook to consume the context
export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
