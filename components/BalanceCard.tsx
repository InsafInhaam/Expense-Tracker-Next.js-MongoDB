"use client";

interface BalanceCardProps {
  title: string;
  amount: number;
  variant?: "primary" | "income" | "expense";
}

export default function BalanceCard({
  title,
  amount,
  variant = "primary",
}: BalanceCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-gradient-to-br from-apple-gray-800 to-apple-gray-900 text-white";
      case "income":
        return "bg-white border border-apple-gray-200";
      case "expense":
        return "bg-white border border-apple-gray-200";
      default:
        return "bg-white border border-apple-gray-200";
    }
  };

  const getAmountColor = () => {
    if (variant === "primary") return "text-white";
    if (variant === "income") return "text-green-600";
    if (variant === "expense") return "text-red-600";
    return "text-apple-gray-900";
  };

  const getTitleColor = () => {
    if (variant === "primary") return "text-white/70";
    return "text-apple-gray-500";
  };

  return (
    <div
      className={`${getVariantStyles()} premium-card rounded-2xl p-6 shadow-card`}
    >
      <p className={`text-sm font-medium mb-2 ${getTitleColor()}`}>{title}</p>
      <p className={`text-2xl font-semibold break-words ${getAmountColor()}`}>
        {formatCurrency(amount)}
      </p>
    </div>
  );
}
