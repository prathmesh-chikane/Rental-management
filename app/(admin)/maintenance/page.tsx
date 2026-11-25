"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Home,
  MessageSquare,
  Play,
  Plus,
  RotateCcw,
  Search,
  User,
  Wrench,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";

// =============================================================================
// TYPES
// =============================================================================

type Ticket = {
  _id: string;
  ticketNo: string;
  title: string;
  propertyName: string;
  unit: string;
  category: string;
  priority: "Urgent" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Resolved";
  createdAt: string;
  updatedAt?: string;
  reportedBy?: string;
  assignedTo?: string;
};

type Property = {
  _id: string;
  name: string;
  isDeleted?: boolean;
};

type StaffOption = {
  _id: string;
  name: string;
  category: string;
  phone: string;
  status: string;
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function MaintenancePage() {
  // ---------------------------------------------------------------------------
  // STATES
  // ---------------------------------------------------------------------------

  const [tickets, setTickets] = useState<Ticket[]>([]);  //सर्व maintenance tickets साठवतो.
  const [properties, setProperties] = useState<Property[]>([]);
  const [availableStaff, setAvailableStaff] = useState<StaffOption[]>([]); //Staff आणि Vendors ची list साठवतो.
  const [selectedStaffId, setSelectedStaffId] = useState(""); //Admin ने कोणता staff निवडला आहे त्याचा ID साठवतो.
  const [isAssigning, setIsAssigning] = useState(false);  //Staff assign होत असताना loading state दाखवण्यासाठी.
  const [isReassigning, setIsReassigning] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");  // purn data dakhvt survatila

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);  //Admin ने View button क्लिक केल्यावर कोणता ticket दाखवायचा ते ठरवते.

  const [formData, setFormData] = useState({
    title: "",
    propertyName: "",
    unit: "",
    category: "",
    priority: "Medium" as Ticket["priority"],
  });

  // ---------------------------------------------------------------------------
  // LOAD MAINTENANCE TICKETS
  // ---------------------------------------------------------------------------

  const loadTickets = async () => {
    try {
      const response = await api.get<Ticket[]>("/maintenance");  //Ticket[] – Response हा Ticket objects चा array असावा, असे TypeScript ला सांगतो.

      setTickets(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Failed to load tickets:", error);
    }
  };
  // ---------------------------------------------------------------------------
  // LOAD PROPERTIES FROM MONGODB
  // ---------------------------------------------------------------------------

  const loadProperties = async () => {
    try {
      const response = await api.get<Property[]>("/properties");

      const activeProperties = Array.isArray(response)
        ? response.filter(
          (property) => property.isDeleted !== true   // deleted property does not showing
        )
        : [];

      setProperties(activeProperties);

      // Select first active property by default
      if (activeProperties.length > 0) {
        setFormData((prev) => ({   //prev – Form ची आधीची state.
          ...prev,
          propertyName:
            prev.propertyName || activeProperties[0].name,    //prev.propertyName मध्ये आधीच value असेल तर तीच वापर.आधीची value नसेल तर activeProperties[0].name वापर.
        }));
      }
    } catch (error) {
      console.error("Failed to load properties:", error);
    }
  };

  // ---------------------------------------------------------------------------
  // LOAD STAFF / VENDORS FROM MONGODB
  // ---------------------------------------------------------------------------

  const loadStaff = async () => {
    try {
      const res = await api.get<StaffOption[]>("/staff");
      setAvailableStaff(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to load staff:", err);
    }
  };

  // ---------------------------------------------------------------------------
  // ASSIGN STAFF / VENDOR TO TICKET
  // ---------------------------------------------------------------------------

  const handleAssignStaff = async (ticketId: string) => {
    if (!selectedStaffId) return;  //म्हणजे Staff select केला नसेल तर पुढचा code execute होणार नाही.

    const staffObj = availableStaff.find(
      (s) => s._id === selectedStaffId    //s._id – Staff चा ID.  s- staff object 
    );

    if (!staffObj) return;
    if (
      staffObj.status !== "Available" ||
      staffObj.category?.trim().toLowerCase() !==
      selectedTicket?.category?.trim().toLowerCase()
    ) {
      alert("Please select an available staff member from the correct category.");
      return;
    }
    try {
      setIsAssigning(true);

      const updated = await api.patch<Ticket>(
        `/maintenance/${ticketId}/assign`,
        {
          staffName: staffObj.name,
          staffPhone: staffObj.phone,
        }
      );

      setSelectedTicket(updated);
      setSelectedStaffId("");

      await loadTickets();

      // 3 seconds नंतर Reassign UI बंद
      setTimeout(() => {
        setIsReassigning(false);
      }, 1000);

    } catch (err) {
      console.error("Assign failed:", err);
      alert("Failed to assign staff.");
    } finally {
      setIsAssigning(false);
    }
  };

  // ---------------------------------------------------------------------------
  // LOAD DATA WHEN PAGE OPENS
  // ---------------------------------------------------------------------------

  useEffect(() => {
    loadTickets();
    loadProperties();
    loadStaff();
  }, []);

  // ---------------------------------------------------------------------------
  // SEARCH AND STATUS FILTER
  // ---------------------------------------------------------------------------

  const filteredTickets = tickets.filter((ticket) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      (ticket.title || "").toLowerCase().includes(searchText) ||
      (ticket.propertyName || "").toLowerCase().includes(searchText) ||
      (ticket.ticketNo || "").toLowerCase().includes(searchText) ||
      (ticket.unit || "").toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "All" ||
      ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ---------------------------------------------------------------------------
  // UPDATE TICKET STATUS
  // ---------------------------------------------------------------------------

  const handleToggleStatus = async (
    id: string,
    currentStatus: Ticket["status"]
  ) => {
    const nextStatus: Ticket["status"] =
      currentStatus === "Open"
        ? "In Progress"
        : currentStatus === "In Progress"
          ? "Resolved"
          : "Open";

    try {
      await api.patch(`/maintenance/${id}/status`, {
        status: nextStatus,
      });

      await loadTickets();
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  // ---------------------------------------------------------------------------
  // CREATE NEW MAINTENANCE TICKET
  // ---------------------------------------------------------------------------

  const handleCreateTicket = async (
    e: React.FormEvent<HTMLFormElement>   // Form submit झाल्यावर मिळणारा event
  ) => {
    e.preventDefault();

    if (!formData.title.trim()) return;

    if (!formData.propertyName) {
      alert("Please select a property");
      return;
    }

    try {
      await api.post("/maintenance", {
        title: formData.title,
        propertyName: formData.propertyName,
        unit: formData.unit || "Common Area",
        category: formData.category,
        priority: formData.priority,
      });

      await loadTickets();

      // Reset form
      setFormData({
        title: "",
        propertyName: "",
        unit: "",
        category: "",
        priority: "Medium",
      });

      setIsModalOpen(false);
    } catch (error) {
      console.error("Ticket creation failed:", error);
    }
  };

  // =============================================================================
  // UI
  // =============================================================================

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4 sm:px-6 lg:px-8">

      {/* ----------------- HEADER ----------------- */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Maintenance & Repairs
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Track reported issues, vendor assignments, and resolutions
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="gap-2 bg-indigo-600 font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Log Request
        </Button>
      </div>

      {/* ----------------- KPI CARDS ----------------- */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* Open Tickets */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Open Tickets
            </span>

            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
              <AlertCircle className="h-4 w-4" />
            </span>
          </div>

          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {tickets.filter((t) => t.status === "Open").length}
          </p>

          <p className="mt-1 text-xs text-rose-500">
            Requires attention
          </p>
        </div>

        {/* In Progress */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              In Progress
            </span>

            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
              <Clock className="h-4 w-4" />
            </span>
          </div>

          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {tickets.filter((t) => t.status === "In Progress").length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Currently being worked on
          </p>
        </div>

        {/* Resolved */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Resolved
            </span>

            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>

          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {tickets.filter((t) => t.status === "Resolved").length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Fixed successfully
          </p>
        </div>
      </div>

      {/* ----------------- SEARCH & FILTER ----------------- */}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">

        {/* Search */}

        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

          <input
            type="text"
            placeholder="Search by ticket issue, property, or unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>

        {/* Status Filter */}

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">
            Status:
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="All">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* ----------------- TICKETS TABLE ----------------- */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">

            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 pl-6 pr-4">Ticket & Issue</th>
                <th className="px-4 py-3.5">Property & Unit</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5">Reported Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="py-3.5 pl-4 pr-6 text-right">
                  Change Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map((t) => (
                <tr
                  key={t._id}
                  className="transition hover:bg-slate-50/50"
                >
                  <td className="py-4 pl-6 pr-4">
                    <p className="font-mono text-xs font-bold text-slate-400">
                      {t.ticketNo}
                    </p>

                    <p className="mt-0.5 font-bold text-slate-900">
                      {t.title}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900">
                      {t.propertyName}
                    </p>

                    <p className="text-xs text-slate-500">
                      {t.unit}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {t.category}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${t.priority === "Urgent"
                        ? "bg-rose-100 text-rose-700"
                        : t.priority === "High"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                        }`}
                    >
                      {t.priority}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-xs font-medium text-slate-500">
                    {new Date(t.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.status === "Resolved"
                        ? "bg-emerald-50 text-emerald-700"
                        : t.status === "In Progress"
                          ? "bg-sky-50 text-sky-700"
                          : "bg-amber-50 text-amber-700"
                        }`}
                    >
                      {t.status}
                    </span>
                  </td>

                  <td className="py-4 pl-4 pr-6 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTicket(t);
                        setIsViewModalOpen(true);
                      }}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 shadow-xs transition"
                      title="View Ticket Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredTickets.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-slate-500"
                  >
                    No maintenance tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- LOG MAINTENANCE MODAL ----------------- */}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[6px]">

          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-slate-900">
                  Log Maintenance Issue
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Create a new maintenance request for a property.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleCreateTicket}
              className="space-y-5 px-6 py-5"
            >

              {/* Issue Title */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Issue Title <span className="text-rose-500">*</span>
                </label>

                <input
                  type="text"
                  required
                  placeholder="e.g. Geyser leakage in Flat 302"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              {/* Property */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Property <span className="text-rose-500">*</span>
                </label>

                <select
                  value={formData.propertyName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      propertyName: e.target.value,
                    })
                  }
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                >
                  <option value="">Select Property</option>

                  {properties.map((property) => (
                    <option key={property._id} value={property.name}>
                      {property.name}
                    </option>
                  ))}
                </select>

                {properties.length === 0 && (
                  <p className="mt-1.5 text-xs text-rose-500">
                    No active properties available.
                  </p>
                )}
              </div>

              {/* Unit / Location */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Unit / Location
                </label>

                <input
                  type="text"
                  placeholder="e.g. Flat 302 or Common Lift"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      unit: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* Category */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Category
                  </label>

                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  >
                    <option value="">Choose Category</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Appliance">Appliance</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Painting">Painting</option>
                    <option value="Cleaning">Cleaning</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Priority
                  </label>

                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as Ticket["priority"],
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 rounded-xl border-slate-200 px-5 text-sm font-medium"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={properties.length === 0}
                  className="h-10 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save Ticket
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* 🎯 CENTER TICKET DETAILS MODAL (तंतोतंत फोटोसारखा आणि 100% वर्किंग)        */}
      {/* ========================================================================= */}
      {isViewModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">

            {/* 1. Header */}
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Wrench className="h-4 w-4" />
                </span>
                <h3 className="text-base font-extrabold text-slate-900">Ticket Details</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedTicket(null);
                }}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* 2. Ticket ID & Priority Badge */}
              <div className="flex items-center justify-between pt-1">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  {selectedTicket.ticketNo}
                </h2>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-bold ${selectedTicket.priority === "Urgent"
                    ? "bg-rose-100 text-rose-600"
                    : selectedTicket.priority === "High"
                      ? "bg-amber-100 text-amber-700"
                      : selectedTicket.priority === "Medium"
                        ? "bg-sky-100 text-sky-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                >
                  {selectedTicket.priority}
                </span>
              </div>

              {/* 3. Description / Issue Title */}
              <p className="text-sm font-semibold text-slate-800 leading-snug">
                {selectedTicket.title}
              </p>

              {/* 4. Metadata List (Property, Flat, Date, Reported by) */}
              <div className="space-y-3 pt-1 text-xs font-medium text-slate-700">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-slate-900">{selectedTicket.propertyName}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Home className="h-4 w-4 text-slate-400" />
                  <span>{selectedTicket.unit}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>
                    Reported:{" "}
                    {new Date(selectedTicket.createdAt || Date.now()).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <span>Reported by: {selectedTicket.reportedBy || "Tenant"}</span>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* 5. Status & Actions (Stepper + Working Action Button) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Status & Actions
                </h4>

                {/* Stepper Dots & Line */}
                <div className="relative flex items-center justify-between px-6 pt-2">
                  <div className="absolute left-10 right-10 top-5 -z-0 h-0.5 bg-slate-200" />

                  {/* Open Circle */}
                  <div className="relative z-10 flex flex-col items-center">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white transition ${selectedTicket.status === "Open"
                        ? "border-rose-500 ring-4 ring-rose-100"
                        : "border-slate-300"
                        }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${selectedTicket.status === "Open" ? "bg-rose-500" : "bg-transparent"
                          }`}
                      />
                    </span>
                    <span
                      className={`mt-1.5 text-[11px] font-bold ${selectedTicket.status === "Open" ? "text-slate-900" : "text-slate-400"
                        }`}
                    >
                      Open
                    </span>
                  </div>

                  {/* In Progress Circle */}
                  <div className="relative z-10 flex flex-col items-center">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white transition ${selectedTicket.status === "In Progress"
                        ? "border-indigo-500 ring-4 ring-indigo-100"
                        : "border-slate-300"
                        }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${selectedTicket.status === "In Progress" ? "bg-indigo-600" : "bg-transparent"
                          }`}
                      />
                    </span>
                    <span
                      className={`mt-1.5 text-[11px] font-bold ${selectedTicket.status === "In Progress" ? "text-slate-900" : "text-slate-400"
                        }`}
                    >
                      In Progress
                    </span>
                  </div>

                  {/* Resolved Circle */}
                  <div className="relative z-10 flex flex-col items-center">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white transition ${selectedTicket.status === "Resolved"
                        ? "border-emerald-500 ring-4 ring-emerald-100"
                        : "border-slate-300"
                        }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${selectedTicket.status === "Resolved" ? "bg-emerald-600" : "bg-transparent"
                          }`}
                      />
                    </span>
                    <span
                      className={`mt-1.5 text-[11px] font-bold ${selectedTicket.status === "Resolved" ? "text-slate-900" : "text-slate-400"
                        }`}
                    >
                      Resolved
                    </span>
                  </div>
                </div>

                {/* Action Button: थेट Backend ला कॉल करून स्टेटस बदलतो */}
                <button
                  type="button"
                  onClick={async () => {
                    const nextStatus =
                      selectedTicket.status === "Open"
                        ? "In Progress"
                        : selectedTicket.status === "In Progress"
                          ? "Resolved"
                          : "Open";

                    // 1. Backend API कॉल
                    await handleToggleStatus(selectedTicket._id, selectedTicket.status);

                    // 2. या मॉडेलमधील स्टेटस पण लगेच अपडेट
                    setSelectedTicket({ ...selectedTicket, status: nextStatus });
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 active:scale-98"
                >
                  {selectedTicket.status === "Open" && (
                    <>
                      <Play className="h-3.5 w-3.5 fill-white" /> Mark as In Progress
                    </>
                  )}
                  {selectedTicket.status === "In Progress" && (
                    <>
                      <Check className="h-4 w-4" /> Mark as Resolved
                    </>
                  )}
                  {selectedTicket.status === "Resolved" && (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" /> Re-open Ticket
                    </>
                  )}
                </button>
              </div>

              {/* ----------------- Assign Staff / Vendor Section ----------------- */}

              <div className="space-y-3 pt-2 border-t border-slate-100">

                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Assign Staff / Vendor
                  </h4>

                  {selectedTicket.assignedTo && !isReassigning && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsReassigning(true);
                        setSelectedStaffId("");
                      }}
                      className="flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-600 hover:bg-indigo-100"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reassign
                    </button>
                  )}
                </div>

                {/* Currently Assigned Staff */}

                {selectedTicket.assignedTo && !isReassigning && (
                  <div className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
                        {selectedTicket.assignedTo.charAt(0)}
                      </div>

                      <div>
                        <p className="font-bold text-indigo-950">
                          {selectedTicket.assignedTo}
                        </p>
                        <p className="text-[10px] font-medium text-indigo-600">
                          Currently Assigned Technician
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Active
                    </span>
                  </div>
                )}

                {/* Assign / Reassign Dropdown */}

                {(!selectedTicket.assignedTo || isReassigning) && (
                  <div className="space-y-2">

                    {isReassigning && (
                      <p className="text-xs text-slate-500">
                        Currently assigned: <span className="font-bold text-slate-800">
                          {selectedTicket.assignedTo}
                        </span>
                      </p>
                    )}

                    <select
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium outline-none focus:border-indigo-500"
                    >
                      <option value="">
                        Select Staff / Vendor ({selectedTicket.category})
                      </option>

                      {availableStaff
                        .filter(
                          (s) =>
                            (s.status === "Available" &&
                              s.category === selectedTicket.category) &&
                            s.name !== selectedTicket.assignedTo
                        )
                        .map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name} ({s.category} • {s.phone})
                          </option>
                        ))}
                    </select>

                    <div className="flex gap-2">

                      <button
                        type="button"
                        disabled={!selectedStaffId || isAssigning}
                        onClick={() => handleAssignStaff(selectedTicket._id)}
                        className="flex-1 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isAssigning
                          ? "Processing..."
                          : isReassigning
                            ? "Confirm Reassign"
                            : "Assign"}
                      </button>

                    </div>
                  </div>
                )}

              </div>

              {/* 6. Real Activity Timeline (प्रत्यक्ष Database मधील वेळेनुसार) */}
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Activity Timeline
                </h4>

                <div className="space-y-3 pl-2">

                  {/* Step 1: Ticket Created */}
                  <div className="relative flex items-start gap-3 border-l-2 border-indigo-500 pb-3 pl-4">
                    <span className="absolute -left-[7px] top-0 h-3 w-3 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />

                    <div>
                      <p className="text-[11px] text-slate-400">
                        {new Date(
                          selectedTicket.createdAt || Date.now()
                        ).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>

                      <p className="text-xs font-bold text-slate-800">
                        Ticket created
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Staff Assigned */}
                  {selectedTicket.assignedTo && (
                    <div className="relative flex items-start gap-3 border-l-2 border-purple-500 pb-3 pl-4">
                      <span className="absolute -left-[7px] top-0 h-3 w-3 rounded-full bg-purple-500 ring-4 ring-purple-50" />

                      <div>
                        <p className="text-[11px] text-slate-400">
                          {new Date(
                            selectedTicket.updatedAt || selectedTicket.createdAt
                          ).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>

                        <p className="text-xs font-bold text-purple-700">
                          Assigned to {selectedTicket.assignedTo}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Work Started / Completed */}
                  {selectedTicket.status !== "Open" && (
                    <div className="relative flex items-start gap-3 border-l-2 border-emerald-500 pb-3 pl-4">
                      <span className="absolute -left-[7px] top-0 h-3 w-3 rounded-full bg-emerald-300 ring-4 ring-emerald-50" />

                      <div>
                        <p className="text-[11px] text-slate-400">
                          {new Date(
                            selectedTicket.updatedAt || Date.now()
                          ).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>

                        <p className="text-xs font-bold text-emerald-500">
                          {selectedTicket.status === "Resolved"
                            ? "Work Completed"
                            : "Work Started"}
                        </p>

                        {selectedTicket.assignedTo && (
                          <p className="text-[11px] text-slate-500">
                            By {selectedTicket.assignedTo}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Step 4: Ticket Resolved */}
                  {selectedTicket.status === "Resolved" && (
                    <div className="relative flex items-start gap-3 pl-4">
                      <span className="absolute -left-[7px] top-0 h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-emerald-50" />

                      <div>
                        <p className="text-[11px] text-slate-400">
                          {new Date(
                            selectedTicket.updatedAt || Date.now()
                          ).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>

                        <p className="text-xs font-bold text-emerald-700">
                          Ticket Resolved
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
