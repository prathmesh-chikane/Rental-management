"use client";

// =============================================================================
// app/(admin)/maintenance/page.tsx - MAINTENANCE & REPAIR TICKETS
//
// Beginner-friendly code:
// - Track maintenance issues, priority (Urgent, High, Low)
// - Update status (Open, In Progress, Resolved) with one click
// - Log new ticket modal
// =============================================================================

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Search,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Ticket = {
  id: string;
  ticketNo: string;
  title: string;
  propertyName: string;
  unit: string;
  category: string;
  priority: "Urgent" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Resolved";
  date: string;
};

const INITIAL_TICKETS: Ticket[] = [
  {
    id: "m-1",
    ticketNo: "TKT-101",
    title: "Geyser not heating in Master Bath",
    propertyName: "Greenfield Heights",
    unit: "Flat 302",
    category: "Appliance",
    priority: "Urgent",
    status: "Open",
    date: "15 Nov 2026",
  },
  {
    id: "m-2",
    ticketNo: "TKT-102",
    title: "Lift door sensor fault",
    propertyName: "Lakeview Towers",
    unit: "Tower B",
    category: "Electrical",
    priority: "High",
    status: "In Progress",
    date: "14 Nov 2026",
  },
  {
    id: "m-3",
    ticketNo: "TKT-103",
    title: "Corridor light replacement",
    propertyName: "Royal Palms",
    unit: "Block A",
    category: "Electrical",
    priority: "Low",
    status: "Open",
    date: "12 Nov 2026",
  },
  {
    id: "m-4",
    ticketNo: "TKT-104",
    title: "Kitchen sink tap leakage",
    propertyName: "Greenfield Heights",
    unit: "Flat 204",
    category: "Plumbing",
    priority: "Medium",
    status: "In Progress",
    date: "14 Nov 2026",
  },
  {
    id: "m-5",
    ticketNo: "TKT-105",
    title: "Main door lock replacement",
    propertyName: "Silver Oak Enclave",
    unit: "Studio 105",
    category: "Carpentry",
    priority: "Low",
    status: "Resolved",
    date: "08 Nov 2026",
  },
];

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Ticket Form State
  const [formData, setFormData] = useState({
    title: "",
    propertyName: "Greenfield Heights",
    unit: "",
    category: "Plumbing",
    priority: "Medium" as Ticket["priority"],
  });

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.propertyName.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketNo.toLowerCase().includes(search.toLowerCase()) ||
      t.unit.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Status toggle handler
  const handleToggleStatus = (id: string) => {
    setTickets(
      tickets.map((t) => {
        if (t.id === id) {
          const nextStatus: Ticket["status"] =
            t.status === "Open"
              ? "In Progress"
              : t.status === "In Progress"
                ? "Resolved"
                : "Open";
          return { ...t, status: nextStatus };
        }
        return t;
      }),
    );
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const newTicket: Ticket = {
      id: `m-${Date.now()}`,
      ticketNo: `TKT-${Math.floor(100 + Math.random() * 900)}`,
      title: formData.title,
      propertyName: formData.propertyName,
      unit: formData.unit || "Common Area",
      category: formData.category,
      priority: formData.priority,
      status: "Open",
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };

    setTickets([newTicket, ...tickets]);
    setFormData({
      title: "",
      propertyName: "Greenfield Heights",
      unit: "",
      category: "Plumbing",
      priority: "Medium",
    });
    setIsModalOpen(false);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      {/* ----------------- Header ----------------- */}
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
          <Plus className="h-4 w-4" /> Log Request
        </Button>
      </div>

      {/* ----------------- KPI Cards ----------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          <p className="mt-1 text-xs text-rose-500">Requires attention</p>
        </div>

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
          <p className="mt-1 text-xs text-slate-500">Currently being worked on</p>
        </div>

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
          <p className="mt-1 text-xs text-slate-500">Fixed successfully</p>
        </div>
      </div>

      {/* ----------------- Search & Filter ----------------- */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
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

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="All">All Requests</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* ----------------- Tickets List / Table ----------------- */}
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
                <th className="py-3.5 pl-4 pr-6 text-right">Change Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 pl-6 pr-4">
                    <p className="font-mono text-xs font-bold text-slate-400">{t.ticketNo}</p>
                    <p className="mt-0.5 font-bold text-slate-900">{t.title}</p>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900">{t.propertyName}</p>
                    <p className="text-xs text-slate-500">{t.unit}</p>
                  </td>

                  <td className="px-4 py-4">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {t.category}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${
                        t.priority === "Urgent"
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
                    {t.date}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        t.status === "Resolved"
                          ? "bg-emerald-50 text-emerald-700"
                          : t.status === "In Progress"
                            ? "bg-sky-50 text-sky-700"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>

                  <td className="py-4 pl-4 pr-6 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(t.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-indigo-600"
                    >
                      Next Step →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- Log Maintenance Modal ----------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Log Maintenance Issue</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Issue Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Geyser leakage in Flat 302"
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
                  Unit / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 302 or Common Lift"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Appliance">Appliance</option>
                  <option value="Carpentry">Carpentry</option>
                  <option value="Cleaning">Cleaning</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
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
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
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
                  Save Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
