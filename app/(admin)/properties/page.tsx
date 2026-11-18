"use client";

// =============================================================================
// page.tsx  (the Properties page)
//
// This file is the "boss". It:
//   1. loads the properties from the backend,
//   2. remembers what the user is doing (search, filter, view mode, page, pop-ups),
//   3. displays portfolio KPI metrics,
//   4. hands the data to PropertyCard and PropertyTable components.
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  ChevronDown,
  Home,
  IndianRupee,
  LayoutGrid,
  LayoutList,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  TrendingUp,
  WifiOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { propertyPortfolios } from "@/lib/mock-data/dashboard";
import DeleteDialog from "./DeleteDialog";
import PropertyCard from "./PropertyCard";
import PropertyForm from "./PropertyForm";
import PropertyTable from "./PropertyTable";
import {
  calculateTotals,
  cleanProperty,
  formatRent,
  getId,
  getStatus,
  isLocal,
  mergeResponse,
  PROPERTIES_STORAGE_KEY,
  PROPERTY_TYPES,
  statusFor,
  type Property,
  type PropertyPayload,
} from "./property-utils";
import type { UnitPayload } from "./unit-utils";

// How many rows the user can pick per page. Multiples of 3 fit the 3-column card grid.
const ROWS_PER_PAGE_OPTIONS = [6, 12, 24, 48];

// Builds the page buttons, e.g. [1, "...", 4, 5, 6, "...", 20].
// It always shows the first page, the last page, and the pages around the current one.
function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("...");
  for (let page = start; page <= end; page++) pages.push(page);
  if (end < total - 1) pages.push("...");

  pages.push(total);
  return pages;
}

export default function PropertiesPage() {
  // ---------------------------------------------------------------------------
  // STATE: things the page needs to remember
  // ---------------------------------------------------------------------------

  // The data
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  // Search and filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [view, setView] = useState<"cards" | "table">("cards");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);

  // The Add / Edit form
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // The Delete pop-up
  const [deleting, setDeleting] = useState<Property | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Toast notification
  const [message, setMessage] = useState("");

  // ---------------------------------------------------------------------------
  // LOAD DATA: runs once, when the page opens.
  // ---------------------------------------------------------------------------
  // Helper: apply any occupancy overrides saved by the Tenants page into localStorage.
  // The Tenants page writes { name, occupied } pairs whenever a tenant is added/edited/deleted.
  // This keeps both pages in sync without a page refresh.
  function applyOccupancyOverrides(list: Property[]): Property[] {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(PROPERTIES_STORAGE_KEY) : null;
      if (!raw) return list;
      const overrides = JSON.parse(raw) as Array<{ name: string; occupied: number }>;
      return list.map((p) => {
        const override = overrides.find((o) => o.name === p.name);
        if (!override) return p;
        // Clamp occupied to [0, units]
        const newOccupied = Math.max(0, Math.min(p.units, override.occupied));
        return { ...p, occupied: newOccupied, status: statusFor(p.units, newOccupied) };
      });
    } catch {
      return list; // If anything goes wrong, just return the original list
    }
  }

  useEffect(() => {
    async function loadProperties() {
      try {
        const response = await api.get<Property[] | { data: Property[] }>("/properties");
        const list = Array.isArray(response) ? response : (response.data ?? []);
        // Apply any occupancy overrides saved from the Tenants page
        setItems(applyOccupancyOverrides(list.map(cleanProperty)));
      } catch {
        setOffline(true);
        setItems(applyOccupancyOverrides(propertyPortfolios.map(cleanProperty)));
      } finally {
        setLoading(false);
      }
    }

    loadProperties();

    // Also react to storage changes (e.g. user has both pages open in the same browser)
    function handleStorageChange(e: StorageEvent) {
      if (e.key === PROPERTIES_STORAGE_KEY) {
        setItems((prev) => applyOccupancyOverrides(prev));
      }
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Hide toast after 3 seconds
  useEffect(() => {
    if (message === "") return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  // ---------------------------------------------------------------------------
  // SEARCH + FILTER
  // ---------------------------------------------------------------------------
  const searchText = search.trim().toLowerCase();

  // The official types, plus any other type that exists in the data (so nothing is unfilterable).
  const allTypes = useMemo(() => {
    const extraTypes = items.map((property) => property.type).filter((t) => !PROPERTY_TYPES.includes(t));
    return ["All", ...Array.from(new Set([...PROPERTY_TYPES, ...extraTypes]))];
  }, [items]);

  const visibleItems = useMemo(() => {
    return items.filter((property) => {
      const matchesSearch =
        searchText === "" ||
        property.name.toLowerCase().includes(searchText) ||
        property.location.toLowerCase().includes(searchText) ||
        property.type.toLowerCase().includes(searchText) ||
        property.tags.some((t) => t.toLowerCase().includes(searchText));

      const matchesType = typeFilter === "All" || property.type === typeFilter;
      const matchesStatus = statusFilter === "All" || getStatus(property) === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [items, searchText, typeFilter, statusFilter]);

  const isFiltered = searchText !== "" || typeFilter !== "All" || statusFilter !== "All";

  // Changing a search or filter always jumps back to page 1.
  function handleSearchChange(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handleTypeChange(value: string) {
    setTypeFilter(value);
    setCurrentPage(1);
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  function resetFilters() {
    setSearch("");
    setTypeFilter("All");
    setStatusFilter("All");
    setCurrentPage(1);
  }

  // ---------------------------------------------------------------------------
  // PAGINATION
  // ---------------------------------------------------------------------------
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / itemsPerPage));

  // If the current page no longer exists (for example after deleting the last
  // item on it), quietly fall back to the last page.
  const page = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return visibleItems.slice(startIndex, startIndex + itemsPerPage);
  }, [visibleItems, page, itemsPerPage]);

  function handleRowsChange(value: number) {
    setItemsPerPage(value);
    setCurrentPage(1);
  }

  // ---------------------------------------------------------------------------
  // PORTFOLIO TOTALS
  // ---------------------------------------------------------------------------
  const totals = useMemo(() => calculateTotals(items), [items]);
  const typesInPortfolio = useMemo(() => new Set(items.map((p) => p.type)).size, [items]);

  // ---------------------------------------------------------------------------
  // DIALOG HANDLERS
  // ---------------------------------------------------------------------------
  function openAddForm() {
    setEditing(null);
    setFormError("");
    setFormOpen(true);
  }

  function openEditForm(property: Property) {
    setEditing(property);
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
  }

  function openDeleteDialog(property: Property) {
    setDeleteError("");
    setDeleting(property);
  }

  function closeDeleteDialog() {
    setDeleting(null);
  }

  // ---------------------------------------------------------------------------
  // SAVE
  // ---------------------------------------------------------------------------
  async function handleSave(payload: PropertyPayload, units: UnitPayload[]) {
    setSaving(true);
    setFormError("");

    try {
      if (editing) {
        // ----- EDIT an existing property -----
        const id = getId(editing);
        const updated = { ...editing, ...payload, _id: editing._id, id: editing.id };

        if (offline || isLocal(id)) {
          setItems((prev) => prev.map((p) => (getId(p) === id ? cleanProperty(updated) : p)));
        } else {
          const response = await api.put<Property | { data: Property }>(
            `/properties/${id}`,
            payload,
          );
          setItems((prev) =>
            prev.map((p) => (getId(p) === id ? cleanProperty(mergeResponse(updated, response)) : p)),
          );
          await api.put(`/properties/${id}/units`, { units });
        }
        setMessage(offline || isLocal(id) ? `${payload.name} updated in demo mode` : `${payload.name} updated successfully`);
      } else {
        // ----- ADD a new property -----
        let newProperty: Property;

        if (offline) {
          newProperty = cleanProperty({ ...payload, id: `local-${Date.now()}` });
        } else {
          const response = await api.post<Property | { data: Property }>("/properties", payload);
          newProperty = cleanProperty(mergeResponse(payload, response));
          if (!newProperty._id) {
            throw new Error("The saved property did not include its database ID.");
          }
        }

        setItems((prev) => [newProperty, ...prev]);
        setCurrentPage(1);
        if (!offline && newProperty._id) {
          try {
            await api.put(`/properties/${newProperty._id}/units`, { units });
          } catch (error) {
            setEditing(newProperty);
            throw error;
          }
          setEditing(newProperty);
        }
        setMessage(offline ? `${payload.name} added in demo mode` : `${payload.name} added successfully`);
      }

      setFormOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------
  async function handleDelete() {
    if (!deleting) return;

    const id = getId(deleting);
    setDeleteBusy(true);
    setDeleteError("");

    try {
      if (!offline && !isLocal(id)) {
        await api.delete(`/properties/${id}`);
      }

      setItems((prev) => prev.filter((p) => getId(p) !== id));
      setMessage(`${deleting.name} deleted`);
      setDeleting(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Could not delete. Please try again.");
    } finally {
      setDeleteBusy(false);
    }
  }

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-slate-700">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-bold">Loading your properties page...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER PAGE
  // ---------------------------------------------------------------------------
  return (
    <div className="mx-auto w-full max-w-screen-xl space-y-6 px-4 pb-20 sm:px-6 lg:px-8">
      {/* ===== Header ===== */}
      <header className="flex flex-col gap-4 border-b border-slate-300 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Properties</h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Manage your buildings, unit occupancies, rental revenues, and leases.
          </p>
        </div>

        <Button
          size="lg"
          onClick={openAddForm}
          className="h-11 gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5" /> Add Property
        </Button>
      </header>

      {/* ===== Demo mode warning if backend is offline ===== */}
      {offline && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-2xs">
          <WifiOff className="h-5 w-5 shrink-0 text-amber-700" />
          <span>
            <strong>Demo Mode:</strong> The backend is unreachable. You are viewing sample data, and
            any changes will be lost when you refresh the page.
          </span>
        </div>
      )}

      {/* ===== KPI Metric Cards ===== */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {[
          {
            label: "Total Properties",
            value: totals.totalProperties,
            sub: `${typesInPortfolio} ${typesInPortfolio === 1 ? "property type" : "property types"}`,
            icon: Building2,
            iconColor: "text-indigo-700",
            iconBg: "bg-indigo-100",
          },
          {
            label: "Total Units",
            value: `${totals.totalOccupied} / ${totals.totalUnits}`,
            sub: `${totals.totalUnits - totals.totalOccupied} vacant units`,
            icon: Home,
            iconColor: "text-sky-700",
            iconBg: "bg-sky-100",
          },
          {
            label: "Occupancy Rate",
            value: `${totals.occupancyRate}%`,
            sub: totals.occupancyRate >= 80 ? "Healthy occupancy" : "Attention needed",
            icon: TrendingUp,
            iconColor: totals.occupancyRate >= 80 ? "text-emerald-700" : "text-amber-700",
            iconBg: totals.occupancyRate >= 80 ? "bg-emerald-100" : "bg-amber-100",
          },
          {
            label: "Monthly Rent",
            value: formatRent(totals.totalRent),
            sub: "Total recurring revenue",
            icon: IndianRupee,
            iconColor: "text-violet-700",
            iconBg: "bg-violet-100",
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="rounded-2xl border border-slate-300 bg-white py-0 shadow-xs transition-all hover:shadow-md"
          >
            <CardContent className="flex items-center gap-3.5 p-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}
              >
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold uppercase tracking-wider text-slate-500">
                  {stat.label}
                </p>
                <p className="text-xl font-black tabular-nums text-slate-950">{stat.value}</p>
                <p className="truncate text-[11px] font-medium text-slate-500">{stat.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ===== Filter & Controls Toolbar ===== */}
      <div className="space-y-3 rounded-2xl border border-slate-300 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by property name, location, or amenities..."
              className="h-10 border-slate-300 bg-slate-50/70 pl-10 pr-9 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-indigo-200"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filters & View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Property Type Dropdown */}
            <div className="relative">
              <select
                aria-label="Filter by property type"
                value={typeFilter}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="h-10 cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white px-3.5 pr-8 text-xs font-bold text-slate-900 shadow-2xs outline-none hover:border-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              >
                {allTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "All" ? "All Property Types" : type}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="h-10 cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white px-3.5 pr-8 text-xs font-bold text-slate-900 shadow-2xs outline-none hover:border-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="All">All Statuses</option>
                <option value="Fully Leased">Fully Leased</option>
                <option value="Has Vacancies">Has Vacancies</option>
                <option value="Vacant">Vacant</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-slate-300 bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => setView("cards")}
                className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all ${view === "cards"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Cards
              </button>
              <button
                type="button"
                onClick={() => setView("table")}
                className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all ${view === "table"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <LayoutList className="h-3.5 w-3.5" /> Table
              </button>
            </div>
          </div>
        </div>

        {/* Filter Summary & Quick Reset */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span>
              Showing <strong className="font-bold text-slate-950">{visibleItems.length}</strong> of{" "}
              <strong className="font-bold text-slate-950">{items.length}</strong> properties
            </span>
            {isFiltered && (
              <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700">
                Filtered view
              </span>
            )}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex cursor-pointer items-center gap-1 font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset all filters
            </button>
          )}
          <div className="flex items-center gap-2">
            <label
              htmlFor="rows-per-page"
              className="whitespace-nowrap text-sm font-medium text-slate-600"
            >
              Showing properties per page:
            </label>

            <select
              id="rows-per-page"
              value={itemsPerPage}
              onChange={(e) => handleRowsChange(Number(e.target.value))}
              className="h-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              {ROWS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ===== Content: Cards or Table ===== */}
      {visibleItems.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white py-16 text-center shadow-xs">
          <Building2 className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-3 text-base font-bold text-slate-900">No properties found</p>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {items.length === 0
              ? "Your portfolio is empty. Click “Add Property” to get started."
              : "No properties match your current search and filter combination."}
          </p>
          {isFiltered && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="mt-4 gap-1.5 border-slate-300 text-xs font-bold"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Clear filters
            </Button>
          )}
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedItems.map((property) => (
            <PropertyCard
              key={getId(property)}
              property={property}
              onEdit={() => openEditForm(property)}
              onDelete={() => openDeleteDialog(property)}
            />
          ))}
        </div>
      ) : (
        <PropertyTable
          properties={paginatedItems}
          onEdit={openEditForm}
          onDelete={openDeleteDialog}
        />
      )}

      {/* ===== Pagination Controls (shown whenever there is something to show) ===== */}

      {visibleItems.length > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">

          {/* Left: Results Info + Rows Selector */}
          <div className="flex flex-wrap items-center gap-4">

            <p className="text-sm font-medium text-slate-600">
              Showing{" "}
              <span className="font-bold text-slate-950">
                {(page - 1) * itemsPerPage + 1}
              </span>
              {" - "}
              <span className="font-bold text-slate-950">
                {Math.min(page * itemsPerPage, visibleItems.length)}
              </span>
              {" of "}
              <span className="font-bold text-slate-950">
                {visibleItems.length}
              </span>
              {" properties"}
            </p>
          </div>

          {/* Right: Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2">

              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setCurrentPage(page - 1)}
                className="h-9 rounded-xl border-slate-200 px-3 text-xs font-semibold"
              >
                Previous
              </Button>

              {getPageNumbers(page, totalPages).map((pageNumber, index) =>
                pageNumber === "..." ? (
                  <span
                    key={`gap-${index}`}
                    className="px-1 text-sm text-slate-400"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={pageNumber}
                    variant={page === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                    aria-current={page === pageNumber ? "page" : undefined}
                    className={`h-9 w-9 rounded-xl p-0 text-sm font-bold transition-all ${page === pageNumber
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
                      : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                      }`}
                  >
                    {pageNumber}
                  </Button>
                ),
              )}

              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setCurrentPage(page + 1)}
                className="h-9 rounded-xl border-slate-200 px-3 text-xs font-semibold"
              >
                Next
              </Button>

            </div>
          )}
        </div>
      )}


      {/* ===== Pop-ups ===== */}
      {formOpen && (
        <PropertyForm
          editing={editing}
          saving={saving}
          serverError={formError}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      {deleting && (
        <DeleteDialog
          propertyName={deleting.name}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={closeDeleteDialog}
        />
      )}

      {/* ===== Floating Success Toast ===== */}
      {message && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl border border-slate-800 bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-xl">
          {message}
        </div>
      )}
    </div>
  );
}