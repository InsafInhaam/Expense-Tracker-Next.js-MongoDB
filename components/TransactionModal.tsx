"use client";

import { useState, useEffect } from "react";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionAdded: () => void;
}

export default function TransactionModal({
  isOpen,
  onClose,
  onTransactionAdded,
}: TransactionModalProps) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState(false);

  const incomeCategories = [
    { value: "Salary", icon: "💼" },
    { value: "Freelance", icon: "💻" },
    { value: "Investment", icon: "📈" },
    { value: "Business", icon: "🏢" },
    { value: "Gift", icon: "🎁" },
    { value: "Refund", icon: "↩️" },
    { value: "Other", icon: "💰" },
  ];
  const expenseCategories = [
    { value: "Food & Dining", icon: "🍽️" },
    { value: "Transport", icon: "🚗" },
    { value: "Shopping", icon: "🛍️" },
    { value: "Bills & Utilities", icon: "📄" },
    { value: "Entertainment", icon: "🎬" },
    { value: "Healthcare", icon: "⚕️" },
    { value: "Education", icon: "📚" },
    { value: "Groceries", icon: "🛒" },
    { value: "Other", icon: "💸" },
  ];

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setAmount("");
      setCategory("");
      setNote("");
      const today = new Date();
      setDate(today.toISOString().split("T")[0]);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          amount: parseFloat(amount),
          category,
          note: note.trim() || undefined,
          date: new Date(date).toISOString(),
          source: "manual",
        }),
      });

      if (response.ok) {
        onTransactionAdded();
      } else {
        const error = await response.json();
        console.error("Failed to create transaction:", error);
        alert(error.error || "Failed to create transaction");
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="modal-panel bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-apple-gray-900">
            Add Transaction
          </h2>
          <button
            onClick={onClose}
            className="premium-button w-8 h-8 rounded-full bg-apple-gray-100 hover:bg-apple-gray-200 flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 text-apple-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type Toggle */}
          <div className="bg-apple-gray-100 rounded-xl p-1 flex gap-1">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`premium-button flex-1 py-2.5 rounded-lg font-medium text-sm ${
                type === "expense"
                  ? "bg-white text-apple-gray-900 shadow-soft"
                  : "text-apple-gray-500 hover:text-apple-gray-700"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`premium-button flex-1 py-2.5 rounded-lg font-medium text-sm ${
                type === "income"
                  ? "bg-white text-apple-gray-900 shadow-soft"
                  : "text-apple-gray-500 hover:text-apple-gray-700"
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-apple-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-gray-500 text-lg">
                $
              </span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3.5 rounded-xl border border-apple-gray-200 focus:border-apple-gray-400 focus:ring-2 focus:ring-apple-gray-100 outline-none transition-all text-lg"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-apple-gray-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl border border-apple-gray-200 focus:border-apple-gray-400 focus:ring-2 focus:ring-apple-gray-100 outline-none transition-all appearance-none bg-white text-base"
            >
              <option value="">Select category</option>
              {(type === "income" ? incomeCategories : expenseCategories).map(
                (cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.value}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-apple-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-3.5 rounded-xl border border-apple-gray-200 focus:border-apple-gray-400 focus:ring-2 focus:ring-apple-gray-100 outline-none transition-all"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-apple-gray-700 mb-2">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              rows={2}
              maxLength={200}
              className="w-full px-4 py-3.5 rounded-xl border border-apple-gray-200 focus:border-apple-gray-400 focus:ring-2 focus:ring-apple-gray-100 outline-none transition-all resize-none"
            />
            {note && (
              <p className="text-xs text-apple-gray-400 mt-1 text-right">
                {note.length}/200
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="premium-button w-full py-4 bg-gradient-to-br from-apple-gray-800 to-apple-gray-900 text-white font-medium rounded-xl hover:shadow-card-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Adding..." : "Add Transaction"}
          </button>
        </form>
      </div>
    </div>
  );
}
