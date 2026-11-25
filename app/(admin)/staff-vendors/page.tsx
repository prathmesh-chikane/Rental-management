
"use client";

// =============================================================================
// STAFF & VENDORS MANAGEMENT
//
// Features:
// 1. Load staff from MongoDB
// 2. Add Staff / Vendor
// 3. Edit Staff / Vendor
// 4. Delete Staff / Vendor
// 5. Search and Category Filter
// 6. Available / Busy / Inactive Status
// =============================================================================

import { useEffect, useState, type FormEvent } from "react";

import {
  Briefcase,
  CheckCircle2,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  UserCheck,
  Users,
  Wrench,
  X,
  Pencil,
  RefreshCw,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";

// =============================================================================
// TYPES
// =============================================================================

type Staff = {
  _id: string;
  name: string;
  category:
  | "Plumbing"
  | "Electrical"
  | "Carpentry"
  | "Appliance"
  | "Cleaning"
  | "Painting"
  | "Security"
  | "Other";
  phone: string;
  email: string;
  propertyName: string;
  status: "Available" | "Busy" | "Inactive";
};

type StaffFormData = {
  name: string;
  category: Staff["category"];
  phone: string;
  email: string;
  propertyName: string;
  status: Staff["status"];
};

const INITIAL_FORM: StaffFormData = {
  name: "",
  category: "Plumbing",
  phone: "",
  email: "",
  propertyName: "",
  status: "Available",
};

type Property = {
  _id: string;
  name: string;
  isDeleted?: boolean;
};

const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Appliance",
  "Cleaning",
  "Painting",
  "Security",
  "Other",
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function StaffVendorsPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] =
    useState<StaffFormData>({ ...INITIAL_FORM });

  const [properties, setProperties] = useState<Property[]>([]);
  const [isPropertiesLoading, setIsPropertiesLoading] = useState(false);

  // ===========================================================================
  // 1. LOAD STAFF FROM DATABASE
  // ===========================================================================

  const loadStaff = async () => {
    try {
      setIsLoading(true);

      const response = await api.get<Staff[]>("/staff");

      setStaffList(Array.isArray(response) ? response : []);

    } catch (error) {
      console.error("STAFF API ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load staff data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
    loadProperties();
  }, []);

  // ===========================================================================
  // 2. properties
  // ===========================================================================
  const loadProperties = async () => {
    try {
      setIsPropertiesLoading(true);

      const response = await api.get<Property[]>("/properties");

      const propertyList = Array.isArray(response) ? response : [];

      // Deleted properties dropdown मध्ये दाखवायच्या नाहीत
      setProperties(
        propertyList.filter((property) => property.isDeleted !== true)
      );

    } catch (error) {
      console.error("PROPERTIES API ERROR:", error);
      alert("Unable to load properties.");
    } finally {
      setIsPropertiesLoading(false);
    }
  };

  // ===========================================================================
  // 3. RESET FORM
  // ===========================================================================

  const resetForm = () => {
    setFormData({ ...INITIAL_FORM });
    setEditingStaff(null);
  };

  // ===========================================================================
  // 4. OPEN ADD MODAL
  // ===========================================================================

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // ===========================================================================
  // 5. OPEN EDIT MODAL
  // ===========================================================================

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);

    setFormData({
      name: staff.name,
      category: staff.category,
      phone: staff.phone,
      email: staff.email || "",
      propertyName: staff.propertyName || "",
      status: staff.status,
    });

    setIsModalOpen(true);
  };

  // ===========================================================================
  // 6. CREATE / UPDATE STAFF
  // ===========================================================================

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const name = formData.name.trim();
    const phone = formData.phone.trim();
    const email = formData.email.trim();

    if (name.length < 2) {
      alert("Name must contain at least 2 characters.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      alert("Please enter a valid email address.");
      return;
    }

    const payload = {
      ...formData,
      name,
      phone,
      email,
      propertyName: formData.propertyName.trim(),
    };

    try {
      setIsSaving(true);

      if (editingStaff) {
        // UPDATE EXISTING STAFF
        await api.patch(
          `/staff/${editingStaff._id}`,
          payload,
        );
      } else {
        // CREATE NEW STAFF
        await api.post("/staff", payload);
      }

      await loadStaff();

      setIsModalOpen(false);
      resetForm();

    } catch (error) {
      console.error("Save staff error:", error);
      alert("Unable to save staff. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ===========================================================================
  // 7. DELETE STAFF
  // ===========================================================================

  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${name}?`,
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/staff/${id}`);

      await loadStaff();

    } catch (error) {
      console.error("Delete staff error:", error);
      alert("Unable to delete staff.");
    }
  };

  // ===========================================================================
  // 8. SEARCH AND FILTER
  // ===========================================================================

  const filteredStaff = staffList.filter((staff) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      staff.name.toLowerCase().includes(searchText) ||
      staff.category.toLowerCase().includes(searchText) ||
      staff.phone.includes(searchText) ||
      (staff.email || "").toLowerCase().includes(searchText) ||
      (staff.propertyName || "").toLowerCase().includes(searchText);

    const matchesCategory =
      categoryFilter === "All" ||
      staff.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // ===========================================================================
  // 9. DASHBOARD COUNTS
  // ===========================================================================

  const totalStaff = staffList.length;

  const availableCount = staffList.filter(
    (s) => s.status === "Available",
  ).length;

  const busyCount = staffList.filter(
    (s) => s.status === "Busy",
  ).length;

  const inactiveCount = staffList.filter(
    (s) => s.status === "Inactive",
  ).length;

  const vendorCount = staffList.filter(
    (s) => s.category !== "Security",
  ).length;

  // ===========================================================================
  // 10. STATUS STYLES
  // ===========================================================================

  const getStatusStyle = (status: Staff["status"]) => {
    switch (status) {
      case "Available":
        return "bg-emerald-50 text-emerald-700";

      case "Busy":
        return "bg-amber-50 text-amber-700";

      case "Inactive":
        return "bg-slate-100 text-slate-600";
    }
  };

  // ===========================================================================
  // UI
  // ===========================================================================

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4 sm:px-6 lg:px-8">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Staff & Vendors
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage electricians, plumbers, security guards, and service partners
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="gap-2 bg-indigo-600 font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <UserPlusIcon />
          Add Staff / Vendor
        </Button>

      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <SummaryCard
          title="Total Contacts"
          value={totalStaff}
          icon={<Users className="h-4 w-4" />}
          color="indigo"
        />

        <SummaryCard
          title="Available"
          value={availableCount}
          icon={<UserCheck className="h-4 w-4" />}
          color="emerald"
        />

        <SummaryCard
          title="Busy"
          value={busyCount}
          icon={<Wrench className="h-4 w-4" />}
          color="amber"
        />

        <SummaryCard
          title="Inactive"
          value={inactiveCount}
          icon={<Briefcase className="h-4 w-4" />}
          color="slate"
        />

      </div>

      {/* SEARCH AND FILTER */}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">

        <div className="relative flex-1">

          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

          <input
            type="text"
            placeholder="Search name, category, phone or property..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 text-sm outline-none focus:border-indigo-500 focus:bg-white"
          />

        </div>

        <div className="flex items-center gap-2">

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 sm:w-48"
          >
            <option value="All">All Categories</option>

            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={loadStaff}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

        </div>

      </div>

      {/* RESULTS COUNT */}

      <div className="flex items-center justify-between">

        <p className="text-xs font-semibold text-slate-500">
          Showing {filteredStaff.length} of {totalStaff} contacts
        </p>

        <p className="text-xs text-slate-400">
          {vendorCount} service providers
        </p>

      </div>

      {/* STAFF CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {isLoading ? (

          <div className="col-span-full py-16 text-center text-sm text-slate-400">
            Loading staff data...
          </div>

        ) : filteredStaff.length === 0 ? (

          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">

            <Users className="mx-auto h-10 w-10 text-slate-300" />

            <h3 className="mt-3 text-sm font-bold text-slate-700">
              No Staff Found
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Add a new staff member or change your search.
            </p>

            <Button
              onClick={handleOpenAdd}
              className="mt-4 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>

          </div>

        ) : (

          filteredStaff.map((staff) => (

            <div
              key={staff._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 hover:shadow-md"
            >

              {/* CARD HEADER */}

              <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">

                  <span className="inline-block rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                    {staff.category}
                  </span>

                  <h3 className="mt-2 break-words text-base font-bold text-slate-900">
                    {staff.name}
                  </h3>

                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusStyle(staff.status)}`}
                >
                  {staff.status}
                </span>

              </div>

              {/* CARD DETAILS */}

              <div className="mt-4 space-y-3 border-t border-slate-100 pt-3 text-xs text-slate-600">

                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="font-semibold text-slate-800">
                    {staff.phone}
                  </span>
                </div>

                {staff.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{staff.email}</span>
                  </div>
                )}

                {staff.propertyName && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">
                      {staff.propertyName}
                    </span>
                  </div>
                )}

              </div>

              {/* CARD FOOTER */}

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">

                <a
                  href={`tel:${staff.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call Now
                </a>

                <div className="flex items-center gap-1">

                  <button
                    type="button"
                    onClick={() => handleEdit(staff)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                    title="Edit Staff"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(staff._id, staff.name)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    title="Delete Staff"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                </div>

              </div>

            </div>

          ))

        )}

      </div>

      {/* ADD / EDIT MODAL */}

      {isModalOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">

          <div className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 pb-4">

              <div>

                <h3 className="text-lg font-bold text-slate-900">
                  {editingStaff
                    ? "Edit Staff / Vendor"
                    : "Add Staff / Vendor"}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Enter contact and service information.
                </p>

              </div>

              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">

              {/* NAME */}

              <div>

                <label className="text-xs font-semibold text-slate-700">
                  Full Name / Company Name *
                </label>

                <input
                  type="text"
                  required
                  minLength={2}
                  placeholder="e.g. Sunil Shinde"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                />

              </div>

              {/* CATEGORY */}

              <div>

                <label className="text-xs font-semibold text-slate-700">
                  Trade / Service Category *
                </label>

                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as Staff["category"],
                    })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                >

                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}

                </select>

              </div>

              {/* PHONE */}

              <div>

                <label className="text-xs font-semibold text-slate-700">
                  Phone Number *
                </label>

                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                />

              </div>

              {/* EMAIL */}

              <div>

                <label className="text-xs font-semibold text-slate-700">
                  Email Address
                </label>

                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                />

              </div>

              {/* ASSIGNED PROPERTY */}

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Assigned Property
                </label>

                <select
                  value={formData.propertyName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      propertyName: e.target.value,
                    })
                  }
                  disabled={isPropertiesLoading}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">
                    {isPropertiesLoading
                      ? "Loading properties..."
                      : "Select Property"}
                  </option>

                  {properties.map((property) => (
                    <option key={property._id} value={property.name}>
                      {property.name}
                    </option>
                  ))}
                </select>

                {!isPropertiesLoading && properties.length === 0 && (
                  <p className="mt-1 text-xs text-rose-500">
                    No properties available. Please add a property first.
                  </p>
                )}
              </div>

              {/* STATUS */}

              <div>

                <label className="text-xs font-semibold text-slate-700">
                  Staff Status
                </label>

                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as Staff["status"],
                    })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="Inactive">Inactive</option>
                </select>

              </div>

              {/* FORM BUTTONS */}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">

                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {isSaving
                    ? "Saving..."
                    : editingStaff
                      ? "Update Staff"
                      : "Save Contact"}
                </Button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

// =============================================================================
// SUMMARY CARD COMPONENT
// =============================================================================

function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "indigo" | "emerald" | "amber" | "slate";
}) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">

      <div className="flex items-center justify-between">

        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </span>

        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors[color]}`}>
          {icon}
        </span>

      </div>

      <p className="mt-2 text-2xl font-extrabold text-slate-900">
        {value}
      </p>

    </div>
  );
}

// =============================================================================
// SMALL ICON COMPONENT
// =============================================================================

function UserPlusIcon() {
  return <Plus className="h-4 w-4" />;
}
