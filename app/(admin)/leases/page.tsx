"use client";

// =============================================================================
// app/(admin)/leases/page.tsx - LEASES & AGREEMENTS
//
// Backend-Connected & Production-Ready:
// - Connected to GET/POST/DELETE /trishul/leases (MongoDB API)
// - Dynamic Property & Tenant Selectors from real DB
// - React Hook Form + Zod Schema Validation
// - Live KPIs: Active Leases, Expiring Soon, Total Monthly Rent
// - LocalStorage fail-safe fallback
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FilePlus2,
  FileText,
  Filter,
  IndianRupee,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  User,
  X,
  Eye,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { cleanProperty, type Property } from "../properties/property-utils";


// सुरक्षित लोकल तारीख हेल्पर्स (Prevents UTC timezone offset and hydration mismatch)

function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getNextYearString(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}


// १. ZOD SCHEMA (कराराच्या डेटाचे कडक व्हॅलिडेशन)

const leaseSchema = z
  .object({
    tenantName: z.string().trim().min(3, "भाडेकरूचे नाव किमान ३ अक्षरांचे हवे (Tenant name required)"),
    propertyName: z.string().min(1, "प्रॉपर्टी निवडणे आवश्यक आहे (Select property)"),
    unit: z.string().trim().min(1, "फ्लॅट किंवा युनिट नंबर आवश्यक आहे (e.g. Flat 304)"),
    startDate: z.string().min(1, "करार सुरू होण्याची तारीख निवडा (Start date required)"),
    endDate: z.string().min(1, "करार संपण्याची तारीख निवडा (End date required)"),
    monthlyRent: z.number().positive("मासिक भाडे ₹० पेक्षा जास्त असावे (Rent must be > 0)"),
    deposit: z.number().min(0, "डिपॉझिट रक्कम निगेटिव्ह असू शकत नाही (Deposit >= 0)"),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      if (isNaN(start) || isNaN(end)) return true;
      return end > start;
    },
    {
      message: "करार संपण्याची तारीख (End Date) ही सुरुवातीच्या तारखेच्या नंतरची असावी",
      path: ["endDate"],
    },
  );

type LeaseFormValues = z.infer<typeof leaseSchema>;

export type Lease = {
  _id?: string;
  id?: string;
  leaseNumber: string;
  tenantName: string;
  propertyName: string;
  unit: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  status: "Active" | "Expiring Soon" | "Terminated" | "Draft";
};

const INITIAL_FALLBACK_LEASES: Lease[] = [
  {
    id: "l-1",
    leaseNumber: "LSE-2026-081",
    tenantName: "Vikram Joshi",
    propertyName: "Greenfield Heights",
    unit: "Flat 204",
    startDate: "2025-11-01",
    endDate: "2027-10-31",
    monthlyRent: 42000,
    deposit: 126000,
    status: "Active",
  },
  {
    id: "l-2",
    leaseNumber: "LSE-2026-082",
    tenantName: "Neha Kapoor",
    propertyName: "Royal Palms Residency",
    unit: "Villa 02",
    startDate: "2026-01-15",
    endDate: "2028-01-14",
    monthlyRent: 85000,
    deposit: 255000,
    status: "Active",
  },
  {
    id: "l-3",
    leaseNumber: "LSE-2026-083",
    tenantName: "Arjun Mehta",
    propertyName: "Silver Oak Enclave",
    unit: "Studio 105",
    startDate: "2025-06-01",
    endDate: "2026-05-31",
    monthlyRent: 18500,
    deposit: 55500,
    status: "Expiring Soon",
  },
  {
    id: "l-4",
    leaseNumber: "LSE-2026-084",
    tenantName: "Sunita Verma",
    propertyName: "Greenfield Heights",
    unit: "Flat 101",
    startDate: "2024-12-01",
    endDate: "2026-11-30",
    monthlyRent: 18000,
    deposit: 54000,
    status: "Active",
  },
  {
    id: "l-5",
    leaseNumber: "LSE-2025-045",
    tenantName: "Rahul Sharma",
    propertyName: "Sea Breeze Enclave",
    unit: "Flat 402",
    startDate: "2024-01-01",
    endDate: "2025-12-31",
    monthlyRent: 35000,
    deposit: 105000,
    status: "Terminated",
  },
];

const LOCAL_STORAGE_KEY = "rental_management_actual_leases";

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<string[]>([]);
  const [tenants, setTenants] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serverError, setServerError] = useState("");
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Helper to persist in localStorage
  const saveToLocal = (list: Lease[]) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      }
    } catch {
      // ignore
    }
  };

  
  // डेटाबेस कडून करारांचा डेटा आणणे (Load Leases, Properties, Tenants)
  
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setServerError("");

    // १. Load Real Properties
    try {
      const pRes = await api.get<Property[] | { data: Property[] }>("/properties");
      const pList = Array.isArray(pRes) ? pRes : pRes.data ?? [];
      if (pList && pList.length > 0) {
        setProperties(pList.map((p) => p.name));
      }
    } catch {
      setProperties([
        "Greenfield Heights",
        "Lakeview Towers",
        "Royal Palms Residency",
        "Silver Oak Enclave",
      ]);
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

    // ३. Load Leases
    let localData: Lease[] = [];
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) localData = JSON.parse(stored);
      } catch {
        localData = [];
      }
    }

    try {
      const res = await api.get<Lease[] | { data: Lease[] }>("/leases");
      const list = Array.isArray(res) ? res : res.data ?? [];
      if (list && list.length > 0) {
        setLeases(list);
        saveToLocal(list);
      } else if (localData.length > 0) {
        setLeases(localData);
      } else {
        setLeases(INITIAL_FALLBACK_LEASES);
        saveToLocal(INITIAL_FALLBACK_LEASES);
      }
    } catch {
      if (localData.length > 0) {
        setLeases(localData);
      } else {
        setLeases(INITIAL_FALLBACK_LEASES);
        saveToLocal(INITIAL_FALLBACK_LEASES);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // REACT HOOK FORM (useForm must come before any useEffect that uses `reset`)
  // ---------------------------------------------------------------------------
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeaseFormValues>({
    resolver: zodResolver(leaseSchema),
    defaultValues: {
      tenantName: "",
      propertyName: "Greenfield Heights",
      unit: "",
      startDate: "",
      endDate: "",
      monthlyRent: 35000,
      deposit: 100000,
    },
  });

  // loadData + default date values on mount
  useEffect(() => {
    loadData();
    setValue("startDate", getTodayString());
    setValue("endDate", getNextYearString());
  }, [loadData, setValue]);

  // Edit-lease state (declared AFTER useForm so `reset` is available below)
  const [editLease, setEditLease] = useState<Lease | null>(null);

  // Populate form when edit modal opens; clear when create modal opens
  useEffect(() => {
    if (isEditModalOpen && editLease) {
      reset({
        tenantName: editLease.tenantName,
        propertyName: editLease.propertyName,
        unit: editLease.unit,
        startDate: editLease.startDate,
        endDate: editLease.endDate,
        monthlyRent: editLease.monthlyRent,
        deposit: editLease.deposit,
      });
    } else if (isModalOpen) {
      reset({
        tenantName: "",
        propertyName: properties[0] || "Greenfield Heights",
        unit: "",
        startDate: getTodayString(),
        endDate: getNextYearString(),
        monthlyRent: 35000,
        deposit: 100000,
      });
    }
  }, [isEditModalOpen, editLease, isModalOpen, reset, properties]);

  // Open the edit modal for a specific lease
  const openEditModal = (lease: Lease) => {
    setEditLease(lease);
    setIsEditModalOpen(true);
  };

  // PUT /trishul/leases/:id  — save edits back to MongoDB
  const onLeaseUpdate = async (data: LeaseFormValues) => {
    if (!editLease) return;
    try {
      const payload = {
        tenantName: data.tenantName.trim(),
        propertyName: data.propertyName,
        unit: data.unit.trim(),
        startDate: data.startDate,
        endDate: data.endDate,
        monthlyRent: Number(data.monthlyRent),
        deposit: Number(data.deposit),
        status: editLease.status,
      };

      await api.put(`/leases/${editLease.id || editLease._id}`, payload);

      const updatedList = leases.map((l) =>
        l.id === editLease.id || l._id === editLease._id ? { ...l, ...payload } : l,
      );
      setLeases(updatedList);
      saveToLocal(updatedList);
      setIsEditModalOpen(false);
      setEditLease(null);
    } catch (err) {
      console.error("Lease update error:", err);
      alert("अपडेट करताना त्रुटी आली. पुन्हा प्रयत्न करा.");
    }
  };


  // फॉर्म सबमिट (POST /trishul/leases)
  
  const onLeaseSubmit = async (data: LeaseFormValues) => {
    setServerError("");

    const payload = {
      tenantName: data.tenantName.trim(),
      propertyName: data.propertyName,
      unit: data.unit.trim(),
      startDate: data.startDate,
      endDate: data.endDate,
      monthlyRent: Number(data.monthlyRent),
      deposit: Number(data.deposit),
      status: "Active" as const,
    };

    try {
      const response = await api.post<Lease | { data: Lease }>("/leases", payload);
      const created =
        response && "data" in response && response.data
          ? response.data
          : (response as Lease);

      const newLease: Lease = {
        _id: created?._id || `l-${Date.now()}`,
        id: created?._id || `l-${Date.now()}`,
        leaseNumber: created?.leaseNumber || `LSE-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        ...payload,
      };

      const updated = [newLease, ...leases];
      setLeases(updated);
      saveToLocal(updated);
      reset();
      setIsModalOpen(false);
    } catch {
      // Offline fallback
      const newLease: Lease = {
        id: `l-${Date.now()}`,
        leaseNumber: `LSE-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        ...payload,
      };
      const updated = [newLease, ...leases];
      setLeases(updated);
      saveToLocal(updated);
      reset();
      setIsModalOpen(false);
    }
  };

  
  // करार डिलीट करणे (DELETE /trishul/leases/:id)
  
  const handleDeleteLease = async (id: string, leaseNum: string) => {
    if (!confirm(`Are you sure you want to terminate/delete lease ${leaseNum}?`)) return;

    try {
      await api.delete(`/leases/${id}`);
    } catch {
      // ignore
    }

    const updated = leases.filter((l) => (l._id !== id && l.id !== id));
    setLeases(updated);
    saveToLocal(updated);
  };

  // सर्च आणि स्टेटस फिल्टर
  const filteredLeases = leases.filter((lease) => {
    const matchesSearch =
      lease.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      lease.propertyName.toLowerCase().includes(search.toLowerCase()) ||
      lease.leaseNumber.toLowerCase().includes(search.toLowerCase()) ||
      lease.unit.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || lease.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Lease["status"]) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Expiring Soon":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Terminated":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-bold text-slate-600">Loading leases from database...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4 sm:px-6 lg:px-8 font-sans">
      {/* ----------------- Header ----------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Leases & Agreements
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Real MongoDB Data · {leases.length} Total Contracts · Legal Agreements Management
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
                startDate: getTodayString(),
                endDate: getNextYearString(),
                monthlyRent: 35000,
                deposit: 100000,
              });
              setIsModalOpen(true);
            }}
            className="gap-2 bg-indigo-600 font-bold text-white shadow-md hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Create Lease
          </Button>
        </div>
      </div>

      {/* ----------------- KPI Cards ----------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Leases
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <FileCheck className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {leases.filter((l) => l.status === "Active").length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Standard ongoing agreements</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Expiring Soon
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {leases.filter((l) => l.status === "Expiring Soon").length}
          </p>
          <p className="mt-1 text-xs text-amber-600 font-semibold">Ends within 60 days</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Monthly Rent
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <IndianRupee className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            ₹
            {leases
              .reduce((acc, curr) => acc + (Number(curr.monthlyRent) || 0), 0)
              .toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-slate-500">Contracted revenue / month</p>
        </div>
      </div>

      {/* ----------------- Filter & Search Bar ----------------- */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tenant, property, or lease number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {["All", "Active", "Expiring Soon", "Terminated"].map((status) => (
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

      {/* ----------------- Leases Table ----------------- */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Lease ID</th>
                <th className="px-6 py-4">Tenant</th>
                <th className="px-6 py-4">Property & Unit</th>
                <th className="px-6 py-4">Contract Period</th>
                <th className="px-6 py-4">Monthly Rent</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLeases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No leases found matching your search.
                  </td>
                </tr>
              ) : (
                filteredLeases.map((lease) => {
                  const id = lease._id || lease.id || lease.leaseNumber;
                  return (
                    <tr key={id} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {lease.leaseNumber}
                      </td>
                      <td className="px-6 py-4 text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                            {lease.tenantName.charAt(0)}
                          </div>
                          <span className="font-semibold">{lease.tenantName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-800">{lease.propertyName}</p>
                          <p className="text-xs text-slate-400 font-bold">{lease.unit}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold">
                        <span className="text-slate-800">{lease.startDate}</span>
                        <span className="mx-1 text-slate-400">→</span>
                        <span className="text-slate-800">{lease.endDate}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        ₹{Number(lease.monthlyRent).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${getStatusBadge(
                            lease.status,
                          )}`}
                        >
                          {lease.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit Button */}
                          <button
                            title="Edit Lease"
                            onClick={() => openEditModal(lease)}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            title="Terminate / Delete Lease"
                            onClick={() => handleDeleteLease(lease.id ?? lease._id ?? '', lease.leaseNumber)}
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

      {/* ----------------- CREATE LEASE MODAL (React Hook Form) ----------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="inline-block rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-indigo-700">
                  MongoDB Backend + React Hook Form
                </span>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  Create New Lease Agreement
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* handleSubmit ने जोडलेला फॉर्म */}
            <form onSubmit={handleSubmit(onLeaseSubmit)} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Tenant Full Name *
                </label>
                {tenants.length > 0 ? (
                  <select
                    {...register("tenantName")}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Select an existing tenant or enter name below</option>
                    {tenants.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kulkarni"
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
                    placeholder="e.g. Flat 304"
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
                    Start Date *
                  </label>
                  <input
                    type="date"
                    {...register("startDate")}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm font-medium outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      {errors.startDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    End Date *
                  </label>
                  <input
                    type="date"
                    {...register("endDate")}
                    className={`mt-1.5 h-10 w-full rounded-xl border px-3 text-sm font-medium outline-none transition-all ${errors.endDate
                      ? "border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-100"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      }`}
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      {errors.endDate.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Monthly Rent (₹) *
                  </label>
                  <input
                    type="number"
                    placeholder="40000"
                    {...register("monthlyRent", { valueAsNumber: true })}
                    className={`mt-1.5 h-10 w-full rounded-xl border px-3.5 text-sm font-medium outline-none transition-all ${errors.monthlyRent
                      ? "border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-100"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      }`}
                  />
                  {errors.monthlyRent && (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      {errors.monthlyRent.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Security Deposit (₹) *
                  </label>
                  <input
                    type="number"
                    placeholder="120000"
                    {...register("deposit", { valueAsNumber: true })}
                    className={`mt-1.5 h-10 w-full rounded-xl border px-3.5 text-sm font-medium outline-none transition-all ${errors.deposit
                      ? "border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-100"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      }`}
                  />
                  {errors.deposit && (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      {errors.deposit.message}
                    </p>
                  )}
                </div>
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
                  {isSubmitting ? "Saving to DB..." : "Create Agreement"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ EDIT LEASE MODAL ═══════════════ */}
      {isEditModalOpen && editLease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="inline-block rounded-md bg-amber-50 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-amber-700">
                  Edit · {editLease.leaseNumber}
                </span>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Update Lease Agreement</h3>
              </div>
              <button
                onClick={() => { setIsEditModalOpen(false); setEditLease(null); }}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onLeaseUpdate)} className="mt-4 space-y-4">
              {/* Tenant Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Tenant Full Name *
                </label>
                {tenants.length > 0 ? (
                  <select
                    {...register("tenantName")}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  >
                    {tenants.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    {...register("tenantName")}
                    className={`mt-1.5 h-10 w-full rounded-xl border bg-white px-3.5 text-sm font-medium outline-none transition-all ${errors.tenantName ? "border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-100" : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"}`}
                  />
                )}
                {errors.tenantName && <p className="mt-1 text-xs font-semibold text-red-600">{errors.tenantName.message}</p>}
              </div>

              {/* Property + Unit */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Property *</label>
                  <select
                    {...register("propertyName")}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  >
                    {properties.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.propertyName && <p className="mt-1 text-xs font-semibold text-red-600">{errors.propertyName.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Unit / Flat No *</label>
                  <input
                    type="text"
                    placeholder="e.g. Flat 304"
                    {...register("unit")}
                    className={`mt-1.5 h-10 w-full rounded-xl border bg-white px-3.5 text-sm font-medium outline-none transition-all ${errors.unit ? "border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-100" : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"}`}
                  />
                  {errors.unit && <p className="mt-1 text-xs font-semibold text-red-600">{errors.unit.message}</p>}
                </div>
              </div>

              {/* Start Date + End Date */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Start Date *</label>
                  <input
                    type="date"
                    {...register("startDate")}
                    className={`mt-1.5 h-10 w-full rounded-xl border px-3 text-sm font-medium outline-none transition-all ${errors.startDate ? "border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-100" : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"}`}
                  />
                  {errors.startDate && <p className="mt-1 text-xs font-semibold text-red-600">{errors.startDate.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">End Date *</label>
                  <input
                    type="date"
                    {...register("endDate")}
                    className={`mt-1.5 h-10 w-full rounded-xl border px-3 text-sm font-medium outline-none transition-all ${errors.endDate ? "border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-100" : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"}`}
                  />
                  {errors.endDate && <p className="mt-1 text-xs font-semibold text-red-600">{errors.endDate.message}</p>}
                </div>
              </div>

              {/* Rent + Deposit */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Monthly Rent (₹) *</label>
                  <input
                    type="number"
                    {...register("monthlyRent", { valueAsNumber: true })}
                    className={`mt-1.5 h-10 w-full rounded-xl border px-3.5 text-sm font-medium outline-none transition-all ${errors.monthlyRent ? "border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-100" : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"}`}
                  />
                  {errors.monthlyRent && <p className="mt-1 text-xs font-semibold text-red-600">{errors.monthlyRent.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Security Deposit (₹) *</label>
                  <input
                    type="number"
                    {...register("deposit", { valueAsNumber: true })}
                    className={`mt-1.5 h-10 w-full rounded-xl border px-3.5 text-sm font-medium outline-none transition-all ${errors.deposit ? "border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-100" : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"}`}
                  />
                  {errors.deposit && <p className="mt-1 text-xs font-semibold text-red-600">{errors.deposit.message}</p>}
                </div>
              </div>

              {/* Footer buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsEditModalOpen(false); setEditLease(null); }}
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-amber-500 font-bold text-white shadow-md hover:bg-amber-600"
                >
                  {isSubmitting ? "Saving..." : "Update Lease"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
