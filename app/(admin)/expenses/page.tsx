"use client";

// =============================================================================
// app/(admin)/expenses/page.tsx - EXPENSES & OPERATING COSTS
//
// Beginner-friendly code:
// - Track maintenance, electricity, municipal taxes, security & housekeeping expenses
// - "Add Expense" modal
// - Visual summary cards
// =============================================================================

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Filter,
  IndianRupee,
  Plus,
  Receipt,
  Search,
  Tag,
  TrendingDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Expense = {
  id: string;
  expenseNo: string;
  title: string;
  propertyName: string;
  category: "Repairs" | "Utilities" | "Salaries" | "Taxes" | "Insurance";
  amount: number;
  date: string;
  paidBy: string;
};

const INITIAL_EXPENSES: Expense[] = [
  {
    id: "exp-1",
    expenseNo: "EXP-2026-051",
    title: "Lift Maintenance & AMC (Quarterly)",
    propertyName: "Lakeview Towers",
    category: "Repairs",
    amount: 28500,
    date: "12 Nov 2026",
    paidBy: "Net Banking",
  },
  {
    id: "exp-2",
    expenseNo: "EXP-2026-052",
    title: "Common Area Electricity Bill",
    propertyName: "Greenfield Heights",
    category: "Utilities",
    amount: 14200,
    date: "10 Nov 2026",
    paidBy: "Auto-debit",
  },
  {
    id: "exp-3",
    expenseNo: "EXP-2026-053",
    title: "Security Guard & Housekeeping Salary",
    propertyName: "Royal Palms",
    category: "Salaries",
    amount: 45000,
    date: "05 Nov 2026",
    paidBy: "Bank Transfer",
  },
  {
    id: "exp-4",
    expenseNo: "EXP-2026-054",
    title: "Water Tank Cleaning & Plumbing Fix",
    propertyName: "Silver Oak Enclave",
    category: "Repairs",
    amount: 9800,
    date: "03 Nov 2026",
    paidBy: "UPI",
  },
  {
    id: "exp-5",
    expenseNo: "EXP-2026-055",
    title: "Municipal Property Tax (H2)",
    propertyName: "Greenfield Heights",
    category: "Taxes",
    amount: 62000,
    date: "28 Oct 2026",
    paidBy: "Cheque",
  },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Expense Form
  const [formData, setFormData] = useState({
    title: "",
    propertyName: "Greenfield Heights",
    category: "Repairs" as Expense["category"],
    amount: "",
    paidBy: "UPI",
  });

  const filtered = expenses.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.propertyName.toLowerCase().includes(search.toLowerCase()) ||
      item.expenseNo.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "All" || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      expenseNo: `EXP-2026-0${Math.floor(60 + Math.random() * 30)}`,
      title: formData.title,
      propertyName: formData.propertyName,
      category: formData.category,
      amount: Number(formData.amount),
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      paidBy: formData.paidBy,
    };

    setExpenses([newExp, ...expenses]);
    setFormData({
      title: "",
      propertyName: "Greenfield Heights",
      category: "Repairs",
      amount: "",
      paidBy: "UPI",
    });
    setIsModalOpen(false);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      {/* ----------------- Header ----------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Property Expenses
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Track maintenance, utility bills, salaries, and municipal charges
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="gap-2 bg-indigo-600 font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      {/* ----------------- Summary Cards ----------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Expenses
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            ₹{totalExpense.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-slate-500">{expenses.length} expense items recorded</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Repairs & Maintenance
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Receipt className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            ₹
            {expenses
              .filter((e) => e.category === "Repairs")
              .reduce((s, e) => s + e.amount, 0)
              .toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-slate-500">Includes AMC and plumbing</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Salaries & Staff
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <IndianRupee className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            ₹
            {expenses
              .filter((e) => e.category === "Salaries")
              .reduce((s, e) => s + e.amount, 0)
              .toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-slate-500">Guard and cleaning staff</p>
        </div>
      </div>

      {/* ----------------- Filter & Search ----------------- */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search expense description, property, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="All">All Categories</option>
            <option value="Repairs">Repairs</option>
            <option value="Utilities">Utilities</option>
            <option value="Salaries">Salaries</option>
            <option value="Taxes">Taxes</option>
          </select>
        </div>
      </div>

      {/* ----------------- Expenses Table ----------------- */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 pl-6 pr-4">Expense ID & Description</th>
                <th className="px-4 py-3.5">Property</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Payment Mode</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="py-3.5 pl-4 pr-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 pl-6 pr-4">
                    <p className="font-mono text-xs font-bold text-slate-400">
                      {exp.expenseNo}
                    </p>
                    <p className="mt-0.5 font-bold text-slate-900">{exp.title}</p>
                  </td>

                  <td className="px-4 py-4 font-medium text-slate-700">
                    {exp.propertyName}
                  </td>

                  <td className="px-4 py-4">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {exp.category}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-xs font-medium text-slate-600">
                    {exp.paidBy}
                  </td>

                  <td className="px-4 py-4 text-xs font-medium text-slate-500">
                    {exp.date}
                  </td>

                  <td className="py-4 pl-4 pr-6 text-right font-extrabold text-slate-900">
                    ₹{exp.amount.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- Add Expense Modal ----------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Add Property Expense</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lift servicing or Electricity bill"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Property
                </label>
                <select
                  value={formData.propertyName}
                  onChange={(e) =>
                    setFormData({ ...formData, propertyName: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="Greenfield Heights">Greenfield Heights</option>
                  <option value="Lakeview Towers">Lakeview Towers</option>
                  <option value="Royal Palms">Royal Palms</option>
                  <option value="Silver Oak Enclave">Silver Oak Enclave</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as Expense["category"],
                    })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="Repairs">Repairs & Maintenance</option>
                  <option value="Utilities">Utilities (Electricity/Water)</option>
                  <option value="Salaries">Staff Salaries</option>
                  <option value="Taxes">Municipal Taxes</option>
                  <option value="Insurance">Insurance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="15000"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Payment Method
                </label>
                <select
                  value={formData.paidBy}
                  onChange={(e) =>
                    setFormData({ ...formData, paidBy: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700">
                  Save Expense
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
