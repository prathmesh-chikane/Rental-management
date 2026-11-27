"use client";

// =============================================================================
// app/(admin)/billing&Invoice/page.tsx - BILLING & INVOICES
//
// Backend-Connected & Production-Ready:
// - Connected to GET/POST/PATCH/DELETE /trishul/invoices (MongoDB API)
// - One-Click "Mark as Paid" functionality to record tenant payments
// - React Hook Form + Zod Validation
// - Dynamic dropdowns for Properties & Tenants
// - Real KPI metrics: Total Billed, Collected, Overdue
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import jsPDF from "jspdf";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Filter,
  IndianRupee,
  Loader2,
  Plus,
  Receipt,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { cleanProperty, type Property } from "../properties/property-utils";

// -----------------------------------------------------------------------------
// सुरक्षित लोकल तारीख हेल्पर्स (Prevents UTC timezone offset and hydration mismatch)
// -----------------------------------------------------------------------------
function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getFutureDateString(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// -----------------------------------------------------------------------------
// १. ZOD SCHEMA (बिलाच्या डेटाचे कडक व्हॅलिडेशन)
// -----------------------------------------------------------------------------
const invoiceSchema = z.object({
  tenantName: z.string().trim().min(3, "भाडेकरूचे नाव आवश्यक आहे (Tenant name required)"),
  propertyName: z.string().min(1, "प्रॉपर्टी निवडणे आवश्यक आहे (Select property)"),
  unit: z.string().trim().min(1, "फ्लॅट किंवा युनिट नंबर आवश्यक आहे (e.g. Flat 101)"),
  amount: z.number().positive("बिलाची रक्कम ₹० पेक्षा जास्त असावी (Amount > 0)"),
  dueDate: z.string().min(1, "शेवटची तारीख आवश्यक आहे (Due date required)"),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export type Invoice = {
  _id?: string;
  id?: string;
  invoiceNo: string;
  tenantName: string;
  propertyName: string;
  unit: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  status: "Paid" | "Unpaid" | "Overdue";
  notes?: string;
};

const INITIAL_FALLBACK_INVOICES: Invoice[] = [];

const LOCAL_STORAGE_KEY = "rental_management_actual_invoices";

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [properties, setProperties] = useState<string[]>([]);
  const [tenants, setTenants] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const saveToLocal = (list: Invoice[]) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      }
    } catch {
      // ignore
    }
  };

  // ---------------------------------------------------------------------------
  // डेटाबेस कडून बिलांचा डेटा आणणे (Load Invoices, Properties, Tenants)
  // ---------------------------------------------------------------------------
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    // १. Load Real Properties
    try {
      const pRes = await api.get<Property[] | { data: Property[] }>("/properties");
      const pList = Array.isArray(pRes) ? pRes : pRes.data ?? [];
      if (pList && pList.length > 0) {
        setProperties(pList.map((p) => p.name));
      }
    } catch {
      setProperties([]);
    }

    // २. Load Real Tenants
    try {
      const tRes = await api.get<Array<{ name: string }> | { data: Array<{ name: string }> }>("/tenants");
      const tList = Array.isArray(tRes) ? tRes : tRes.data ?? [];
      if (tList && tList.length > 0) {
        setTenants(tList.map((t) => t.name));
      }
    } catch {
      // ignore
    }

    // ३. Load Invoices
    let localData: Invoice[] = [];
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) localData = JSON.parse(stored);
      } catch {
        localData = [];
      }
    }

    try {
      const res = await api.get<Invoice[] | { data: Invoice[] }>("/invoices");
      const list = Array.isArray(res) ? res : res.data ?? [];
      if (list && list.length > 0) {
        setInvoices(list);
        saveToLocal(list);
      } else if (localData.length > 0) {
        setInvoices(localData);
      } else {
        setInvoices(INITIAL_FALLBACK_INVOICES);
        saveToLocal(INITIAL_FALLBACK_INVOICES);
      }
    } catch {
      if (localData.length > 0) {
        setInvoices(localData);
      } else {
        setInvoices(INITIAL_FALLBACK_INVOICES);
        saveToLocal(INITIAL_FALLBACK_INVOICES);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // REACT HOOK FORM सेटअप (Next.js 16 Safe: No new Date() in prerender body)
  // ---------------------------------------------------------------------------
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      tenantName: "",
      propertyName: "shree Heights",
      unit: "",
      amount: 40000,
      dueDate: "",
      notes: "Monthly Rent + Society Maintenance",
    },
  });

  useEffect(() => {
    loadData();
    setValue("dueDate", getFutureDateString(5));
  }, [loadData, setValue]);

  // ---------------------------------------------------------------------------
  // नवीन बिल तयार करणे (POST /trishul/invoices)
  // ---------------------------------------------------------------------------
  const onInvoiceSubmit = async (data: InvoiceFormValues) => {
    const payload = {
      tenantName: data.tenantName.trim(),
      propertyName: data.propertyName,
      unit: data.unit.trim(),
      amount: Number(data.amount),
      dueDate: data.dueDate,
      notes: data.notes || "",
      status: "Unpaid" as const,
    };

    try {
      const response = await api.post<Invoice | { data: Invoice }>("/invoices", payload);
      const created =
        response && "data" in response && response.data
          ? response.data
          : (response as Invoice);

      const newInv: Invoice = {
        _id: created?._id || `inv-${Date.now()}`,
        id: created?._id || `inv-${Date.now()}`,
        invoiceNo: created?.invoiceNo || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        issueDate: created?.issueDate || getTodayString(),
        ...payload,
      };

      const updated = [newInv, ...invoices];
      setInvoices(updated);
      saveToLocal(updated);
      reset();
      setIsModalOpen(false);
    } catch {
      // Offline fallback
      const newInv: Invoice = {
        id: `inv-${Date.now()}`,
        invoiceNo: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        issueDate: getTodayString(),
        ...payload,
      };
      const updated = [newInv, ...invoices];
      setInvoices(updated);
      saveToLocal(updated);
      reset();
      setIsModalOpen(false);
    }
  };

  // ---------------------------------------------------------------------------
  // एका क्लिकवर बिल "Paid" करणे (PATCH /trishul/invoices/:id/pay)
  // ---------------------------------------------------------------------------
  const handleMarkAsPaid = async (id: string, invNo: string) => {
    const paymentMethod = prompt(`Record payment for invoice ${invNo}.\nSelect Payment Method (UPI, Bank Transfer, Cash):`, "UPI") || "UPI";

    try {
      await api.patch(`/invoices/${id}/pay`, {
        paymentMethod,
        paidDate: getTodayString(),
      });
    } catch {
      // ignore
    }

    const updated = invoices.map((inv) => {
      if (inv._id === id || inv.id === id) {
        return {
          ...inv,
          status: "Paid" as const,
          paidDate: getTodayString(),
          paymentMethod,
        };
      }
      return inv;
    });

    setInvoices(updated);
    saveToLocal(updated);
  };


  const handleDownloadInvoice = (item: Invoice) => {
    type RGB = [number, number, number];

    const COMPANY = {
      name: "Brahmaastra",
      tagline: "Rental Management System",
      address: "vashi satra plaza 19D 10 ",
      phone: "+91 98765 43210",
      email: "billing@rentflow.in",
      website: "www.rentflow.in",
      gstin: "",
      paymentInstructions: [
        "Bank: Your Bank Name",
        " A/C: XXXXXXXXXXXX ",
        "IFSC: XXXX0000000",
        "UPI: rentflow@upi",
      ],
      terms:
        "Rent is due on or before the due date. Late payments may attract charges as per the lease agreement.",
    };

    const C = {
      ink: [15, 23, 42] as RGB,
      head: [30, 41, 59] as RGB,
      accent: [79, 70, 229] as RGB,
      muted: [100, 116, 139] as RGB,
      line: [226, 232, 240] as RGB,
      white: [255, 255, 255] as RGB,
    };

    const STATUS: Record<string, { label: string; color: RGB }> = {
      paid: { label: "PAID", color: [22, 163, 74] },
      unpaid: { label: "UNPAID", color: [217, 119, 6] },
      overdue: { label: "OVERDUE", color: [220, 38, 38] },
    };

    const formatMoney = (value: number) =>
      `Rs. ${value.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const formatDate = (value?: string) => {
      if (!value) return "-";
      const d = new Date(value);
      return isNaN(d.getTime())
        ? value
        : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 48; // page margin
    const R = W - M; // right edge

    const statusKey = String(item.status).toLowerCase();
    const status = STATUS[statusKey] ?? {
      label: String(item.status).toUpperCase(),
      color: C.muted,
    };
    const amount = Number(item.amount) || 0;
    const paid = statusKey === "paid" ? amount : 0;
    const balance = amount - paid;

    const setText = (color: RGB, size: number, style: "normal" | "bold" = "normal") => {
      doc.setTextColor(...color);
      doc.setFontSize(size);
      doc.setFont("helvetica", style);
    };

    // Top accent bar
    doc.setFillColor(...C.head);
    doc.rect(0, 0, W, 6, "F");

    // Company block (left)
    setText(C.ink, 20, "bold");
    doc.text(COMPANY.name, M, 70);
    setText(C.muted, 9);
    let y = 84;
    doc.text(COMPANY.tagline, M, y);
    y += 12;
    doc.text(COMPANY.address, M, y);
    y += 12;
    doc.text(`${COMPANY.phone}  |  ${COMPANY.email}`, M, y);
    y += 12;
    doc.text(COMPANY.website, M, y);
    if (COMPANY.gstin) {
      y += 12;
      doc.text(`GSTIN: ${COMPANY.gstin}`, M, y);
    }

    // Invoice title, number and status badge (right)
    setText(C.head, 26, "bold");
    doc.text("INVOICE", R, 66, { align: "right" });
    setText(C.muted, 9);
    doc.text(`No. ${item.invoiceNo}`, R, 82, { align: "right" });

    const badgeW = 84;
    doc.setFillColor(...status.color);
    doc.roundedRect(R - badgeW, 92, badgeW, 20, 3, 3, "F");
    setText(C.white, 9, "bold");
    doc.text(status.label, R - badgeW / 2, 105, { align: "center" });

    // Divider
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.8);
    doc.line(M, 130, R, 130);

    // Bill to (left) and invoice details (right)
    const colRight = R - 230;
    setText(C.accent, 8, "bold");
    doc.text("BILL TO", M, 152);
    setText(C.ink, 12, "bold");
    doc.text(String(item.tenantName), M, 170);
    setText(C.muted, 9);
    doc.text(`Property: ${item.propertyName}`, M, 185);
    doc.text(`Unit: ${item.unit}`, M, 199);

    setText(C.accent, 8, "bold");
    doc.text("INVOICE DETAILS", colRight, 152);
    const meta: [string, string][] = [
      ["Issue date", formatDate(item.issueDate)],
      ["Due date", formatDate(item.dueDate)],
      ["Paid date", item.paidDate ? formatDate(item.paidDate) : "-"],
      ["Payment method", item.paymentMethod || "Not recorded"],
    ];
    meta.forEach(([label, value], i) => {
      const metaY = 170 + i * 15;
      setText(C.muted, 9);
      doc.text(label, colRight, metaY);
      setText(C.ink, 9, "bold");
      doc.text(value, R, metaY, { align: "right" });
    });

    // Line items table
    const tableY = 240;
    doc.setFillColor(...C.head);
    doc.rect(M, tableY, R - M, 26, "F");
    setText(C.white, 9, "bold");
    doc.text("DESCRIPTION", M + 12, tableY + 17);
    doc.text("QTY", R - 170, tableY + 17, { align: "center" });
    doc.text("AMOUNT", R - 12, tableY + 17, { align: "right" });

    const rowY = tableY + 26;
    const noteLines = doc.splitTextToSize(item.notes || "", 300) as string[];
    const rowH = Math.max(50, 36 + noteLines.length * 12);
    doc.setDrawColor(...C.line);
    doc.line(M, rowY + rowH, R, rowY + rowH);

    setText(C.ink, 10, "bold");
    doc.text(`Rent - Unit ${item.unit}`, M + 12, rowY + 20);
    setText(C.muted, 9);
    doc.text(String(item.propertyName), M + 12, rowY + 34);
    if (noteLines.length) doc.text(noteLines, M + 12, rowY + 46);

    setText(C.ink, 10);
    doc.text("1", R - 170, rowY + 20, { align: "center" });
    setText(C.ink, 10, "bold");
    doc.text(formatMoney(amount), R - 12, rowY + 20, { align: "right" });

    // Totals (right)
    const labelX = R - 200;
    let ty = rowY + rowH + 18;
    const totalRow = (label: string, value: string) => {
      setText(C.muted, 9);
      doc.text(label, labelX, ty);
      setText(C.ink, 9, "bold");
      doc.text(value, R - 12, ty, { align: "right" });
      ty += 18;
    };
    totalRow("Subtotal", formatMoney(amount));
    totalRow("Amount paid", formatMoney(paid));

    const boxY = ty - 2;
    doc.setFillColor(...C.head);
    doc.roundedRect(labelX - 12, boxY, R - labelX + 12, 30, 3, 3, "F");
    setText(C.white, 10, "bold");
    doc.text(balance > 0 ? "BALANCE DUE" : "TOTAL PAID", labelX, boxY + 19);
    doc.text(formatMoney(balance > 0 ? balance : amount), R - 12, boxY + 19, {
      align: "right",
    });

    // Payment instructions (left, aligned with totals)
    setText(C.accent, 8, "bold");
    doc.text("PAYMENT INSTRUCTIONS", M, boxY);
    setText(C.muted, 9);
    COMPANY.paymentInstructions.forEach((line, i) => {
      doc.text(line, M, boxY + 16 + i * 12);
    });

    // Terms and footer
    const footerY = H - 64;
    doc.setDrawColor(...C.line);
    doc.line(M, footerY, R, footerY);

    setText(C.accent, 8, "bold");
    doc.text("TERMS", M, footerY + 16);
    setText(C.muted, 8);
    const termLines = doc.splitTextToSize(COMPANY.terms, R - M) as string[];
    doc.text(termLines, M, footerY + 28);

    setText(C.ink, 9, "bold");
    doc.text(`Thank you for choosing ${COMPANY.name}!`, W / 2, footerY + 46, { align: "center" });
    setText(C.muted, 7.5);
    doc.text(
      "This is a computer-generated invoice and does not require a signature.",
      W / 2,
      footerY + 57,
      { align: "center" }
    );

    doc.save(`${item.invoiceNo}.pdf`);
  };
  // ---------------------------------------------------------------------------
  // बिल डिलीट करणे (DELETE /trishul/invoices/:id)
  // ---------------------------------------------------------------------------
  const handleDeleteInvoice = async (id: string, invNo: string) => {
    if (!confirm(`Are you sure you want to delete invoice ${invNo}?`)) return;

    try {
      await api.delete(`/invoices/${id}`);
    } catch {
      // ignore
    }

    const updated = invoices.filter((inv) => inv._id !== id && inv.id !== id);
    setInvoices(updated);
    saveToLocal(updated);
  };

  // सर्च आणि स्टेटस फिल्टर
  const filtered = invoices.filter((item) => {
    const matchesSearch =
      item.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      item.propertyName.toLowerCase().includes(search.toLowerCase()) ||
      item.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      item.unit.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalBilled = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const totalPaid = invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const totalOverdue = invoices
    .filter((inv) => inv.status === "Overdue")
    .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-bold text-slate-600">Loading invoices from database...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4 sm:px-6 lg:px-8 font-sans">
      {/* ----------------- Header ----------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Billing & Invoices
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Track payments and dues
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="gap-2 border-slate-300 bg-white font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button
            onClick={() => {
              reset({
                tenantName: "",
                propertyName: properties[0] || "Greenfield Heights",
                unit: "",
                amount: 40000,
                dueDate: getFutureDateString(5),
                notes: "Monthly Rent + Society Maintenance",
              });
              setIsModalOpen(true);
            }}
            className="gap-2 bg-indigo-600 font-bold text-white shadow-md hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Generate Invoice
          </Button>
        </div>
      </div>

      {/* ----------------- KPI Cards ----------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Billed
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <ReceiptText className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            ₹{totalBilled.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-slate-500">Across {invoices.length} total invoices</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Collected
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-700">
            ₹{totalPaid.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-emerald-600 font-semibold">
            {invoices.filter((i) => i.status === "Paid").length} Invoices cleared
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Overdue / Pending
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-rose-700">
            ₹{totalOverdue.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-rose-600 font-semibold">
            {invoices.filter((i) => i.status === "Overdue").length} Overdue invoices
          </p>
        </div>
      </div>

      {/* ----------------- Filter & Search ----------------- */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice number, tenant, or property..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {["All", "Paid", "Unpaid", "Overdue"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${statusFilter === status
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ----------------- Invoices Table ----------------- */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Invoice No</th>
                <th className="px-6 py-4">Tenant</th>
                <th className="px-6 py-4">Property & Unit</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No invoices found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const id = item._id || item.id || item.invoiceNo;
                  return (
                    <tr key={id} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {item.invoiceNo}
                      </td>
                      <td className="px-6 py-4 text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                            {item.tenantName.charAt(0)}
                          </div>
                          <span className="font-semibold">{item.tenantName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-800">{item.propertyName}</p>
                          <p className="text-xs text-slate-400 font-bold">{item.unit}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        ₹{Number(item.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                        {item.dueDate}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${item.status === "Paid"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : item.status === "Overdue"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status !== "Paid" && (
                            <button
                              title="Record Payment (Mark as Paid)"
                              onClick={() => handleMarkAsPaid(id, item.invoiceNo)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                            >
                              <CreditCard className="h-3.5 w-3.5" /> Mark Paid
                            </button>
                          )}
                          <button
                            type="button"
                            title="Download Invoice"
                            onClick={() => handleDownloadInvoice(item)}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            title="Delete Invoice"
                            onClick={() => handleDeleteInvoice(id, item.invoiceNo)}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- GENERATE INVOICE MODAL (React Hook Form) ----------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>

                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  Generate Rent Invoice
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onInvoiceSubmit)} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Tenant Full Name *
                </label>
                {tenants.length > 0 ? (
                  <select
                    {...register("tenantName")}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Select an existing tenant</option>
                    {tenants.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Vikram Joshi"
                    {...register("tenantName")}
                    className={`mt-1.5 h-10 w-full rounded-xl border bg-white px-3.5 text-sm font-medium outline-none transition-all ${errors.tenantName
                      ? "border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-100"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      }`}
                  />
                )}
                {errors.tenantName && (
                  <p className="mt-1 text-xs font-semibold text-red-600">
                    {errors.tenantName.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Property *
                  </label>
                  <select
                    {...register("propertyName")}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  >
                    {properties.map((propName) => (
                      <option key={propName} value={propName}>
                        {propName}
                      </option>
                    ))}
                  </select>
                  {errors.propertyName && (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      {errors.propertyName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Unit / Flat No *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flat 204"
                    {...register("unit")}
                    className={`mt-1.5 h-10 w-full rounded-xl border bg-white px-3.5 text-sm font-medium outline-none transition-all ${errors.unit
                      ? "border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-100"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      }`}
                  />
                  {errors.unit && (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      {errors.unit.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Invoice Amount (₹) *
                  </label>
                  <input
                    type="number"
                    placeholder="42000"
                    {...register("amount", { valueAsNumber: true })}
                    className={`mt-1.5 h-10 w-full rounded-xl border px-3.5 text-sm font-medium outline-none transition-all ${errors.amount
                      ? "border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-100"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      }`}
                  />
                  {errors.amount && (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      {errors.amount.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    {...register("dueDate")}
                    className={`mt-1.5 h-10 w-full rounded-xl border px-3 text-sm font-medium outline-none transition-all ${errors.dueDate
                      ? "border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-100"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      }`}
                  />
                  {errors.dueDate && (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      {errors.dueDate.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Notes / Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly rent plus maintenance"
                  {...register("notes")}
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-medium outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-indigo-600 font-bold text-white shadow-md hover:bg-indigo-700"
                >
                  {isSubmitting ? "Generating..." : "Generate Invoice"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
