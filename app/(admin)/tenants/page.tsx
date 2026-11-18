"use client";

// =============================================================================
// app/(admin)/tenants/page.tsx
//
// Tenant Management with Full CRUD & In-Page Step-by-Step Form
// - 100% English Labels & Instructions
// - Large, Clear Font Sizes & High-Contrast Typography
// - Real / Available Properties Selector (Checkbox / Radio Cards)
//   (Only properties that have vacant units or are marked Available can be selected)
// - Strong Form Validation on each step:
//   * Name (Min 2 chars), Phone (10-15 digits), Email (Valid regex)
//   * Property selection required, Unit number required
//   * Rent (Positive number), Lease dates (End date after move-in date)
//   * Aadhaar (Valid 12 digits or formatted)
// - Actual Persistent Data Storage (MongoDB API with Local Storage fallback)
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Home,
  IndianRupee,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { cleanProperty, type Property } from "../properties/property-utils";

// -----------------------------------------------------------------------------
// 1. DATA TYPES
// -----------------------------------------------------------------------------

export type Tenant = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  emergencyContact: string;
  propertyName: string;
  unit: string;
  wing: string;
  monthlyRent: number;
  securityDeposit: number;
  moveInDate: string;
  leaseEndDate: string;
  aadhaarNumber: string;
  policeVerification: string;
  status: "active" | "inactive";
  notes: string;
};

// Available Property Type for Selection
type PropertyOption = {
  id: string;
  name: string;
  location: string;
  totalUnits: number;
  occupied: number;
  vacant: number;
  suggestedRent: number;
  isAvailable: boolean;
};

// -----------------------------------------------------------------------------
// 2. INITIAL BASE DATA
// -----------------------------------------------------------------------------

// One unit (flat / shop) of a property, as the backend sends it
type UnitOption = {
  unitNumber: string;
  wing: string;
  type: string;
  status: string; // "Vacant" | "Occupied" | "Maintenance"
};

// A real MongoDB id looks like 64f1a2b3c4d5e6f7a8b9c0d1. Demo properties ("prop-1") do not.
const isRealId = (id: string) => /^[a-f0-9]{24}$/i.test(id);

const DEFAULT_PROPERTY_OPTIONS: PropertyOption[] = [
  {
    id: "prop-1",
    name: "Greenfield Heights",
    location: "Andheri West, Mumbai",
    totalUnits: 24,
    occupied: 22,
    vacant: 2,
    suggestedRent: 42000,
    isAvailable: true,
  },
  {
    id: "prop-2",
    name: "Lakeview Towers",
    location: "Powai, Mumbai",
    totalUnits: 30,
    occupied: 27,
    vacant: 3,
    suggestedRent: 55000,
    isAvailable: true,
  },
  {
    id: "prop-3",
    name: "Royal Palms Residency",
    location: "Thane West",
    totalUnits: 10,
    occupied: 8,
    vacant: 2,
    suggestedRent: 85000,
    isAvailable: true,
  },
  {
    id: "prop-4",
    name: "Silver Oak Enclave",
    location: "Kandivali East",
    totalUnits: 12,
    occupied: 9,
    vacant: 3,
    suggestedRent: 18500,
    isAvailable: true,
  },
  {
    id: "prop-5",
    name: "Sea Breeze Studios",
    location: "Bandra West",
    totalUnits: 6,
    occupied: 3,
    vacant: 3,
    suggestedRent: 24000,
    isAvailable: true,
  },
  {
    id: "prop-6",
    name: "Orchid Park",
    location: "Navi Mumbai",
    totalUnits: 2,
    occupied: 2,
    vacant: 0,
    suggestedRent: 14000,
    isAvailable: false, // Fully occupied!
  },
];

const INITIAL_BASE_TENANTS: Tenant[] = [
  {
    _id: "t-1",
    name: "Vikram Joshi",
    email: "vikram.joshi@example.com",
    phone: "+91 98201 12345",
    emergencyContact: "+91 98201 54321",
    propertyName: "Greenfield Heights",
    unit: "Flat 204",
    wing: "Wing A",
    monthlyRent: 42000,
    securityDeposit: 126000,
    moveInDate: "2025-11-01",
    leaseEndDate: "2027-10-31",
    aadhaarNumber: "1234 5678 4589",
    policeVerification: "Verified",
    status: "active",
    notes: "Senior Software Engineer. Rent paid on 1st of every month.",
  },
  {
    _id: "t-2",
    name: "Neha Kapoor",
    email: "neha.kapoor@example.com",
    phone: "+91 98111 22334",
    emergencyContact: "+91 98111 44332",
    propertyName: "Royal Palms Residency",
    unit: "Villa 02",
    wing: "Phase 1",
    monthlyRent: 85000,
    securityDeposit: 255000,
    moveInDate: "2026-01-15",
    leaseEndDate: "2028-01-14",
    aadhaarNumber: "9876 5432 9821",
    policeVerification: "Verified",
    status: "active",
    notes: "Corporate Director. 24 months fixed agreement.",
  },
  {
    _id: "t-3",
    name: "Arjun Mehta",
    email: "arjun.mehta@example.com",
    phone: "+91 98333 44556",
    emergencyContact: "+91 98333 66554",
    propertyName: "Silver Oak Enclave",
    unit: "Studio 105",
    wing: "Block B",
    monthlyRent: 18500,
    securityDeposit: 55500,
    moveInDate: "2025-06-01",
    leaseEndDate: "2026-05-31",
    aadhaarNumber: "4567 8901 3341",
    policeVerification: "In Progress",
    status: "active",
    notes: "Freelance Architect.",
  },
  {
    _id: "t-4",
    name: "Sunita Verma",
    email: "sunita.v@example.com",
    phone: "+91 98444 55667",
    emergencyContact: "+91 98444 77665",
    propertyName: "Greenfield Heights",
    unit: "Flat 101",
    wing: "Wing B",
    monthlyRent: 18000,
    securityDeposit: 54000,
    moveInDate: "2024-12-01",
    leaseEndDate: "2026-11-30",
    aadhaarNumber: "7890 1234 1122",
    policeVerification: "Verified",
    status: "active",
    notes: "Follow up for lease renewal.",
  },
];

const LOCAL_STORAGE_KEY = "rental_management_actual_tenants";
// Key used to share property occupancy counts with the Properties page
const PROPERTIES_OCCUPANCY_KEY = "rental_management_actual_properties";

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  emergencyContact: "",
  propertyName: "Greenfield Heights",
  unit: "",
  wing: "",
  monthlyRent: "",
  securityDeposit: "",
  moveInDate: "",
  leaseEndDate: "",
  aadhaarNumber: "",
  policeVerification: "Pending",
  status: "active" as "active" | "inactive",
  notes: "",
};

// -----------------------------------------------------------------------------
// 2B. AADHAAR / FORM HELPERS
// -----------------------------------------------------------------------------

// Verhoeff checksum tables (the algorithm UIDAI uses for the 12th digit of Aadhaar)
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

function passesVerhoeff(num: string): boolean {
  let c = 0;
  const digits = num.split("").reverse().map(Number);
  for (let i = 0; i < digits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digits[i]]];
  }
  return c === 0;
}

/** Keeps only digits (max 12) and shows them as "1234 5678 9012". */
function formatAadhaar(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 12);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

/** Returns an error message, or "" when the Aadhaar number is valid. */
function getAadhaarError(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "Aadhaar number is required.";
  if (digits.length !== 12) return `Aadhaar must be exactly 12 digits (you entered ${digits.length}).`;
  if (!/^[2-9]/.test(digits)) return "Aadhaar number cannot start with 0 or 1.";
  if (!passesVerhoeff(digits)) return "This is not a valid Aadhaar number (checksum failed).";
  return "";
}

/** Normalised 10-digit Indian mobile (strips +91 / 0 / spaces / dashes). */
function cleanPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

// -----------------------------------------------------------------------------
// 3. MAIN COMPONENT
// -----------------------------------------------------------------------------

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>(DEFAULT_PROPERTY_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Step-by-Step Form Control
  const [showStepForm, setShowStepForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Units (A-101 ...) of the property selected in Step 2
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);

  // Helper to persist tenants in localStorage
  const saveToLocal = (list: Tenant[]) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      }
    } catch {
      // Ignore storage quota error
    }
  };

  // Helper to sync property occupancy counts to localStorage so Properties page stays in sync.
  // Called after every add / edit / delete operation.
  const savePropertyOccupancyToLocal = (props: PropertyOption[]) => {
    try {
      if (typeof window !== "undefined") {
        const overrides = props.map((p) => ({ name: p.name, occupied: p.occupied }));
        localStorage.setItem(PROPERTIES_OCCUPANCY_KEY, JSON.stringify(overrides));
      }
    } catch {
      // Ignore storage quota error
    }
  };

  // Load Tenants & Properties from API
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    // 1. Fetch Real Properties from /properties
    try {
      const propResponse = await api.get<Property[] | { data: Property[] }>("/properties");
      const propList = Array.isArray(propResponse) ? propResponse : (propResponse?.data ?? []);
      if (propList && propList.length > 0) {
        const cleaned = propList.map(cleanProperty);
        const mapped: PropertyOption[] = cleaned.map((p) => {
          const totalUnits = p.units || 1;
          const occupied = p.occupied || 0;
          const vacant = Math.max(0, totalUnits - occupied);
          return {
            id: String(p._id || p.id || p.name),
            name: p.name,
            location: p.location || "Mumbai, India",
            totalUnits,
            occupied,
            vacant,
            suggestedRent: p.rent || 25000,
            isAvailable: vacant > 0,
          };
        });
        setProperties(mapped);
      }
    } catch {
      // Keep DEFAULT_PROPERTY_OPTIONS
    }

    // 2. Fetch Tenants
    let localData: Tenant[] = [];
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) localData = JSON.parse(stored);
      } catch {
        localData = [];
      }
    }

    try {
      const response = await api.get<Tenant[] | { data: Tenant[] }>("/tenants");
      const list = Array.isArray(response) ? response : (response?.data ?? []);

      if (list && list.length > 0) {
        setTenants(list);
        saveToLocal(list);
      } else if (localData.length > 0) {
        setTenants(localData);
      } else {
        setTenants(INITIAL_BASE_TENANTS);
        saveToLocal(INITIAL_BASE_TENANTS);
      }
    } catch {
      if (localData.length > 0) {
        setTenants(localData);
      } else {
        setTenants(INITIAL_BASE_TENANTS);
        saveToLocal(INITIAL_BASE_TENANTS);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  // Manual Refresh Handler
  const handleRefresh = async () => {
    if (refreshing) return;

    try {
      await loadData(true);
    } catch (error) {
      console.error("Failed to refresh tenants:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------------------------------------------------------------------------
  // PROFILE COMPLETENESS -> controls the "Verified" status option
  // Every field (except Notes) must be filled and valid.
  // ---------------------------------------------------------------------------
  const missingFields = useMemo(() => {
    const missing: string[] = [];
    const f = formData;
    if (f.name.trim().length < 3) missing.push("Full name");
    if (!/^[6-9][0-9]{9}$/.test(cleanPhone(f.phone))) missing.push("Valid mobile number");
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) missing.push("Email address");
    if (!f.emergencyContact.trim()) missing.push("Emergency contact");
    if (!f.propertyName) missing.push("Property");
    if (!f.unit.trim()) missing.push("Flat / Unit number");
    if (!(Number(f.monthlyRent) > 0)) missing.push("Monthly rent");
    if (!f.securityDeposit.trim() || Number(f.securityDeposit) < 0) missing.push("Security deposit");
    if (!f.moveInDate) missing.push("Move-in date");
    if (!f.leaseEndDate || new Date(f.leaseEndDate) <= new Date(f.moveInDate)) {
      missing.push("Valid lease expiry date");
    }
    if (getAadhaarError(f.aadhaarNumber)) missing.push("Valid Aadhaar number");
    return missing;
  }, [formData]);

  const isProfileComplete = missingFields.length === 0;

  // If something gets cleared after "Verified" was chosen, drop back to Pending.
  useEffect(() => {
    if (!isProfileComplete && formData.policeVerification === "Verified") {
      setFormData((prev) => ({ ...prev, policeVerification: "Pending" }));
    }
  }, [isProfileComplete, formData.policeVerification]);

  // ---------------------------------------------------------------------------
  // UNITS: vacant-unit dropdown + assigning the unit to the tenant
  // ---------------------------------------------------------------------------
  const selectedPropertyId = useMemo(
    () => properties.find((p) => p.name === formData.propertyName)?.id ?? "",
    [properties, formData.propertyName],
  );

  // Load the units whenever the form is open and the selected property changes
  useEffect(() => {
    if (!showStepForm || !isRealId(selectedPropertyId)) {
      setUnitOptions([]);
      return;
    }

    let cancelled = false;
    setUnitsLoading(true);
    api
      .get<unknown[] | { data: unknown[] }>(`/properties/${selectedPropertyId}/units`)
      .then((response) => {
        const rows = Array.isArray(response) ? response : (response?.data ?? []);
        const list = rows.map((row): UnitOption => {
          const r = (row ?? {}) as Record<string, unknown>;
          return {
            unitNumber: String(r.unitNumber ?? ""),
            wing: String(r.wing ?? ""),
            type: String(r.type ?? ""),
            status: String(r.status ?? "vacant").toLowerCase(),
          };
        });
        if (!cancelled) setUnitOptions(list);
      })
      .catch(() => {
        if (!cancelled) setUnitOptions([]); // backend offline: the page falls back to typing the flat number
      })
      .finally(() => {
        if (!cancelled) setUnitsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showStepForm, selectedPropertyId]);

  const editingTenant = tenants.find((t) => t._id === editingId) ?? null;
  const hasRealUnits = unitOptions.length > 0;

  // Vacant units + the unit this tenant already lives in (when editing)
  const selectableUnits = unitOptions.filter(
    (u) =>
      u.status === "vacant" ||
      (editingTenant !== null &&
        editingTenant.propertyName === formData.propertyName &&
        editingTenant.unit === u.unitNumber),
  );

  const findPropertyId = (name: string) => properties.find((p) => p.name === name)?.id ?? "";

  // Saves who lives in which unit. Returns an error message, or "" when everything is fine.
  const applyUnitChange = async (
    old: Tenant | null,
    next: { propertyName: string; unit: string; status: "active" | "inactive" },
    tenantId: string,
  ): Promise<string> => {
    const newPropertyId = findPropertyId(next.propertyName);
    const oldPropertyId = old ? findPropertyId(old.propertyName) : "";

    const wantAssigned =
      next.status === "active" &&
      isRealId(newPropertyId) &&
      newPropertyId === selectedPropertyId &&
      unitOptions.some((u) => u.unitNumber === next.unit);
    const oldAssigned = old !== null && old.status === "active" && isRealId(oldPropertyId);
    const sameUnit = oldAssigned && oldPropertyId === newPropertyId && old?.unit === next.unit;

    try {
      // 1) take the new unit first (fails if somebody else got it; safe to repeat for the same tenant)
      if (wantAssigned) {
        await api.post(`/properties/${newPropertyId}/units/${encodeURIComponent(next.unit)}/assign`, { tenantId });
      }
    } catch (error) {
      return error instanceof Error ? error.message : "Could not assign this unit. Please choose another.";
    }

    // 2) then free the old one
    if (old && oldAssigned && !(wantAssigned && sameUnit)) {
      try {
        await api.post(`/properties/${oldPropertyId}/units/${encodeURIComponent(old.unit)}/release`, { tenantId });
      } catch {
        // already free or backend offline - nothing to do
      }
    }
    return "";
  };

  // Open Create Form
  const handleOpenCreateForm = () => {
    setEditingId(null);
    // Auto-select the first available property
    const firstAvailable = properties.find((p) => p.isAvailable)?.name || properties[0]?.name || "";
    setFormData({
      ...INITIAL_FORM,
      propertyName: firstAvailable,
    });
    setErrors({});
    setFormError("");
    setCurrentStep(1);
    setShowStepForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Open Edit Form
  const handleOpenEditForm = (tenant: Tenant) => {
    setEditingId(tenant._id);
    setFormData({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      emergencyContact: tenant.emergencyContact || "",
      propertyName: tenant.propertyName || properties[0]?.name || "",
      unit: tenant.unit || "",
      wing: tenant.wing || "",
      monthlyRent: String(tenant.monthlyRent || ""),
      securityDeposit: String(tenant.securityDeposit || ""),
      moveInDate: tenant.moveInDate || "",
      leaseEndDate: tenant.leaseEndDate || "",
      aadhaarNumber: tenant.aadhaarNumber || "",
      policeVerification: tenant.policeVerification || "Pending",
      status: tenant.status || "active",
      notes: tenant.notes || "",
    });
    setErrors({});
    setFormError("");
    setCurrentStep(1);
    setShowStepForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---------------------------------------------------------------------------
  // STEP VALIDATIONS
  // ---------------------------------------------------------------------------
  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};
    setFormError("");

    if (stepNumber === 1) {
      // Name
      if (!formData.name.trim()) {
        newErrors.name = "Full name is required.";
      } else if (formData.name.trim().length < 3) {
        newErrors.name = "Name must be at least 3 characters.";
      } else if (!/^[A-Za-z][A-Za-z .'-]*$/.test(formData.name.trim())) {
        newErrors.name = "Name can contain only letters, spaces and . ' -";
      }

      // Phone
      const phoneClean = cleanPhone(formData.phone);
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required.";
      } else if (!/^[6-9][0-9]{9}$/.test(phoneClean)) {
        newErrors.phone = "Enter a valid 10-digit mobile number (starts with 6-9).";
      }

      // Email (optional, but if provided must be valid)
      if (formData.email.trim() && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
        newErrors.email = "Enter a valid email address (e.g. name@domain.com).";
      }
    } else if (stepNumber === 2) {
      // Property selection
      if (!formData.propertyName) {
        newErrors.propertyName = "Please select an available property.";
      } else {
        const selected = properties.find((p) => p.name === formData.propertyName);
        if (selected && !selected.isAvailable && !editingId) {
          newErrors.propertyName = "This property is 100% occupied. Please select an available property.";
        }
      }

      // Unit
      if (!formData.unit.trim()) {
        newErrors.unit = hasRealUnits
          ? "Please select a vacant unit."
          : "Flat / Unit number is required (e.g. Flat 302).";
      } else if (hasRealUnits && !selectableUnits.some((u) => u.unitNumber === formData.unit)) {
        newErrors.unit = "Please select a vacant unit from the list.";
      }
    } else if (stepNumber === 3) {
      // Rent
      const rentNum = Number(formData.monthlyRent);
      if (!formData.monthlyRent || isNaN(rentNum) || rentNum <= 0) {
        newErrors.monthlyRent = "Enter a valid monthly rent amount (greater than ₹0).";
      }

      // Security Deposit
      if (formData.securityDeposit && (isNaN(Number(formData.securityDeposit)) || Number(formData.securityDeposit) < 0)) {
        newErrors.securityDeposit = "Security deposit cannot be negative.";
      }

      // Dates validation
      if (formData.leaseEndDate && !formData.moveInDate) {
        newErrors.leaseEndDate = "Select the move-in date first.";
      } else if (formData.moveInDate && formData.leaseEndDate) {
        if (new Date(formData.leaseEndDate) <= new Date(formData.moveInDate)) {
          newErrors.leaseEndDate = "Lease end date must be after the move-in date.";
        }
      }
    } else if (stepNumber === 4) {
      // Aadhaar: optional to save, but if entered it must be a real 12-digit Aadhaar
      // (and it is mandatory for the "Verified" status).
      if (formData.aadhaarNumber.trim()) {
        const aadhaarError = getAadhaarError(formData.aadhaarNumber);
        if (aadhaarError) newErrors.aadhaarNumber = aadhaarError;
      }
      if (formData.policeVerification === "Verified" && !isProfileComplete) {
        newErrors.policeVerification =
          "Complete all tenant information before marking as Verified.";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setFormError("Please fix the highlighted errors before proceeding.");
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setErrors({});
    setFormError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit & Save Tenant
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      emergencyContact: formData.emergencyContact.trim(),
      propertyName: formData.propertyName,
      unit: formData.unit.trim(),
      wing: formData.wing.trim(),
      monthlyRent: Number(formData.monthlyRent) || 0,
      securityDeposit: Number(formData.securityDeposit) || 0,
      moveInDate: formData.moveInDate || new Date().toISOString().split("T")[0],
      leaseEndDate: formData.leaseEndDate || "",
      aadhaarNumber: formatAadhaar(formData.aadhaarNumber),
      policeVerification: formData.policeVerification,
      status: formData.status,
      notes: formData.notes.trim(),
    };

    try {
      if (editingId) {
        // Find old tenant to see if property or status changed
        const oldTenant = tenants.find((t) => t._id === editingId);

        // Give the tenant the chosen unit first. If somebody else took it, stop here.
        const unitError = await applyUnitChange(oldTenant ?? null, payload, editingId);
        if (unitError) {
          setFormError(unitError);
          return;
        }

        // UPDATE (PUT)
        await api.put(`/tenants/${editingId}`, payload);
        const updatedList = tenants.map((t) =>
          t._id === editingId ? { ...t, ...payload } : t,
        );
        setTenants(updatedList);
        saveToLocal(updatedList);

        // Update properties local occupancy counts
        setProperties((prev) =>
          prev.map((prop) => {
            let occupiedChange = 0;
            if (oldTenant) {
              if (oldTenant.propertyName === prop.name && payload.propertyName !== prop.name) {
                occupiedChange -= 1;
              } else if (oldTenant.propertyName !== prop.name && payload.propertyName === prop.name) {
                occupiedChange += 1;
              }
            }
            if (occupiedChange === 0) return prop;
            const newOccupied = Math.max(0, Math.min(prop.totalUnits, prop.occupied + occupiedChange));
            const newVacant = prop.totalUnits - newOccupied;
            return {
              ...prop,
              occupied: newOccupied,
              vacant: newVacant,
              isAvailable: newVacant > 0,
            };
          }),
        );
      } else {
        // CREATE (POST)
        const response = await api.post<Tenant | { data: Tenant }>("/tenants", payload);
        const created =
          response && "data" in response && response.data
            ? response.data
            : (response as Tenant);

        // Give the new tenant the chosen unit. If it fails, remove the tenant again.
        if (created?._id) {
          const unitError = await applyUnitChange(null, payload, created._id);
          if (unitError) {
            try {
              await api.delete(`/tenants/${created._id}`);
            } catch {
              // ignore
            }
            setFormError(unitError);
            return;
          }
        }

        const newRecord: Tenant = {
          _id: created?._id || `t-${Date.now()}`,
          ...payload,
        };
        const updatedList = [newRecord, ...tenants];
        setTenants(updatedList);
        saveToLocal(updatedList);

        // Increment occupied count (+1) for selected property
        setProperties((prev) =>
          prev.map((prop) => {
            if (prop.name === payload.propertyName) {
              const newOccupied = Math.min(prop.totalUnits, prop.occupied + 1);
              const newVacant = Math.max(0, prop.totalUnits - newOccupied);
              return {
                ...prop,
                occupied: newOccupied,
                vacant: newVacant,
                isAvailable: newVacant > 0,
              };
            }
            return prop;
          }),
        );
      }

      setShowStepForm(false);
    } catch {
      // Backend offline fallback - save locally and still update properties!
      if (editingId) {
        const oldTenant = tenants.find((t) => t._id === editingId);
        const updatedList = tenants.map((t) =>
          t._id === editingId ? { ...t, ...payload } : t,
        );
        setTenants(updatedList);
        saveToLocal(updatedList);

        setProperties((prev) =>
          prev.map((prop) => {
            let occupiedChange = 0;
            if (oldTenant) {
              if (oldTenant.propertyName === prop.name && payload.propertyName !== prop.name) {
                occupiedChange -= 1;
              } else if (oldTenant.propertyName !== prop.name && payload.propertyName === prop.name) {
                occupiedChange += 1;
              }
            }
            if (occupiedChange === 0) return prop;
            const newOccupied = Math.max(0, Math.min(prop.totalUnits, prop.occupied + occupiedChange));
            const newVacant = prop.totalUnits - newOccupied;
            return {
              ...prop,
              occupied: newOccupied,
              vacant: newVacant,
              isAvailable: newVacant > 0,
            };
          }),
        );
      } else {
        const newRecord: Tenant = {
          _id: `t-${Date.now()}`,
          ...payload,
        };
        const updatedList = [newRecord, ...tenants];
        setTenants(updatedList);
        saveToLocal(updatedList);

        setProperties((prev) =>
          prev.map((prop) => {
            if (prop.name === payload.propertyName) {
              const newOccupied = Math.min(prop.totalUnits, prop.occupied + 1);
              const newVacant = Math.max(0, prop.totalUnits - newOccupied);
              return {
                ...prop,
                occupied: newOccupied,
                vacant: newVacant,
                isAvailable: newVacant > 0,
              };
            }
            return prop;
          }),
        );
      }
      setShowStepForm(false);
    } finally {
      setSaving(false);
    }
  };

  // Delete Tenant
  const handleDeleteTenant = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove tenant "${name}"?`)) return;
    const target = tenants.find((t) => t._id === id);

    try {
      await api.delete(`/tenants/${id}`);
    } catch {
      // Ignore backend error
    }

    // Free the unit again
    if (target) {
      const propertyId = findPropertyId(target.propertyName);
      if (target.status === "active" && isRealId(propertyId)) {
        try {
          await api.post(`/properties/${propertyId}/units/${encodeURIComponent(target.unit)}/release`, {
            tenantId: id,
          });
        } catch {
          // already free or backend offline
        }
      }
    }

    const updatedList = tenants.filter((t) => t._id !== id);
    setTenants(updatedList);
    saveToLocal(updatedList);

    // Decrement occupied count (-1) for property
    if (target && target.propertyName) {
      setProperties((prev) =>
        prev.map((prop) => {
          if (prop.name === target.propertyName) {
            const newOccupied = Math.max(0, prop.occupied - 1);
            const newVacant = prop.totalUnits - newOccupied;
            return {
              ...prop,
              occupied: newOccupied,
              vacant: newVacant,
              isAvailable: newVacant > 0,
            };
          }
          return prop;
        }),
      );
    }
  };

  // Filtered List
  const filteredTenants = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tenants.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.propertyName.toLowerCase().includes(q) ||
        t.unit.toLowerCase().includes(q) ||
        t.phone.includes(q) ||
        t.email.toLowerCase().includes(q)
      );
    });
  }, [tenants, search, statusFilter]);

  const activeCount = tenants.filter((t) => t.status === "active").length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 font-sans">
      {/* -------------------------------------------------------------------------
          HEADER
      ------------------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Tenants Directory
          </h1>
          <p className="mt-1.5 text-base font-semibold text-slate-500">
            {tenants.length} Total Registered Tenants ·{" "}
            <span className="text-emerald-600 font-bold">{activeCount} Active Leases</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-11 gap-2 border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>

          {!showStepForm && (
            <Button
              onClick={handleOpenCreateForm}
              className="h-11 px-5 text-sm font-bold bg-indigo-600 text-white shadow-md hover:bg-indigo-700 gap-2"
            >
              <Plus className="h-5 w-5" /> Add New Tenant
            </Button>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          STEP-BY-STEP FORM (In-Page, 100% English, Property Checkboxes)
      ------------------------------------------------------------------------- */}
      {showStepForm && (
        <div className="rounded-3xl border-2 border-indigo-500/30 bg-white p-6 shadow-xl transition-all sm:p-10">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-6">
            <div>
              <span className="inline-block rounded-lg bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700 uppercase tracking-wider">
                {editingId ? "Update Tenant Information" : "New Tenant Registration"}
              </span>
              <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                {editingId ? `Edit Profile: ${formData.name}` : "Add Tenant"}
              </h2>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStepForm(false)}
              className="text-slate-500 hover:text-slate-800 gap-1.5 text-sm font-semibold"
            >
              <X className="h-4 w-4" /> Cancel & Close
            </Button>
          </div>

          {/* Stepper Wizard Indicator */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { num: 1, title: "1. Personal Info", desc: "Full name & contact" },
              { num: 2, title: "2. Available Property", desc: "Select vacant property" },
              { num: 3, title: "3. Rent & Duration", desc: "Monthly rent & term" },
              { num: 4, title: "4. Verification & KYC", desc: "Aadhaar & police status" },
            ].map((step) => {
              const isCurrent = currentStep === step.num;
              const isDone = currentStep > step.num;
              return (
                <div
                  key={step.num}
                  onClick={() => {
                    // Only allow clicking back or current
                    if (step.num < currentStep) {
                      setCurrentStep(step.num);
                    } else if (step.num > currentStep) {
                      handleNextStep();
                    }
                  }}
                  className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${isCurrent
                    ? "border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-600/20"
                    : isDone
                      ? "border-emerald-300 bg-emerald-50/40"
                      : "border-slate-200 bg-slate-50/60 opacity-60"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black ${isCurrent
                        ? "bg-indigo-600 text-white shadow-sm"
                        : isDone
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-700"
                        }`}
                    >
                      {isDone ? "✓" : step.num}
                    </span>
                    <p className="truncate text-sm font-extrabold text-slate-900">
                      {step.title}
                    </p>
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* General Form Error Alert */}
          {formError && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* -------------------------------------------------------------
              STEP 1: Personal Details
          ------------------------------------------------------------- */}
          {currentStep === 1 && (
            <div className="mt-8 space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">
                  Step 1: Tenant Contact & Personal Information
                </h3>
                <p className="text-sm text-slate-500">
                  Enter the tenant's primary contact and emergency details.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-bold text-slate-800">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prathmesh Chikane"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: "" });
                    }}
                    className={`mt-2 h-12 w-full rounded-xl border px-4 text-base font-medium text-slate-900 outline-none transition ${errors.name
                      ? "border-rose-400 bg-rose-50/30 focus:border-rose-500"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                      }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs font-bold text-rose-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800">
                    Phone / Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9552462050"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (errors.phone) setErrors({ ...errors, phone: "" });
                    }}
                    className={`mt-2 h-12 w-full rounded-xl border px-4 text-base font-medium text-slate-900 outline-none transition ${errors.phone
                      ? "border-rose-400 bg-rose-50/30 focus:border-rose-500"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                      }`}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs font-bold text-rose-600">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. prathmesh@gmail.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                    className={`mt-2 h-12 w-full rounded-xl border px-4 text-base font-medium text-slate-900 outline-none transition ${errors.email
                      ? "border-rose-400 bg-rose-50/30 focus:border-rose-500"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                      }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs font-bold text-rose-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800">
                    Emergency Contact Person & Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh (Father): +91 98220 11223"
                    value={formData.emergencyContact}
                    onChange={(e) =>
                      setFormData({ ...formData, emergencyContact: e.target.value })
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-base font-medium text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              STEP 2: Available Property Checkbox Selection & Flat Details
          ------------------------------------------------------------- */}
          {currentStep === 2 && (
            <div className="mt-8 space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">
                  Step 2: Select an Available Property & Flat
                </h3>
                <p className="text-sm text-slate-500">
                  Only properties with vacant units are eligible for new tenant allotment.
                </p>
              </div>

              {/* Property Checkbox / Card Selector */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  Choose Available Building / Project <span className="text-rose-500">*</span>
                </label>
                {errors.propertyName && (
                  <p className="mb-3 text-xs font-bold text-rose-600">
                    {errors.propertyName}
                  </p>
                )}

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {properties.map((prop) => {
                    const isSelected = formData.propertyName === prop.name;
                    const isAvailable = prop.isAvailable;

                    return (
                      <div
                        key={prop.id}
                        onClick={() => {
                          if (isAvailable || editingId) {
                            const changed = prop.name !== formData.propertyName;
                            setFormData({
                              ...formData,
                              propertyName: prop.name,
                              monthlyRent: String(prop.suggestedRent || formData.monthlyRent),
                              // a different property means a different list of units
                              unit: changed ? "" : formData.unit,
                              wing: changed ? "" : formData.wing,
                            });
                            if (errors.propertyName) {
                              setErrors({ ...errors, propertyName: "" });
                            }
                          }
                        }}
                        className={`relative flex flex-col justify-between rounded-2xl border-2 p-4 transition-all ${!isAvailable && !editingId
                          ? "cursor-not-allowed border-slate-200 bg-slate-100/70 opacity-60"
                          : isSelected
                            ? "cursor-pointer border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-600/20"
                            : "cursor-pointer border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                          }`}
                      >
                        {/* Checkbox Icon Top-Right */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-extrabold text-base text-slate-900 truncate">
                              {prop.name}
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-slate-500 truncate flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {prop.location}
                            </p>
                          </div>

                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition ${isSelected
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : !isAvailable
                                ? "border-slate-300 bg-slate-200"
                                : "border-slate-300 bg-white"
                              }`}
                          >
                            {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Availability Pill */}
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${isAvailable
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                              }`}
                          >
                            {isAvailable
                              ? `${prop.vacant} Units Available`
                              : "Fully Occupied (No Vacancy)"}
                          </span>

                          <span className="text-xs font-bold text-slate-700">
                            ₹{prop.suggestedRent.toLocaleString("en-IN")}/mo
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Flat & Wing Inputs */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-2">
                <div>
                  <label className="block text-sm font-bold text-slate-800">
                    Flat / Unit Number <span className="text-rose-500">*</span>
                  </label>

                  {unitsLoading ? (
                    <div className="mt-2 flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading units...
                    </div>
                  ) : hasRealUnits ? (
                    <select
                      value={formData.unit}
                      onChange={(e) => {
                        const picked = unitOptions.find((u) => u.unitNumber === e.target.value);
                        setFormData({
                          ...formData,
                          unit: e.target.value,
                          wing: picked ? picked.wing : "",
                        });
                        if (errors.unit) setErrors({ ...errors, unit: "" });
                      }}
                      className={`mt-2 h-12 w-full rounded-xl border bg-white px-4 text-base font-medium text-slate-900 outline-none transition ${errors.unit
                        ? "border-rose-400 bg-rose-50/30 focus:border-rose-500"
                        : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                        }`}
                    >
                      <option value="">Select a vacant unit</option>
                      {selectableUnits.map((u) => (
                        <option key={u.unitNumber} value={u.unitNumber}>
                          {u.unitNumber}
                          {u.type ? ` · ${u.type}` : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Flat 302 or Villa 04"
                      value={formData.unit}
                      onChange={(e) => {
                        setFormData({ ...formData, unit: e.target.value });
                        if (errors.unit) setErrors({ ...errors, unit: "" });
                      }}
                      className={`mt-2 h-12 w-full rounded-xl border px-4 text-base font-medium text-slate-900 outline-none transition ${errors.unit
                        ? "border-rose-400 bg-rose-50/30 focus:border-rose-500"
                        : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                        }`}
                    />
                  )}

                  {!unitsLoading && hasRealUnits && selectableUnits.length === 0 && (
                    <p className="mt-1 text-xs font-bold text-amber-600">
                      No vacant units in this property. Add units from the Properties page first.
                    </p>
                  )}
                  {!unitsLoading && hasRealUnits && selectableUnits.length > 0 && (
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {selectableUnits.length} vacant of {unitOptions.length} units
                    </p>
                  )}
                  {!unitsLoading && !hasRealUnits && (
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      No units set up for this property yet. Type the flat number, or add units from the
                      Properties page.
                    </p>
                  )}
                  {errors.unit && (
                    <p className="mt-1 text-xs font-bold text-rose-600">{errors.unit}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800">
                    Wing / Tower / Block {hasRealUnits ? "(Automatic)" : "(Optional)"}
                  </label>
                  <input
                    type="text"
                    placeholder={hasRealUnits ? "Filled when you select a unit" : "e.g. Wing A or Tower 1"}
                    value={formData.wing}
                    disabled={hasRealUnits}
                    onChange={(e) => setFormData({ ...formData, wing: e.target.value })}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-base font-medium text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              STEP 3: Rent & Lease Term
          ------------------------------------------------------------- */}
          {currentStep === 3 && (
            <div className="mt-8 space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">
                  Step 3: Agreed Rent & Agreement Duration
                </h3>
                <p className="text-sm text-slate-500">
                  Specify the monthly rental amount, security deposit, and tenancy dates.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-bold text-slate-800">
                    Monthly Rent (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 35000"
                    value={formData.monthlyRent}
                    onChange={(e) => {
                      setFormData({ ...formData, monthlyRent: e.target.value });
                      if (errors.monthlyRent) setErrors({ ...errors, monthlyRent: "" });
                    }}
                    className={`mt-2 h-12 w-full rounded-xl border px-4 text-base font-medium text-slate-900 outline-none transition ${errors.monthlyRent
                      ? "border-rose-400 bg-rose-50/30 focus:border-rose-500"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                      }`}
                  />
                  {errors.monthlyRent && (
                    <p className="mt-1 text-xs font-bold text-rose-600">
                      {errors.monthlyRent}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800">
                    Security Deposit Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 100000"
                    value={formData.securityDeposit}
                    onChange={(e) => {
                      setFormData({ ...formData, securityDeposit: e.target.value });
                      if (errors.securityDeposit) setErrors({ ...errors, securityDeposit: "" });
                    }}
                    className={`mt-2 h-12 w-full rounded-xl border px-4 text-base font-medium text-slate-900 outline-none transition ${errors.securityDeposit
                      ? "border-rose-400 bg-rose-50/30 focus:border-rose-500"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                      }`}
                  />
                  {errors.securityDeposit && (
                    <p className="mt-1 text-xs font-bold text-rose-600">
                      {errors.securityDeposit}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800">
                    Move-in Date
                  </label>
                  <input
                    type="date"
                    value={formData.moveInDate}
                    onChange={(e) => {
                      setFormData({ ...formData, moveInDate: e.target.value });
                      if (errors.leaseEndDate) setErrors({ ...errors, leaseEndDate: "" });
                    }}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-base font-medium text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800">
                    Lease Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.leaseEndDate}
                    onChange={(e) => {
                      setFormData({ ...formData, leaseEndDate: e.target.value });
                      if (errors.leaseEndDate) setErrors({ ...errors, leaseEndDate: "" });
                    }}
                    className={`mt-2 h-12 w-full rounded-xl border px-4 text-base font-medium text-slate-900 outline-none transition ${errors.leaseEndDate
                      ? "border-rose-400 bg-rose-50/30 focus:border-rose-500"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                      }`}
                  />
                  {errors.leaseEndDate && (
                    <p className="mt-1 text-xs font-bold text-rose-600">
                      {errors.leaseEndDate}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              STEP 4: Verification, KYC & Notes
          ------------------------------------------------------------- */}
          {currentStep === 4 && (
            <div className="mt-8 space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">
                  Step 4: Identity Verification & Profile Status
                </h3>
                <p className="text-sm text-slate-500">
                  Record Aadhaar verification and active lease status.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-bold text-slate-800">
                    Aadhaar Number (12 digits)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={14}
                    placeholder="e.g. 2345 6789 0124"
                    value={formData.aadhaarNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, aadhaarNumber: formatAadhaar(e.target.value) });
                      if (errors.aadhaarNumber) setErrors({ ...errors, aadhaarNumber: "" });
                    }}
                    className={`mt-2 h-12 w-full rounded-xl border px-4 text-base font-medium text-slate-900 outline-none transition ${errors.aadhaarNumber
                      ? "border-rose-400 bg-rose-50/30 focus:border-rose-500"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                      }`}
                  />
                  {errors.aadhaarNumber && (
                    <p className="mt-1 text-xs font-bold text-rose-600">
                      {errors.aadhaarNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800">
                    Police Verification
                  </label>
                  <select
                    value={formData.policeVerification}
                    onChange={(e) => {
                      setFormData({ ...formData, policeVerification: e.target.value });
                      if (errors.policeVerification) setErrors({ ...errors, policeVerification: "" });
                    }}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  >
                    <option value="Verified" disabled={!isProfileComplete}>
                      {isProfileComplete ? "Verified" : "Verified (locked - complete all info)"}
                    </option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                  {errors.policeVerification && (
                    <p className="mt-1 text-xs font-bold text-rose-600">
                      {errors.policeVerification}
                    </p>
                  )}
                  {isProfileComplete ? (
                    <p className="mt-1 text-xs font-bold text-emerald-600">
                      All information is complete. You can mark this tenant as Verified.
                    </p>
                  ) : (
                    <p className="mt-1 text-xs font-semibold text-amber-600">
                      Fill these to unlock "Verified": {missingFields.join(", ")}.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800">
                    Tenancy Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "active" | "inactive",
                      })
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  >
                    <option value="active">Active (Currently Living)</option>
                    <option value="inactive">Inactive (Vacated)</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-bold text-slate-800">
                    Important Tenant Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Workplace, vehicle parking slot, or specific terms..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-300 p-4 text-base font-medium text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Stepper Footer Action Buttons */}
          <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
            <Button
              type="button"
              variant="outline"
              disabled={currentStep === 1}
              onClick={handlePrevStep}
              className="h-12 px-6 text-sm font-bold gap-2 text-slate-700"
            >
              <ChevronLeft className="h-4 w-4" /> Previous Step
            </Button>

            <div className="flex items-center gap-3">
              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="h-12 px-7 text-sm font-bold bg-indigo-600 text-white shadow-md hover:bg-indigo-700 gap-2"
                >
                  Continue to Next Step <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmitForm}
                  disabled={saving}
                  className="h-12 px-8 text-base font-extrabold bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                  {editingId ? "Save Changes" : "Register Tenant Now"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          FILTER & SEARCH BAR
      ------------------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tenant name, building, flat number, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-12 pr-4 text-base font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="all">All Tenants ({tenants.length})</option>
            <option value="active">Active ({activeCount})</option>
            <option value="inactive">Inactive ({tenants.length - activeCount})</option>
          </select>
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          TENANTS TABLE
      ------------------------------------------------------------------------- */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-black uppercase tracking-wider text-slate-500">
                <th className="py-4 pl-6 pr-4">Tenant Profile</th>
                <th className="px-4 py-4">Property & Flat</th>
                <th className="px-4 py-4">Rent / Deposit</th>
                <th className="px-4 py-4">Agreement Term</th>
                <th className="px-4 py-4">Verification</th>
                <th className="px-4 py-4">Status</th>
                <th className="py-4 pl-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-base font-semibold text-slate-400">
                    No tenants found matching your search.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 pl-6 pr-4">
                      <p className="text-base font-extrabold text-slate-900">{t.name}</p>
                      <div className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-500">
                        <span>{t.phone}</span>
                        {t.email && <span>· {t.email}</span>}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-base font-bold text-slate-900">{t.propertyName}</p>
                      <p className="text-sm font-semibold text-indigo-600">
                        {t.unit} {t.wing ? `(${t.wing})` : ""}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-base font-extrabold text-slate-900">
                        ₹{(t.monthlyRent || 0).toLocaleString("en-IN")}{" "}
                        <span className="text-xs font-semibold text-slate-400">/mo</span>
                      </p>
                      <p className="text-xs font-medium text-slate-400">
                        Deposit: ₹{(t.securityDeposit || 0).toLocaleString("en-IN")}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-sm font-medium text-slate-600">
                      <p>{t.moveInDate || "N/A"}</p>
                      <p className="text-xs text-slate-400">to {t.leaseEndDate || "Ongoing"}</p>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${t.policeVerification === "Verified"
                          ? "bg-emerald-50 text-emerald-700"
                          : t.policeVerification === "In Progress"
                            ? "bg-sky-50 text-sky-700"
                            : "bg-amber-50 text-amber-700"
                          }`}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {t.policeVerification || "Pending"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-extrabold capitalize ${t.status === "active"
                          ? "bg-emerald-100/70 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                          }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td className="py-4 pl-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditForm(t)}
                          title="Edit tenant"
                          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTenant(t._id, t.name)}
                          title="Delete tenant"
                          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
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
    </div>
  );
}