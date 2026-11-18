"use client";

// =============================================================================
// app/(admin)/rent-payments/page.tsx - RENT & PAYMENTS
//
// Beginner-friendly code:
// - Track rent collection, pending dues, and overdue amounts
// - "Record Payment" modal with instant update
// - Status filters: All, Paid, Pending, Overdue
// =============================================================================

import { useState } from "react";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Download,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Payment = {
  id: string;
  receiptNo: string;
  tenantName: string;
  propertyName: string;
  unit: string;
  amount: number;
  paymentMethod: string;
  date: string;
  status: "Paid" | "Pending" | "Overdue";
};

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: "p-1",
    receiptNo: "REC-2026-001",
    tenantName: "Vikram Joshi",
    propertyName: "Greenfield Heights",
    unit: "Flat 204",
    amount: 42000,
    paymentMethod: "UPI (Google Pay)",
    date: "16 Nov 2026",
    status: "Paid",
  },
  {
    id: "p-2",
    receiptNo: "REC-2026-002",
    tenantName: "Neha Kapoor",
    propertyName: "Royal Palms",
    unit: "Villa 02",
    amount: 85000,
    paymentMethod: "Bank Transfer (NEFT)",
    date: "15 Nov 2026",
    status: "Paid",
  },
  {
    id: "p-3",
    receiptNo: "REC-2026-003",
    tenantName: "Arjun Mehta",
    propertyName: "Silver Oak Enclave",
    unit: "Studio 105",
    amount: 18500,
    paymentMethod: "Cheque (#40129)",
    date: "14 Nov 2026",
    status: "Pending",
  },
  {
    id: "p-4",
    receiptNo: "REC-2026-004",
    tenantName: "Priya Nair",
    propertyName: "Greenfield Heights",
    unit: "Flat 310",
    amount: 38000,
    paymentMethod: "UPI",
    date: "13 Nov 2026",
    status: "Paid",
  },
  {
    id: "p-5",
    receiptNo: "REC-2026-005",
    tenantName: "Sunita Verma",
    propertyName: "Greenfield Heights",
    unit: "Flat 101",
    amount: 18000,
    paymentMethod: "Pending",
    date: "04 Nov 2026",
    status: "Overdue",
  },
  {
    id: "p-6",
    receiptNo: "REC-2026-006",
    tenantName: "Imran Sheikh",
    propertyName: "Lakeview Towers",
    unit: "Flat 806",
    amount: 52000,
    paymentMethod: "Pending",
    date: "11 Nov 2026",
    status: "Overdue",
  },
];

export default function RentPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Payment Form
  const [formData, setFormData] = useState({
    tenantName: "",
    propertyName: "Greenfield Heights",
    unit: "",
    amount: "",
    paymentMethod: "UPI",
  });

  const filtered = payments.filter((item) => {
    const matchesSearch =
      item.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      item.propertyName.toLowerCase().includes(search.toLowerCase()) ||
      item.receiptNo.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalCollected = payments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOverdue = payments
    .filter((p) => p.status === "Overdue")
    .reduce((sum, p) => sum + p.amount, 0);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenantName || !formData.amount) return;

    const newPayment: Payment = {
      id: `p-${Date.now()}`,
      receiptNo: `REC-2026-0${Math.floor(10 + Math.random() * 90)}`,
      tenantName: formData.tenantName,
      propertyName: formData.propertyName,
      unit: formData.unit || "Flat 101",
      amount: Number(formData.amount),
      paymentMethod: formData.paymentMethod,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: "Paid",
    };

    setPayments([newPayment, ...payments]);
    setFormData({
      tenantName: "",
      propertyName: "Greenfield Heights",
      unit: "",
      amount: "",
      paymentMethod: "UPI",
    });
    setIsModalOpen(false);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      {/* ----------------- Header ----------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Rent & Payments
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Track transactions, collections, and overdue dues
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="gap-2 bg-indigo-600 font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Record Payment
        </Button>
      </div>

      {/* ----------------- Stats ----------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Collected
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            ₹{totalCollected.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-slate-500">Recorded for this period</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Overdue
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
              <AlertCircle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-rose-600">
            ₹{totalOverdue.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-rose-500">Requires follow-up</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Transactions
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <Banknote className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {payments.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Payment receipts logged</p>
        </div>
      </div>

      {/* ----------------- Filter Bar ----------------- */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tenant name, property, or receipt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="All">All Transactions</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* ----------------- Payments Table ----------------- */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 pl-6 pr-4">Receipt & Tenant</th>
                <th className="px-4 py-3.5">Property</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Method</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="py-3.5 pl-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 pl-6 pr-4">
                    <p className="font-mono text-xs font-bold text-slate-400">
                      {item.receiptNo}
                    </p>
                    <p className="mt-0.5 font-bold text-slate-900">{item.tenantName}</p>
                    <p className="text-xs text-slate-400">{item.unit}</p>
                  </td>

                  <td className="px-4 py-4 font-medium text-slate-700">
                    {item.propertyName}
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-extrabold text-slate-900">
                      ₹{item.amount.toLocaleString("en-IN")}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-xs font-medium text-slate-600">
                    {item.paymentMethod}
                  </td>

                  <td className="px-4 py-4 text-xs font-medium text-slate-500">
                    {item.date}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        item.status === "Paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : item.status === "Pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="py-4 pl-4 pr-6 text-right">
                    <button
                      type="button"
                      title="Download receipt"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                    >
                      <Download className="h-3.5 w-3.5" /> Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- Record Payment Modal ----------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Record Payment</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Tenant Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Joshi"
                  value={formData.tenantName}
                  onChange={(e) =>
                    setFormData({ ...formData, tenantName: e.target.value })
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
                  Unit / Flat
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 204"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="42000"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Payment Mode
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethod: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
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
                  Save Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
