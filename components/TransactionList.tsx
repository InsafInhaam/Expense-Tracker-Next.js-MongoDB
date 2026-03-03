"use client";

interface Transaction {
  _id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note?: string;
  date: string;
  source: string;
}

interface TransactionListProps {
  transactions: Transaction[];
}

export default function TransactionList({
  transactions,
}: TransactionListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      "Food & Dining": "🍽️",
      Transport: "🚗",
      Shopping: "🛍️",
      "Bills & Utilities": "📄",
      Entertainment: "🎬",
      Healthcare: "⚕️",
      Education: "📚",
      Groceries: "🛒",
      Salary: "💼",
      Freelance: "💻",
      Investment: "📈",
      Business: "🏢",
      Gift: "🎁",
      Refund: "↩️",
    };
    return icons[category] || "💸";
  };

  if (!transactions || transactions.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-apple-gray-900 mb-4 px-1">
        Recent Transactions
      </h2>
      <div className="space-y-2">
        {transactions.slice(0, 10).map((transaction) => (
          <div
            key={transaction._id}
            className="premium-card bg-white rounded-xl p-4 shadow-soft border border-apple-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-apple-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                  {getCategoryIcon(transaction.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-medium text-apple-gray-900 truncate">
                      {transaction.category}
                    </h3>
                    <span
                      className={`font-semibold ${
                        transaction.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-apple-gray-500">
                    <span>{formatDate(transaction.date)}</span>
                    {transaction.note && (
                      <>
                        <span>•</span>
                        <span className="truncate">{transaction.note}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
