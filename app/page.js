"use client";

import { useEffect, useState } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseItem from "@/components/ExpenseItem";
import Header from "@/components/Header";
import Image from "next/image";
import axios from "axios";
import Summary from "@/components/Summary";
import Analytics from "@/components/Analytics";

export default function Home() {
  const [expenses, setExpenses] = useState([]);
  const [editing, setEditing] = useState(null);

  async function fetchExpenses() {
    const res = await axios.get("/api/expenses");
    setExpenses(res.data.expenses);
  }

  useEffect(() => {
    fetchExpenses();
  }, []);

  function handleDeleted(id) {
    setExpenses((prev) => prev.filter((e) => e._id !== id));
  }

  function handleRefresh() {
    fetchExpenses();
    setEditing(null);
  }

  return (
    <>
      <Header />
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Summary total={expenses.reduce((s, e) => s + Number(e.amount), 0)} />

        <Analytics expenses={expenses} />

        <ExpenseForm onSuccess={handleRefresh} initial={editing} />

        <div className="space-y-3">
          {expenses.map((exp) => (
            <ExpenseItem
              key={exp._id}
              expense={exp}
              onDeleted={handleDeleted}
              onEdit={setEditing}
            />
          ))}
        </div>
      </div>
    </>
  );
}
