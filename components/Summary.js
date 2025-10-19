"use client";

export default function Summary({ total }) {
  return (
    <div className="bg-green-100 text-green-800 p-4 rounded mt-4 text-center shadow">
      <h3 className="text-lg font-semibold">Total Expenses</h3>
      <p className="text-2xl font-bold mt-1">LKR {total.toFixed(2)}</p>
    </div>
  );
}
