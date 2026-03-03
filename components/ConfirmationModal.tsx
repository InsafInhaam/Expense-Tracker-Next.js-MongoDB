"use client";

import { useState } from "react";

interface ParsedTransaction {
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  note: string;
  source: string;
  imageUrl?: string;
  merchant?: string;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedData: ParsedTransaction | null;
  onConfirm: (data: ParsedTransaction) => void;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  parsedData,
  onConfirm,
}: ConfirmationModalProps) {
  const [editedData, setEditedData] = useState<ParsedTransaction | null>(null);

  if (!isOpen || !parsedData) return null;

  const data = editedData || parsedData;

  const incomeCategories = [
    "Salary",
    "Freelance",
    "Investment",
    "Business",
    "Gift",
    "Refund",
    "Other",
  ];
  const expenseCategories = [
    "Food & Dining",
    "Transport",
    "Shopping",
    "Bills & Utilities",
    "Entertainment",
    "Healthcare",
    "Education",
    "Groceries",
    "Other",
  ];

  const categories =
    data.type === "income" ? incomeCategories : expenseCategories;

  const handleChange = (field: keyof ParsedTransaction, value: any) => {
    setEditedData({
      ...(editedData || parsedData),
      [field]: value,
    });
  };

  const handleConfirm = () => {
    onConfirm(data);
    setEditedData(null);
  };

  const handleCancel = () => {
    setEditedData(null);
    onClose();
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleCancel}
    >
      <div
        className="modal-panel bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-apple-gray-50 to-apple-gray-100 px-6 py-4 border-b border-apple-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-apple-gray-900">
              Confirm Transaction
            </h2>
            <button
              onClick={handleCancel}
              className="premium-button text-apple-gray-400 hover:text-apple-gray-600"
            >
              <svg
                className="w-6 h-6"
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
          <p className="text-sm text-apple-gray-500 mt-1">
            Review and edit the parsed transaction
          </p>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Receipt Image */}
          {data.imageUrl && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-apple-gray-700 mb-2">
                Receipt Image
              </label>
              <div className="relative rounded-xl overflow-hidden bg-apple-gray-100 border border-apple-gray-200">
                <img
                  src={data.imageUrl}
                  alt="Receipt"
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
            </div>
          )}

          {/* Merchant (for receipt uploads) */}
          {data.merchant && (
            <div>
              <label className="block text-sm font-medium text-apple-gray-700 mb-2">
                Merchant
              </label>
              <input
                type="text"
                value={data.merchant}
                onChange={(e) => handleChange("merchant", e.target.value)}
                className="w-full px-4 py-3 bg-apple-gray-50 border border-apple-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-gray-400"
                placeholder="Merchant name"
              />
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-apple-gray-700 mb-2">
              Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleChange("type", "expense")}
                className={`premium-button flex-1 py-2 px-4 rounded-xl font-medium ${
                  data.type === "expense"
                    ? "bg-apple-gray-900 text-white"
                    : "bg-apple-gray-100 text-apple-gray-600 hover:bg-apple-gray-200"
                }`}
              >
                Expense
              </button>
              <button
                onClick={() => handleChange("type", "income")}
                className={`premium-button flex-1 py-2 px-4 rounded-xl font-medium ${
                  data.type === "income"
                    ? "bg-apple-gray-900 text-white"
                    : "bg-apple-gray-100 text-apple-gray-600 hover:bg-apple-gray-200"
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-apple-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-gray-500">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                value={data.amount}
                onChange={(e) =>
                  handleChange("amount", parseFloat(e.target.value))
                }
                className="w-full pl-8 pr-4 py-3 bg-apple-gray-50 border border-apple-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-gray-400"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-apple-gray-700 mb-2">
              Category
            </label>
            <select
              value={data.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className="w-full px-4 py-3 bg-apple-gray-50 border border-apple-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-gray-400"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-apple-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={data.date}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => handleChange("date", e.target.value)}
              className="w-full px-4 py-3 bg-apple-gray-50 border border-apple-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-gray-400"
            />
            <p className="mt-1 text-xs text-apple-gray-500">
              {formatDate(data.date)}
            </p>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-apple-gray-700 mb-2">
              Note
            </label>
            <textarea
              value={data.note}
              onChange={(e) => handleChange("note", e.target.value)}
              rows={2}
              maxLength={200}
              className="w-full px-4 py-3 bg-apple-gray-50 border border-apple-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-gray-400 resize-none"
            />
            <p className="mt-1 text-xs text-apple-gray-500 text-right">
              {data.note.length}/200
            </p>
          </div>

          {/* AI Badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-xl">
            {data.source === "receipt" ? (
              <>
                <svg
                  className="w-4 h-4 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-xs text-purple-700 font-medium">
                  Receipt scanned by Gemini AI
                </p>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 text-purple-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <p className="text-xs text-purple-700 font-medium">
                  Parsed by Gemini AI
                </p>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCancel}
              className="premium-button flex-1 py-3 bg-apple-gray-100 text-apple-gray-700 rounded-xl font-medium hover:bg-apple-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="premium-button flex-1 py-3 bg-gradient-to-r from-apple-gray-800 to-apple-gray-900 text-white rounded-xl font-medium hover:opacity-90"
            >
              Confirm & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
