import React, { useState, useEffect } from "react";

// Custom hook to manage currency selection
export const useCurrency = () => {
  // Initialize selectedCurrency from local storage or default to 'USD'
  const [selectedCurrency, setSelectedCurrency] = useState(
    localStorage.getItem("selectedCurrency") || "USDT"
  );

  // Function to update the selected currency
  const updateSelectedCurrency = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    // Update local storage whenever the selected currency changes
    localStorage.setItem("selectedCurrency", newCurrency);
  };

  // Optionally, you can listen for changes to local storage and update the state accordingly
  useEffect(() => {
    const handleStorageChange = () => {
      const currency = localStorage.getItem("selectedCurrency");
      if (currency !== selectedCurrency) {
        setSelectedCurrency(currency || "USDT");
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Cleanup the event listener
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [selectedCurrency]);

  return { selectedCurrency, updateSelectedCurrency };
};
