"use client";

// =============================================================================
// app/(admin)/staff-vendors/page.tsx - STAFF & VENDORS MANAGEMENT
//
// Beginner-friendly code:
// - Directory of electricians, plumbers, security guards, cleaners, AMC vendors
// - Add Staff/Vendor modal
// =============================================================================

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  CheckCircle2,
  Mail,
  Phone,
  Plus,
  Search,
  Star,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Vendor = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  assignedProperty: string;
  type: "Staff" | "Vendor";
  status: "Active" | "Inactive";
};

const INITIAL_VENDORS: Vendor[] = [
  {
    id: "v-1",
    name: "Sunil Shinde",
    role: "Electrician",
    phone: "+91 98220 44551",
    email: "sunil.electric@example.com",
    assignedProperty: "Greenfield Heights",
    type: "Vendor",
    status: "Active",
  },
  {
    id: "v-2",
    name: "Ganesh Kadam",
    role: "Plumber",
    phone: "+91 98199 12890",
    email: "ganesh.plumbing@example.com",
    assignedProperty: "Lakeview Towers",
    type: "Vendor",
    status: "Active",
  },
  {
    id: "v-3",
    name: "Apex Elevator AMC Services",
    role: "Lift Maintenance AMC",
    phone: "+91 22 2840 9900",
    email: "support@apexelevators.in",
    assignedProperty: "Lakeview Towers",
    type: "Vendor",
    status: "Active",
  },
  {
    id: "v-4",
    name: "Ramesh Pawar",
    role: "Head Security Guard",
    phone: "+91 97660 33211",
    email: "ramesh.security@example.com",
    assignedProperty: "Royal Palms",
    type: "Staff",
    status: "Active",
  },
  {
    id: "v-5",
    name: "Laxmi Cleaning Services",
    role: "Housekeeping & Sanitization",
    phone: "+91 98920 88771",
    email: "laxmi.clean@example.com",
    assignedProperty: "All Properties",
    type: "Vendor",
    status: "Active",
  },
];

export default function StaffVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    assignedProperty: "Greenfield Heights",
    type: "Vendor" as Vendor["type"],
  });

  const filtered = vendors.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.role.toLowerCase().includes(search.toLowerCase()) ||
      item.assignedProperty.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "All" || item.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role) return;

    const newVendor: Vendor = {
      id: `v-${Date.now()}`,
      name: formData.name,
      role: formData.role,
      phone: formData.phone || "+91 98000 00000",
      email: formData.email || "vendor@example.com",
      assignedProperty: formData.assignedProperty,
      type: formData.type,
      status: "Active",
    };

    setVendors([newVendor, ...vendors]);
    setFormData({
      name: "",
      role: "",
      phone: "",
      email: "",
      assignedProperty: "Greenfield Heights",
      type: "Vendor",
    });
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setVendors(vendors.filter((v) => v.id !== id));
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      {/* ----------------- Header ----------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Staff & Vendors Directory
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage electricians, plumbers, security guards, and AMC partners
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="gap-2 bg-indigo-600 font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4" /> Add Staff / Vendor
        </Button>
      </div>

      {/* ----------------- Summary Cards ----------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Contacts
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <UserCheck className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {vendors.filter((v) => v.status === "Active").length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Staff & service providers</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Vendors & Contractors
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <Wrench className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {vendors.filter((v) => v.type === "Vendor").length}
          </p>
          <p className="mt-1 text-xs text-slate-500">On-call maintenance specialists</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Internal Staff
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
              <Briefcase className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {vendors.filter((v) => v.type === "Staff").length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Security & caretakers</p>
        </div>
      </div>

      {/* ----------------- Search & Filter ----------------- */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, trade/role, or property..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filter:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="All">All Categories</option>
            <option value="Vendor">Vendors (Plumber, Electrician, AMC)</option>
            <option value="Staff">Internal Staff (Security, Cleaning)</option>
          </select>
        </div>
      </div>

      {/* ----------------- Vendor Cards Grid ----------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((v) => (
          <div
            key={v.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {v.type}
                </span>
                <h3 className="mt-2 text-base font-bold text-slate-900">{v.name}</h3>
                <p className="text-xs font-semibold text-indigo-600">{v.role}</p>
              </div>

              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium text-slate-800">{v.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate">{v.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                <span>Assigned: {v.assignedProperty}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <a
                href={`tel:${v.phone}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
              >
                <Phone className="h-3.5 w-3.5" /> Call Now
              </a>

              <button
                type="button"
                onClick={() => handleDelete(v.id)}
                className="text-slate-400 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ----------------- Add Vendor Modal ----------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">
                Add Staff or Vendor
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddVendor} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Full Name / Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Pawar or Apex Lift Services"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Trade / Service / Role *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electrician, Plumber, Security Guard"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98000 00000"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as Vendor["type"],
                      })
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="Vendor">Vendor (On-call)</option>
                    <option value="Staff">Staff (Payroll)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Assigned Property
                </label>
                <select
                  value={formData.assignedProperty}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedProperty: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="All Properties">All Properties</option>
                  <option value="Greenfield Heights">Greenfield Heights</option>
                  <option value="Lakeview Towers">Lakeview Towers</option>
                  <option value="Royal Palms">Royal Palms</option>
                  <option value="Silver Oak Enclave">Silver Oak Enclave</option>
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
                  Save Contact
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
