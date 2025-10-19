"use client";

import { useState } from "react";
import axios from "axios";

export default function ExpenseForm({ onSuccess, initial = null }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [amount, setAmount] = useState(initial?.amount || "");
  const [category, setCategory] = useState(initial?.category || "Other");
  const [date, setDate] = useState(
    initial?.date
      ? new Date(initial.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState(initial?.notes || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { title, amount: Number(amount), category, date, notes };
      if (initial && initial._id) {
        await axios.put(`/api/expenses/${initial._id}`, payload);
      } else {
        await axios.post("/api/expenses", payload);
      }
      setLoading(false);
      onSuccess && onSuccess();
      // reset if create
      if (!initial) {
        setTitle("");
        setAmount("");
        setNotes("");
        setCategory("Other");
        setDate(new Date().toISOString().slice(0, 10));
      }
    } catch (err) {
      setLoading(false);
      alert(err.response?.data?.error || err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="p-2 border rounded"
        />
        <input
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          type="number"
          step="0.01"
          className="p-2 border rounded"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="p-2 border rounded"
        >
          <option>Food & Dining</option>
          <option>Groceries</option>
          <option>Transport</option>
          <option>Shopping</option>
          <option>Bills & Utilities</option>
          <option>Rent</option>
          <option>Entertainment</option>
          <option>Health & Fitness</option>
          <option>Education</option>
          <option>Travel</option>
          <option>Subscriptions</option>
          <option>Personal Care</option>
          <option>Gifts & Donations</option>
          <option>Investments</option>
          <option>Home Maintenance</option>
          <option>Electronics</option>
          <option>Clothing</option>
          <option>Internet & Phone</option>
          <option>Medical</option>
          <option>Other</option>
        </select>
      </div>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="p-2 border rounded"
        />
      </div>
      <div className="mt-3">
        <button
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer"
        >
          {initial ? "Update" : "Add Expense"}
        </button>
      </div>
    </form>
  );
}
