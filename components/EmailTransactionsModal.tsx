"use client";

import { useEffect, useState } from "react";

export interface DetectedEmailTransaction {
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  merchant?: string;
  note?: string;
  confidence: number;
  source: "email";
  emailId?: string;
  selected?: boolean;
}

interface EmailTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (transactions: DetectedEmailTransaction[]) => Promise<void>;
}

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

export default function EmailTransactionsModal({
  isOpen,
  onClose,
  onApprove,
}: EmailTransactionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState<DetectedEmailTransaction[]>(
    [],
  );

  useEffect(() => {
    if (!isOpen) return;

    const fetchDetected = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/email-transactions", {
          method: "GET",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to detect transactions");
        }

        const detected = Array.isArray(data.detectedTransactions)
          ? data.detectedTransactions
          : [];

        setTransactions(
          detected.map((item: DetectedEmailTransaction) => ({
            ...item,
            selected: true,
          })),
        );
      } catch (fetchError: any) {
        setError(fetchError?.message || "Failed to detect transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchDetected();
  }, [isOpen]);

  const updateItem = (
    index: number,
    key: keyof DetectedEmailTransaction,
    value: string | number | boolean,
  ) => {
    setTransactions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    setTransactions((prev) =>
      prev.map((item) => ({ ...item, selected: checked })),
    );
  };

  const handleApprove = async () => {
    const selected = transactions.filter((item) => item.selected);

    if (selected.length === 0) {
      setError("Select at least one transaction to save.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onApprove(selected);
      onClose();
    } catch (approveError: any) {
      setError(approveError?.message || "Failed to save approved transactions");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const selectedCount = transactions.filter((item) => item.selected).length;

  return (
    <div
      className="modal-backdrop fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="modal-panel bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-apple-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-apple-gray-900">
              Gmail Transaction Detection
            </h2>
            <p className="text-sm text-apple-gray-500">
              Review detected transactions before saving.
            </p>
          </div>
          <button
            onClick={onClose}
            className="premium-button text-apple-gray-500 hover:text-apple-gray-700"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
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

        <div className="px-6 py-4 border-b border-apple-gray-100 flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm text-apple-gray-700">
            <input
              type="checkbox"
              checked={
                transactions.length > 0 && selectedCount === transactions.length
              }
              onChange={(event) => toggleSelectAll(event.target.checked)}
            />
            Select all
          </label>
          <span className="text-sm text-apple-gray-500">
            {selectedCount} selected / {transactions.length} detected
          </span>
        </div>

        <div className="p-6 overflow-y-auto max-h-[58vh] space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-apple-gray-200 border-t-apple-gray-700 rounded-full animate-spin" />
            </div>
          )}

          {!loading && transactions.length === 0 && !error && (
            <div className="text-center py-12 text-apple-gray-500">
              No likely transactions found in recent Gmail messages.
            </div>
          )}

          {transactions.map((item, index) => {
            const categories =
              item.type === "income" ? incomeCategories : expenseCategories;

            return (
              <div
                key={`${item.emailId || "email"}-${index}`}
                className="premium-card border border-apple-gray-200 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-apple-gray-800">
                    <input
                      type="checkbox"
                      checked={Boolean(item.selected)}
                      onChange={(event) =>
                        updateItem(index, "selected", event.target.checked)
                      }
                    />
                    Approve
                  </label>
                  <span className="text-xs text-apple-gray-500">
                    Confidence: {Math.round(item.confidence * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={item.type}
                    onChange={(event) =>
                      updateItem(
                        index,
                        "type",
                        event.target.value as "income" | "expense",
                      )
                    }
                    className="px-3 py-2 border border-apple-gray-200 rounded-xl bg-white"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>

                  <input
                    type="number"
                    step="0.01"
                    value={item.amount}
                    onChange={(event) =>
                      updateItem(index, "amount", Number(event.target.value))
                    }
                    className="px-3 py-2 border border-apple-gray-200 rounded-xl"
                    placeholder="Amount"
                  />

                  <select
                    value={item.category}
                    onChange={(event) =>
                      updateItem(index, "category", event.target.value)
                    }
                    className="px-3 py-2 border border-apple-gray-200 rounded-xl bg-white"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={item.date}
                    onChange={(event) =>
                      updateItem(index, "date", event.target.value)
                    }
                    className="px-3 py-2 border border-apple-gray-200 rounded-xl"
                  />

                  <input
                    type="text"
                    value={item.merchant || ""}
                    onChange={(event) =>
                      updateItem(index, "merchant", event.target.value)
                    }
                    className="px-3 py-2 border border-apple-gray-200 rounded-xl md:col-span-2"
                    placeholder="Merchant"
                  />

                  <textarea
                    value={item.note || ""}
                    onChange={(event) =>
                      updateItem(index, "note", event.target.value)
                    }
                    rows={2}
                    className="px-3 py-2 border border-apple-gray-200 rounded-xl md:col-span-2 resize-none"
                    placeholder="Note"
                  />
                </div>
              </div>
            );
          })}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-apple-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="premium-button px-4 py-2 rounded-xl bg-apple-gray-100 text-apple-gray-700 hover:bg-apple-gray-200"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            className="premium-button px-4 py-2 rounded-xl bg-apple-gray-900 text-white hover:bg-apple-gray-800 disabled:opacity-60"
            disabled={saving || loading}
          >
            {saving ? "Saving..." : "Save Approved"}
          </button>
        </div>
      </div>
    </div>
  );
}
