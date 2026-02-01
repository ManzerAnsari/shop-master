/**
 * Currency utility functions
 */

// Currency symbols mapping
const CURRENCY_SYMBOLS = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
};

/**
 * Get currency symbol from currency code
 * @param {string} currencyCode - Currency code (USD, INR, etc.)
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currencyCode = "USD") => {
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
};

/**
 * Format amount with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code (USD, INR, etc.)
 * @returns {string} Formatted amount with currency symbol
 */
export const formatCurrency = (amount, currencyCode = "USD") => {
  const symbol = getCurrencySymbol(currencyCode);

  // For INR, format with Indian numbering system (lakhs, crores)
  if (currencyCode === "INR") {
    return `${symbol}${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  // For other currencies, use standard formatting
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Get user's preferred currency from localStorage or default
 * @returns {string} Currency code
 */
export const getUserCurrency = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.currency || "INR"; // Default to INR
  } catch {
    return "INR";
  }
};

export default {
  getCurrencySymbol,
  formatCurrency,
  getUserCurrency,
};
