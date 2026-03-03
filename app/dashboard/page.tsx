"use client";

import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import BalanceCard from "@/components/BalanceCard";
import FloatingActionButton from "@/components/FloatingActionButton";
import TransactionModal from "@/components/TransactionModal";
import TransactionList from "@/components/TransactionList";
import VoiceInput from "@/components/VoiceInput";
import ConfirmationModal from "@/components/ConfirmationModal";
import ReceiptUpload from "@/components/ReceiptUpload";
import EmailTransactionsModal, {
  DetectedEmailTransaction,
} from "@/components/EmailTransactionsModal";

interface Summary {
  balance: number;
  income: number;
  expenses: number;
}

interface Transaction {
  _id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note?: string;
  date: string;
  source: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [summary, setSummary] = useState<Summary>({
    balance: 0,
    income: 0,
    expenses: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/signin");
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSummary();
      fetchTransactions();
    }
  }, [status]);

  const fetchSummary = async () => {
    try {
      const response = await fetch("/api/transactions/summary");
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleTransactionAdded = () => {
    fetchSummary();
    fetchTransactions();
    setIsModalOpen(false);

    // Show success toast
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleVoiceTranscript = async (text: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/parse-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const result = await response.json();
        setParsedData(result.data);
        setIsConfirmModalOpen(true);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to parse transaction");
      }
    } catch (error) {
      console.error("Error parsing transaction:", error);
      alert("Failed to parse transaction. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReceiptParsed = (data: any) => {
    setParsedData(data);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmTransaction = async (data: any) => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: data.type,
          amount: data.amount,
          category: data.category,
          note: data.note,
          date: new Date(data.date).toISOString(),
          source: data.source,
          imageUrl: data.imageUrl,
          merchant: data.merchant,
        }),
      });

      if (response.ok) {
        setIsConfirmModalOpen(false);
        setParsedData(null);
        fetchSummary();
        fetchTransactions();
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save transaction");
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Failed to save transaction. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveEmailTransactions = async (
    approvedTransactions: DetectedEmailTransaction[],
  ) => {
    for (const transaction of approvedTransactions) {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          note: transaction.note,
          date: new Date(transaction.date).toISOString(),
          source: "email",
          merchant: transaction.merchant,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Failed to save one of the transactions",
        );
      }
    }

    setIsEmailModalOpen(false);
    fetchSummary();
    fetchTransactions();
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-apple-gray-200 border-t-apple-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-transition min-h-screen bg-gradient-to-b from-white via-apple-gray-50 to-white pb-24">
      {/* Header */}
      <header className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-semibold text-apple-gray-900">Lume</h1>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="text-apple-gray-500 hover:text-apple-gray-700 text-sm font-medium transition-colors"
          >
            Sign out
          </button>
        </div>
        {session?.user?.name && (
          <p className="text-apple-gray-500">
            Welcome back, {session.user.name}
          </p>
        )}
      </header>

      {/* Main Content */}
      <main className="px-6 space-y-4 max-w-2xl mx-auto animate-fade-in">
        {/* Balance Card - Prominent */}
        <BalanceCard
          title="Total Balance"
          amount={summary.balance}
          variant="primary"
        />

        {/* Income & Expenses Grid */}
        <div className="grid grid-cols-2 gap-4">
          <BalanceCard
            title="Income"
            amount={summary.income}
            variant="income"
          />
          <BalanceCard
            title="Expenses"
            amount={summary.expenses}
            variant="expense"
          />
        </div>

        {/* Empty State Hint */}
        {summary.balance === 0 &&
          summary.income === 0 &&
          summary.expenses === 0 && (
            <div className="text-center py-12 animate-slide-up">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-apple-gray-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-apple-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-apple-gray-700 mb-2">
                Start tracking
              </h3>
              <p className="text-apple-gray-500 text-sm max-w-xs mx-auto">
                Tap the + button below to add your first transaction
              </p>
            </div>
          )}

        {/* Recent Transactions */}
        <TransactionList transactions={transactions} />
      </main>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-card flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Transaction added successfully!</span>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton
        onManualClick={() => setIsModalOpen(true)}
        onVoiceClick={() => setIsVoiceModalOpen(true)}
        onReceiptClick={() => setIsReceiptModalOpen(true)}
        onEmailClick={() => setIsEmailModalOpen(true)}
      />

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransactionAdded={handleTransactionAdded}
      />

      {/* Voice Input Modal */}
      <VoiceInput
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onTranscript={handleVoiceTranscript}
      />

      {/* Receipt Upload Modal */}
      <ReceiptUpload
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onReceiptParsed={handleReceiptParsed}
      />

      {/* Email Transactions Modal */}
      <EmailTransactionsModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onApprove={handleApproveEmailTransactions}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setParsedData(null);
        }}
        parsedData={parsedData}
        onConfirm={handleConfirmTransaction}
      />

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-apple-gray-200 border-t-purple-600 rounded-full animate-spin mb-4" />
            <p className="text-apple-gray-700 font-medium">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
}
