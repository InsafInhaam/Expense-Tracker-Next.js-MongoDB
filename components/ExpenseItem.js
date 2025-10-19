"use client";

import axios from "axios";

export default function ExpenseItem({ expense, onDeleted, onEdit }) {
  async function handleDelete() {
    if (!confirm("Delete this expense?")) return;
    try {
      await axios.delete(`/api/expenses/${expense._id}`);
      onDeleted && onDeleted(expense._id);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  }

  return (
    <div className="bg-white p-3 rounded shadow flex justify-between items-center">
      <div>
        <div className="font-medium">{expense.title}</div>
        <div className="text-sm text-gray-500">
          {new Date(expense.date).toLocaleDateString()} • {expense.category}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="font-semibold">Rs. {Number(expense.amount).toFixed(2)}</div>
        <button
          onClick={() => onEdit(expense)}
          className="text-sm text-blue-600 cursor-pointer hover:underline"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="text-sm text-red-600 hover:underline cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
