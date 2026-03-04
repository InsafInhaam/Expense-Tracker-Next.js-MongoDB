export const CURRENCIES = {
  USD: { name: "US Dollar", symbol: "$" },
  EUR: { name: "Euro", symbol: "€" },
  GBP: { name: "British Pound", symbol: "£" },
  JPY: { name: "Japanese Yen", symbol: "¥" },
  AUD: { name: "Australian Dollar", symbol: "A$" },
  CAD: { name: "Canadian Dollar", symbol: "C$" },
  CHF: { name: "Swiss Franc", symbol: "CHF" },
  CNY: { name: "Chinese Yuan", symbol: "¥" },
  INR: { name: "Indian Rupee", symbol: "₹" },
  LKR: { name: "Sri Lankan Rupee", symbol: "Rs" },
  MXN: { name: "Mexican Peso", symbol: "Mex$" },
  SGD: { name: "Singapore Dollar", symbol: "S$" },
  HKD: { name: "Hong Kong Dollar", symbol: "HK$" },
  NZD: { name: "New Zealand Dollar", symbol: "NZ$" },
  ZAR: { name: "South African Rand", symbol: "R" },
  KRW: { name: "South Korean Won", symbol: "₩" },
  SEK: { name: "Swedish Krona", symbol: "kr" },
  NOK: { name: "Norwegian Krone", symbol: "kr" },
  DKK: { name: "Danish Krone", symbol: "kr" },
  THB: { name: "Thai Baht", symbol: "฿" },
  MYR: { name: "Malaysian Ringgit", symbol: "RM" },
  PHP: { name: "Philippine Peso", symbol: "₱" },
  IDR: { name: "Indonesian Rupiah", symbol: "Rp" },
  AED: { name: "UAE Dirham", symbol: "د.إ" },
  SAR: { name: "Saudi Riyal", symbol: "﷼" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const getCurrencySymbol = (code: string): string => {
  const currency = CURRENCIES[code as CurrencyCode];
  return currency?.symbol || "$";
};

export const getCurrencyName = (code: string): string => {
  const currency = CURRENCIES[code as CurrencyCode];
  return currency?.name || "US Dollar";
};

export const getCurrencyOptions = () => {
  return Object.entries(CURRENCIES).map(([code, data]) => ({
    code,
    name: data.name,
    symbol: data.symbol,
  }));
};
