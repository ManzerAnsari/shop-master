import { useState, useEffect } from "react";
import {
  getUserCurrency,
  getCurrencySymbol,
  formatCurrency,
} from "../utils/currency";

/**
 * Custom hook for currency formatting
 * @returns {Object} Currency utilities
 */
export const useCurrency = () => {
  const [currency, setCurrency] = useState("INR");
  const [symbol, setSymbol] = useState("₹");

  useEffect(() => {
    const userCurrency = getUserCurrency();
    setCurrency(userCurrency);
    setSymbol(getCurrencySymbol(userCurrency));
  }, []);

  const format = (amount) => formatCurrency(amount, currency);

  return {
    currency,
    symbol,
    format,
  };
};

export default useCurrency;
