"use client";

// =============================================================================
// app/(admin)/leases/page.tsx — LEASES & AGREEMENTS (करार व्यवस्थापन)
//
// हे पेज काय करते:
// - GET    /leases            → सर्व करार आणते
// - POST   /leases            → नवीन करार तयार करते
// - PUT    /leases/:id        → करार अपडेट करते
// - DELETE /leases/:id        → करार डिलीट करते
// - Properties, Tenants आणि Units डेटाबेसमधून आणून dropdown मध्ये दाखवते
// - React Hook Form + Zod ने फॉर्म व्हॅलिडेशन
// - Status (Active / Expiring Soon / Expired) End Date वरून आपोआप ठरतो
// - सर्व्हर बंद असेल तर localStorage मधला शेवटचा डेटा दाखवतो (फक्त वाचण्यासाठी)
// =============================================================================

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  Clock,
  FileCheck,
  IndianRupee,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import type { Property } from "../properties/property-utils";

// =============================================================================
// १. TYPES (डेटाचे प्रकार)
// =============================================================================

type LeaseStatus = "Active" | "Expiring Soon" | "Expired";

export type Lease = {
  _id?: string;
  id?: string;
  leaseNumber: string;
  tenantName: string;
  propertyName: string;
  unit: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  monthlyRent: number;
  deposit: number;
  status: LeaseStatus;
};

type UnitOption = {
  unitNumber: string;
  wing: string;
  type: string;
  status: string; // "vacant" | "occupied" ...
};

// API कधी थेट array देते, तर कधी { data: [...] } देते — दोन्ही चालतील
type ListResponse<T> = T[] | { data?: T[] };

type FormMode = "create" | "edit" | null;

const STATUS_FILTERS = ["All", "Active", "Expiring Soon", "Expired"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

// =============================================================================
// २. CONSTANTS (स्थिर मूल्ये)
// =============================================================================

const LOCAL_STORAGE_KEY = "rental_management_actual_leases";
const EXPIRING_SOON_DAYS = 30; // 3० दिवसांत संपणारा करार = "Expiring Soon"

const STATUS_BADGE_CLASS: Record<LeaseStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Expiring Soon": "bg-amber-50 text-amber-700 border-amber-200",
  Expired: "bg-slate-100 text-slate-600 border-slate-200",
};

// =============================================================================
// ३. HELPER FUNCTIONS (छोटी मदतनीस functions)
// =============================================================================

// Date → "YYYY-MM-DD" (लोकल वेळेनुसार, UTC गोंधळ टाळण्यासाठी)
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTodayString(): string {
  return formatDate(new Date());
}

function getNextYearString(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return formatDate(date);
}

// सर्व्हरकडून "2025-11-01T00:00:00.000Z" आले तरी date input साठी "2025-11-01" करतो
function toDateInput(value?: string): string {
  return (value ?? "").slice(0, 10);
}

// _id किंवा id — जे असेल ते string म्हणून परत देतो
function getRecordId(record: unknown): string {
  const r = record as { _id?: unknown; id?: unknown } | null | undefined;
  return String(r?._id ?? r?.id ?? "");
}

// API response मधून array काढतो
function toList<T>(response: ListResponse<T>): T[] {
  return Array.isArray(response) ? response : response?.data ?? [];
}

// End Date वरून करार Active / Expiring Soon / Expired आहे ते ठरवतो
// ("YYYY-MM-DD" strings थेट compare करता येतात)
function getLeaseStatus(endDate: string): LeaseStatus {
  const end = toDateInput(endDate);
  if (end < getTodayString()) return "Expired";

  const limit = new Date();
  limit.setDate(limit.getDate() + EXPIRING_SOON_DAYS);
  if (end <= formatDate(limit)) return "Expiring Soon";

  return "Active";
}

// सर्व्हरचा करार साफ करून वापरण्यायोग्य बनवतो
function normalizeLease(raw: Lease): Lease {
  const endDate = toDateInput(raw.endDate);
  return {
    ...raw,
    startDate: toDateInput(raw.startDate),
    endDate,
    monthlyRent: Number(raw.monthlyRent) || 0,
    deposit: Number(raw.deposit) || 0,
    status: getLeaseStatus(endDate),
  };
}

// सर्व्हरचा unit साफ करतो
function normalizeUnit(raw: Record<string, unknown>): UnitOption {
  return {
    unitNumber: String(raw.unitNumber ?? raw.unit ?? ""),
    wing: String(raw.wing ?? ""),
    type: String(raw.type ?? ""),
    status: String(raw.status ?? "").toLowerCase(),
  };
}

// localStorage मध्ये सेव्ह / वाचणे (सर्व्हर बंद असताना दाखवण्यासाठी)
function writeCache(list: Lease[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage भरले असेल / बंद असेल तर दुर्लक्ष करा
  }
}

function readCache(): Lease[] {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Lease[]) : [];
  } catch {
    return [];
  }
}

// इनपुटचा CSS — error असेल तर लाल border
function inputClass(hasError: boolean): string {
  const base =
    "mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm font-medium outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400";
  return hasError
    ? `${base} border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-100`
    : `${base} border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100`;
}

// रिकामा इनपुट → 0, नाहीतर number (NaN टाळण्यासाठी)
const toNumber = (value: unknown) => (value === "" || value == null ? 0 : Number(value));

// =============================================================================
// ४. ZOD SCHEMA (फॉर्म व्हॅलिडेशन)
// =============================================================================

const leaseSchema = z
  .object({
    tenantName: z.string().trim().min(3, "भाडेकरूचे नाव किमान ३ अक्षरांचे हवे (Tenant name required)"),
    propertyName: z.string().min(1, "प्रॉपर्टी निवडणे आवश्यक आहे (Select property)"),
    unit: z.string().trim().min(1, "फ्लॅट किंवा युनिट नंबर आवश्यक आहे (Select unit)"),
    startDate: z.string().min(1, "करार सुरू होण्याची तारीख निवडा (Start date required)"),
    endDate: z.string().min(1, "करार संपण्याची तारीख निवडा (End date required)"),
    monthlyRent: z.number().positive("मासिक भाडे ₹० पेक्षा जास्त असावे (Rent must be > 0)"),
    deposit: z.number().min(0, "डिपॉझिट रक्कम निगेटिव्ह असू शकत नाही (Deposit >= 0)"),
  })
  .refine((data) => !data.startDate || !data.endDate || data.endDate > data.startDate, {
    message: "करार संपण्याची तारीख (End Date) ही सुरुवातीच्या तारखेच्या नंतरची असावी",
    path: ["endDate"],
  });

type LeaseFormValues = z.infer<typeof leaseSchema>;

// सुरुवातीचा रिकामा फॉर्म (तारखा नाहीत — म्हणून render दरम्यान new Date() लागत नाही)
const BLANK_FORM_VALUES: LeaseFormValues = {
  tenantName: "",
  propertyName: "",
  unit: "",
  startDate: "",
  endDate: "",
  monthlyRent: 35000,
  deposit: 100000,
};

// नवीन करारासाठी फॉर्म (आजची तारीख + १ वर्ष) — फक्त बटण क्लिकवर वापरा
function getEmptyFormValues(propertyName = ""): LeaseFormValues {
  return {
    tenantName: "",
    propertyName,
    unit: "",
    startDate: getTodayString(),
    endDate: getNextYearString(),
    monthlyRent: 35000,
    deposit: 100000,
  };
}

// =============================================================================
// ५. छोटे UI COMPONENTS
// =============================================================================

function KpiCard({
  label,
  value,
  hint,
  icon,
  iconClass,
  hintClass = "text-slate-500",
}: {
  label: string;
  value: ReactNode;
  hint: string;
  icon: ReactNode;
  iconClass: string;
  hintClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
      <p className={`mt-1 text-xs font-semibold ${hintClass}`}>{hint}</p>
    </div>
  );
}

// Label + input + error message एकत्र
function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}

// =============================================================================
// ६. MAIN PAGE
// =============================================================================

export default function LeasesPage() {
  // ---------- डेटा ----------
  const [leases, setLeases] = useState<Lease[]>([]);
  const [propertyRecords, setPropertyRecords] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<string[]>([]);

  // ---------- पेजची स्थिती ----------
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");

  // ---------- सर्च आणि फिल्टर ----------
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  // ---------- मॉडल (एकच फॉर्म — Create आणि Edit दोन्हीसाठी) ----------
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [formError, setFormError] = useState("");

  // ---------- निवडलेल्या प्रॉपर्टीचे Units ----------
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitError, setUnitError] = useState("");

  const propertyNames = propertyRecords.map((p) => p.name);

  // ---------- React Hook Form ----------
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeaseFormValues>({
    resolver: zodResolver(leaseSchema),
    // इथे new Date() वापरू नका — render दरम्यान तारीख काढली तर Next.js error देतो.
    // खऱ्या तारखा "Create Lease" बटण दाबल्यावर (openCreateModal मध्ये) भरल्या जातात.
    defaultValues: BLANK_FORM_VALUES,
  });

  const selectedPropertyName = watch("propertyName");

  // ---------------------------------------------------------------------------
  // करारांची लिस्ट सर्व्हरकडून आणणे
  // ---------------------------------------------------------------------------
  const fetchLeases = useCallback(async () => {
    const response = await api.get<ListResponse<Lease>>("/leases");
    const list = toList(response).map(normalizeLease);
    setLeases(list);
    writeCache(list);
  }, []);

  // ---------------------------------------------------------------------------
  // पेज उघडताना / Refresh करताना सर्व डेटा एकाच वेळी आणणे
  // ---------------------------------------------------------------------------
  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      setPageError("");

      // तिन्ही requests एकाच वेळी — एक फेल झाली तरी बाकीच्या चालतात
      const [propertiesResult, tenantsResult, leasesResult] = await Promise.allSettled([
        api.get<ListResponse<Property>>("/properties"),
        api.get<ListResponse<{ name: string }>>("/tenants"),
        fetchLeases(),
      ]);

      if (propertiesResult.status === "fulfilled") {
        setPropertyRecords(toList(propertiesResult.value));
      }

      if (tenantsResult.status === "fulfilled") {
        setTenants(toList(tenantsResult.value).map((t) => t.name).filter(Boolean));
      }

      // सर्व्हर बंद असेल तरच localStorage मधला जुना डेटा दाखवा
      if (leasesResult.status === "rejected") {
        setLeases(readCache().map(normalizeLease));
        setPageError("Unable to connect to the server. Showing the last saved data (Offline Data).");
      }

      setLoading(false);
      setRefreshing(false);
    },
    [fetchLeases],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------------------------------------------------------------------------
  // प्रॉपर्टी बदलली की त्या प्रॉपर्टीचे Units आणणे (फक्त मॉडल उघडे असताना)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const property = propertyRecords.find((p) => p.name === selectedPropertyName);
    const propertyId = getRecordId(property);

    if (!formMode || !propertyId) {
      setUnitOptions([]);
      setUnitsLoading(false);
      return;
    }

    // जुना response उशिरा आला तर तो वापरू नये म्हणून flag
    let cancelled = false;
    setUnitsLoading(true);
    setUnitError("");

    api
      .get<ListResponse<Record<string, unknown>>>(`/properties/${propertyId}/units`)
      .then((response) => {
        if (cancelled) return;
        setUnitOptions(toList(response).map(normalizeUnit).filter((u) => u.unitNumber));
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Units fetch error:", error);
        setUnitOptions([]);
        setUnitError("Failed to load units. please try again.");
      })
      .finally(() => {
        if (!cancelled) setUnitsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [formMode, selectedPropertyName, propertyRecords]);

  // Dropdown मध्ये फक्त रिकामे (vacant) units — Edit करताना सध्याचा unit पण दाखवा
  const currentEditUnit =
    formMode === "edit" && editingLease?.propertyName === selectedPropertyName ? editingLease.unit : null;

  const selectableUnits = unitOptions.filter(
    (unit) => unit.status === "vacant" || unit.unitNumber === currentEditUnit,
  );

  // Edit करताना जुन्या भाडेकरूचे नाव लिस्टमध्ये नसेल तर ते पण जोडा
  const tenantOptions =
    formMode === "edit" && editingLease && !tenants.includes(editingLease.tenantName)
      ? [editingLease.tenantName, ...tenants]
      : tenants;

  // ---------------------------------------------------------------------------
  // मॉडल उघडणे / बंद करणे
  // ---------------------------------------------------------------------------
  const openCreateModal = () => {
    reset(getEmptyFormValues(propertyNames[0] ?? ""));
    setEditingLease(null);
    setFormError("");
    setFormMode("create");
  };

  const openEditModal = (lease: Lease) => {
    reset({
      tenantName: lease.tenantName,
      propertyName: lease.propertyName,
      unit: lease.unit,
      startDate: lease.startDate,
      endDate: lease.endDate,
      monthlyRent: lease.monthlyRent,
      deposit: lease.deposit,
    });
    setEditingLease(lease);
    setFormError("");
    setFormMode("edit");
  };

  const closeModal = () => {
    setFormMode(null);
    setEditingLease(null);
    setFormError("");
  };

  // ---------------------------------------------------------------------------
  // फॉर्म सबमिट — Create (POST) किंवा Edit (PUT)
  // ---------------------------------------------------------------------------
  const onSubmit = async (data: LeaseFormValues) => {
    setFormError("");

    const payload = {
      tenantName: data.tenantName.trim(),
      propertyName: data.propertyName,
      unit: data.unit.trim(),
      startDate: data.startDate,
      endDate: data.endDate,
      monthlyRent: data.monthlyRent,
      deposit: data.deposit,
      status: getLeaseStatus(data.endDate),
    };

    try {
      if (formMode === "edit") {
        const id = getRecordId(editingLease);
        if (!id) {
          setFormError("Lease ID not found.");
          return;
        }
        await api.put(`/leases/${id}`, payload);
      } else {
        await api.post("/leases", payload);
      }
    } catch (error) {
      console.error("Lease save error:", error);
      setFormError("An error occure while saving, try again.");
      return;
    }

    // सेव्ह झाले — मॉडल बंद करा आणि ताजी लिस्ट आणा
    closeModal();
    fetchLeases().catch(() => {
      setPageError("The agreement was saved successfully,but the list did not refresh. Please click refresh button.");
    });
  };

  // ---------------------------------------------------------------------------
  // करार डिलीट करणे (DELETE)
  // ---------------------------------------------------------------------------
  const handleDeleteLease = async (lease: Lease) => {
    const id = getRecordId(lease);
    if (!id) return;
    if (!confirm(`Are you sure you want to terminate/delete lease ${lease.leaseNumber}?`)) return;

    try {
      await api.delete(`/leases/${id}`);
      const updated = leases.filter((l) => getRecordId(l) !== id);
      setLeases(updated);
      writeCache(updated);
    } catch (error) {
      console.error("Lease delete error:", error);
      setPageError(`${lease.leaseNumber} Failend to delete agreement, try again`);
    }
  };

  // ---------------------------------------------------------------------------
  // सर्च + स्टेटस फिल्टर
  // ---------------------------------------------------------------------------
  const query = search.trim().toLowerCase();

  const filteredLeases = leases.filter((lease) => {
    const matchesSearch =
      !query ||
      [lease.tenantName, lease.propertyName, lease.leaseNumber, lease.unit].some((value) =>
        (value ?? "").toLowerCase().includes(query),
      );
    const matchesStatus = statusFilter === "All" || lease.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ---------------------------------------------------------------------------
  // KPI आकडे
  // ---------------------------------------------------------------------------
  const activeCount = leases.filter((l) => l.status === "Active").length;
  const expiringCount = leases.filter((l) => l.status === "Expiring Soon").length;
  const expiredCount = leases.filter((l) => l.status === "Expired").length;

  // संपलेले (Expired) करार भाड्यात मोजू नका
  const totalMonthlyRent = leases
    .filter((l) => l.status !== "Expired")
    .reduce((sum, l) => sum + l.monthlyRent, 0);

  // ---------------------------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-bold text-slate-600">Loading leases from database...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4 font-sans sm:px-6 lg:px-8">
      {/* ----------------- Header ----------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Leases & Agreements</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {leases.length} Total Contracts · Legal Agreements Management
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
            onClick={openCreateModal}
            className="gap-2 bg-indigo-600 font-bold text-white shadow-md hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Create Lease
          </Button>
        </div>
      </div>

      {/* ----------------- Error Banner ----------------- */}
      {pageError && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{pageError}</span>
          <button onClick={() => setPageError("")} className="text-amber-600 hover:text-amber-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ----------------- KPI Cards ----------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Active Leases"
          value={activeCount}
          hint="Standard ongoing agreements"
          icon={<FileCheck className="h-4 w-4" />}
          iconClass="bg-emerald-100 text-emerald-600"
        />
        <KpiCard
          label="Expiring Soon"
          value={expiringCount}
          hint={`Ends within ${EXPIRING_SOON_DAYS} days`}
          hintClass="text-amber-800"
          icon={<Clock className="h-4 w-4" />}
          iconClass="bg-amber-100 text-amber-600"
        />
        <KpiCard
          label="Expired"
          value={expiredCount}
          hint="Lease period has ended"
          icon={<ShieldAlert className="h-4 w-4" />}
          iconClass="bg-slate-100 text-slate-600"
        />
        <KpiCard
          label="Total Monthly Rent"
          value={`₹${totalMonthlyRent.toLocaleString("en-IN")}`}
          hint="Active + expiring contracts / month"
          icon={<IndianRupee className="h-4 w-4" />}
          iconClass="bg-indigo-100 text-indigo-600"
        />
      </div>

      {/* ----------------- Search + Filter ----------------- */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tenant, property, unit or lease number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${statusFilter === status ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                    {leases.length === 0 ? "No leases yet. Click “Create Lease” to add one." : "No leases found matching your search."}
                  </td>
                </tr>
              ) : (
                filteredLeases.map((lease) => (
                  <tr key={getRecordId(lease) || lease.leaseNumber} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-900">{lease.leaseNumber}</td>
                    <td className="px-6 py-4 text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                          {lease.tenantName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold">{lease.tenantName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{lease.propertyName}</p>
                      <p className="text-xs font-bold text-slate-400">{lease.unit}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                      {lease.startDate}
                      <span className="mx-1 text-slate-400">→</span>
                      {lease.endDate}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ₹{lease.monthlyRent.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${STATUS_BADGE_CLASS[lease.status]}`}
                      >
                        {lease.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="Edit Lease"
                          onClick={() => openEditModal(lease)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Terminate / Delete Lease"
                          onClick={() => handleDeleteLease(lease)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- CREATE / EDIT LEASE MODAL ----------------- */}
      {formMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                {formMode === "edit" && editingLease && (
                  <span className="inline-block rounded-md bg-amber-50 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-amber-700">
                    Edit · {editingLease.leaseNumber}
                  </span>
                )}
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {formMode === "edit" ? "Update Lease Agreement" : "Create New Lease Agreement"}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              {/* Tenant */}
              <Field label="Tenant Full Name *" error={errors.tenantName?.message}>
                {tenantOptions.length > 0 ? (
                  <select {...register("tenantName")} className={inputClass(!!errors.tenantName)}>
                    <option value="">Select a tenant</option>
                    {tenantOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kulkarni"
                    {...register("tenantName")}
                    className={inputClass(!!errors.tenantName)}
                  />
                )}
              </Field>

              {/* Property + Unit */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Property *" error={errors.propertyName?.message}>
                  <select
                    // प्रॉपर्टी बदलली की आधी निवडलेला unit रिकामा करा
                    {...register("propertyName", { onChange: () => setValue("unit", "") })}
                    className={inputClass(!!errors.propertyName)}
                  >
                    <option value="">Select a property</option>
                    {propertyNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Unit / Flat No *" error={errors.unit?.message}>
                  {/* Controller वापरला कारण units नंतर (async) लोड होतात — निवडलेला unit टिकून राहतो */}
                  <Controller
                    name="unit"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        disabled={unitsLoading || !selectedPropertyName}
                        className={inputClass(!!errors.unit)}
                      >
                        <option value="">{unitsLoading ? "Loading units..." : "Select an available unit"}</option>
                        {selectableUnits.map((unit) => (
                          <option key={unit.unitNumber} value={unit.unitNumber}>
                            {unit.unitNumber}
                            {unit.wing ? ` · Wing ${unit.wing}` : ""}
                            {unit.type ? ` · ${unit.type}` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {!unitsLoading && !unitError && selectedPropertyName && selectableUnits.length === 0 && (
                    <p className="mt-1 text-xs font-semibold text-amber-600">
                      No vacant units available for this property.
                    </p>
                  )}
                  {unitError && <p className="mt-1 text-xs font-semibold text-red-600">{unitError}</p>}
                </Field>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Start Date *" error={errors.startDate?.message}>
                  <input type="date" {...register("startDate")} className={inputClass(!!errors.startDate)} />
                </Field>
                <Field label="End Date *" error={errors.endDate?.message}>
                  <input type="date" {...register("endDate")} className={inputClass(!!errors.endDate)} />
                </Field>
              </div>

              {/* Rent + Deposit */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Monthly Rent (₹) *" error={errors.monthlyRent?.message}>
                  <input
                    type="number"
                    min={0}
                    placeholder="40000"
                    {...register("monthlyRent", { setValueAs: toNumber })}
                    className={inputClass(!!errors.monthlyRent)}
                  />
                </Field>
                <Field label="Security Deposit (₹) *" error={errors.deposit?.message}>
                  <input
                    type="number"
                    min={0}
                    placeholder="120000"
                    {...register("deposit", { setValueAs: toNumber })}
                    className={inputClass(!!errors.deposit)}
                  />
                </Field>
              </div>

              {/* सर्व्हर error */}
              {formError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{formError}</p>
              )}

              {/* Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="rounded-xl font-bold">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`rounded-xl font-bold text-white shadow-md ${formMode === "edit" ? "bg-amber-500 hover:bg-amber-600" : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                >
                  {isSubmitting ? "Saving..." : formMode === "edit" ? "Update Lease" : "Create Agreement"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}