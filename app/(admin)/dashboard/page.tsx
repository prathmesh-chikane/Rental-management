"use client";

// =============================================================================
// page.tsx  (the Admin Dashboard)
//
// No dummy data on this page.
//   - Properties, units, occupancy and rent are REAL: they come from GET /properties.
//   - Payments, overdue rent, leases, tickets and the chart need modules that are
//     not built yet, so they start EMPTY and show a friendly empty state.
//     When those modules exist, fill `extras` inside loadData() and the page
//     lights up on its own. Nothing else has to change.
//
// Money on this page is in RUPEES (same as the Properties page).
// =============================================================================

import { useCallback, useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Building2,
  CalendarClock,
  FilePlus2,
  Home,
  IndianRupee,
  Loader2,
  Plus,
  ReceiptText,
  RefreshCw,
  UserPlus,
  Wallet,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import {
  calculateTotals,
  cleanProperty,
  formatRent,
  getId,
  getOccupancyPercent,
  PROPERTIES_STORAGE_KEY,
  statusFor,
  type Property,
} from "../properties/property-utils";

// -----------------------------------------------------------------------------
// 1. THE SHAPE OF THE DATA THAT WILL COME FROM THE NEXT MODULES
// -----------------------------------------------------------------------------

type PaymentRow = {
  id: string;
  tenantName: string;
  propertyName: string;
  unitLabel: string;
  amount: number; // rupees
  method: string;
  paidAt: string; // ISO date
  status: "paid" | "pending" | "failed";
};

type OverdueRow = {
  id: string;
  tenantName: string;
  propertyName: string;
  unitLabel: string;
  amountDue: number; // rupees
  daysOverdue: number;
};

type LeaseRow = {
  id: string;
  tenantName: string;
  propertyName: string;
  unitLabel: string;
  endDate: string; // ISO date
  daysLeft: number;
};

type TicketRow = {
  id: string;
  title: string;
  propertyName: string;
  unitLabel: string;
  priority: "urgent" | "high" | "medium" | "low";
  createdAt: string; // ISO date
};

type MaintenanceApiTicket = {
  _id: string;
  title: string;
  propertyName: string;
  unit?: string;
  priority: string;
  status: string;
  createdAt: string;
};

type TrendRow = {
  month: string; // like "2026-06"
  billed: number; // rupees
  collected: number; // rupees
};

type Extras = {
  payments: PaymentRow[];
  overdue: OverdueRow[];
  leases: LeaseRow[];
  tickets: TicketRow[];
  trend: TrendRow[];
};

// Everything starts empty. Nothing is made up.
const EMPTY_EXTRAS: Extras = { payments: [], overdue: [], leases: [], tickets: [], trend: [] };

// -----------------------------------------------------------------------------
// 2. SMALL FORMATTING HELPERS
// -----------------------------------------------------------------------------

function formatRupees(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatMonth(month: string): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-IN", {
    month: "short",
    timeZone: "UTC",
  });
}

// -----------------------------------------------------------------------------
// 3. SMALL BUILDING BLOCKS used only on this page
// -----------------------------------------------------------------------------

type IconType = ComponentType<{ className?: string }>;

// One summary box at the top. Clicking it opens the related page.
function StatCard(props: {
  label: string;
  value: string;
  hint: string;
  icon: IconType;
  color: string;
  bg: string;
  href: string;
}) {
  return (
    <Link href={props.href} className="group block">
      <Card className="h-full rounded-2xl border-slate-200 py-0 shadow-xs transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
        <CardContent className="space-y-3 p-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${props.bg}`}>
            <props.icon className={`h-5 w-5 ${props.color}`} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500">
              {props.label}
            </p>
            <p className="mt-0.5 truncate text-2xl font-bold tabular-nums tracking-tight text-slate-950">
              {props.value}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{props.hint}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// A white box with a title, a short description and an optional "View all" link.
function Section(props: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={`rounded-2xl border-slate-200 py-0 shadow-xs ${props.className ?? ""}`}>
      <CardContent className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">{props.title}</h2>
            {props.description && <p className="mt-0.5 text-sm text-slate-500">{props.description}</p>}
          </div>
          {props.href && (
            <Link
              href={props.href}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            >
              {props.linkLabel ?? "View all"} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        {props.children}
      </CardContent>
    </Card>
  );
}

// What a section shows when there is nothing to list yet.
// Optional button (a link) tells the admin what to do next.
function EmptyState(props: {
  icon: IconType;
  title: string;
  text: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
      <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-xs ring-1 ring-slate-200">
        <props.icon className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-800">{props.title}</p>
      <p className="max-w-xs text-xs text-slate-500">{props.text}</p>
      {props.actionLabel && props.actionHref && (
        <Link
          href={props.actionHref}
          className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-700"
        >
          <Plus className="h-3.5 w-3.5" /> {props.actionLabel}
        </Link>
      )}
    </div>
  );
}

const PAYMENT_STYLE: Record<PaymentRow["status"], string> = {
  paid: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-rose-50 text-rose-700",
};

const PRIORITY_STYLE: Record<TicketRow["priority"], string> = {
  urgent: "bg-rose-100 text-rose-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-slate-100 text-slate-700",
};

// Grey boxes shown while the first load is running.
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="h-[132px] animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-[340px] animate-pulse rounded-2xl bg-slate-100 lg:col-span-2" />
        <div className="h-[340px] animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4. THE PAGE
// -----------------------------------------------------------------------------

export default function DashboardPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  // Data from live backend modules (leases & invoices)
  const [extras, setExtras] = useState<Extras>(EMPTY_EXTRAS);

  const [loading, setLoading] = useState(true); // true only for the very first load
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  // Helper: apply any occupancy overrides saved by the Tenants page into localStorage.
  function applyOccupancyOverrides(list: Property[]): Property[] {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(PROPERTIES_STORAGE_KEY) : null;
      if (!raw) return list;
      const overrides = JSON.parse(raw) as Array<{ name: string; occupied: number }>;
      return list.map((p) => {
        const override = overrides.find((o) => o.name === p.name);
        if (!override) return p;
        const newOccupied = Math.max(0, Math.min(p.units, override.occupied));
        return { ...p, occupied: newOccupied, status: statusFor(p.units, newOccupied) };
      });
    } catch {
      return list;
    }
  }

  // Load the real data from the backend.
  const loadData = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    setError("");

    try {
      // 1. Fetch properties, leases, and invoices simultaneously
      const [propsRes, leasesRes, invoicesRes, ticketsRes] = await Promise.allSettled([
        api.get<Property[] | { data: Property[] }>("/properties"),
        api.get<any[] | { data: any[] }>("/leases"),
        api.get<any[]>("/invoices"),
        api.get<MaintenanceApiTicket[] | { data: MaintenanceApiTicket[] }>("/maintenance"),
      ]);

      if (propsRes.status === "fulfilled") {
        const rawProps = propsRes.value;
        const list = Array.isArray(rawProps) ? rawProps : (rawProps.data ?? []);
        setProperties(applyOccupancyOverrides(list.map(cleanProperty)));
      }

      // Map Leases & Invoices into extras
      let newLeases: LeaseRow[] = [];
      let newPayments: PaymentRow[] = [];
      let newOverdue: OverdueRow[] = [];
      let newTrend: TrendRow[] = [];
      let newTickets: TicketRow[] = [];

      if (ticketsRes.status === "fulfilled") {
        const response = ticketsRes.value;

        const tickets = Array.isArray(response)
          ? response
          : response.data || [];

        newTickets = tickets
          .filter(
            (ticket) => ticket.status?.toLowerCase() === "open"
          )
          .map((ticket) => ({
            id: ticket._id,
            title: ticket.title,
            propertyName: ticket.propertyName || "Unknown Property",
            unitLabel: ticket.unit || "-",
            priority: (
              ["urgent", "high", "medium", "low"].includes(
                ticket.priority?.toLowerCase()
              )
                ? ticket.priority.toLowerCase()
                : "medium"
            ) as TicketRow["priority"],
            createdAt: ticket.createdAt,
          }));
      }


      if (leasesRes.status === "fulfilled") {
        const response = leasesRes.value;

        const leases = Array.isArray(response)
          ? response
          : response?.data || [];

        // आजची तारीख (Local date)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // पुढील 30 दिवस
        const limit = new Date(today);
        limit.setDate(limit.getDate() + 30);

        const formatLocalDate = (date: Date) =>
          `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        const todayString = formatLocalDate(today);
        const limitString = formatLocalDate(limit);

        newLeases = leases
          .map((l: any) => {
            const endDate = String(l.endDate || "").slice(0, 10);

            const end = new Date(`${endDate}T00:00:00`);

            const diffDays = Math.ceil(
              (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            return {
              id: l._id || l.id || l.leaseNumber,
              tenantName: l.tenantName || "Unknown Tenant",
              propertyName: l.propertyName || "Unknown Property",
              unitLabel: l.unit || "-",
              endDate,
              daysLeft: diffDays,
            };
          })
          .filter(
            (l: LeaseRow) =>
              l.endDate >= todayString &&
              l.endDate <= limitString
          );
      }


      if (invoicesRes.status === "fulfilled" && Array.isArray(invoicesRes.value)) {
        const invoices = invoicesRes.value;

        // Paid payments
        newPayments = invoices
          .filter((inv: any) => inv.status === "Paid")
          .map((inv: any) => ({
            id: inv._id || inv.invoiceNo,
            tenantName: inv.tenantName || "Tenant",
            propertyName: inv.propertyName || "Property",
            unitLabel: inv.unit || "-",
            amount: Number(inv.amount) || 0,
            method: inv.paymentMethod || "UPI / Net Banking",
            paidAt: inv.paidDate || inv.issueDate || new Date().toISOString(),
            status: "paid" as const,
          }));

        // Overdue invoices
        const now = new Date();
        newOverdue = invoices
          .filter((inv: any) => inv.status === "Overdue" || (inv.status === "Unpaid" && new Date(inv.dueDate) < now))
          .map((inv: any) => {
            const due = new Date(inv.dueDate);
            const diffDays = Math.max(1, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
            return {
              id: inv._id || inv.invoiceNo,
              tenantName: inv.tenantName || "Tenant",
              propertyName: inv.propertyName || "Property",
              unitLabel: inv.unit || "-",
              amountDue: Number(inv.amount) || 0,
              daysOverdue: diffDays,
            };
          });

        // 6-Month Billed vs Collected Trend
        const trendMap = new Map<string, { billed: number; collected: number }>();
        for (const inv of invoices) {
          const d = new Date(inv.issueDate || inv.dueDate || Date.now());
          const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
          const existing = trendMap.get(monthKey) || { billed: 0, collected: 0 };
          const amt = Number(inv.amount) || 0;
          existing.billed += amt;
          if (inv.status === "Paid") {
            existing.collected += amt;
          }
          trendMap.set(monthKey, existing);
        }

        newTrend = Array.from(trendMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-6)
          .map(([month, data]) => ({ month, ...data }));
      }

      setExtras((prev) => ({
        ...prev,
        leases: newLeases,
        payments: newPayments,
        overdue: newOverdue,
        trend: newTrend,
        tickets: newTickets,
      }));

      setUpdatedAt(
        new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load once when the page opens, and listen to storage updates.
  useEffect(() => {
    loadData(false);

    function handleStorageChange(e: StorageEvent) {
      if (e.key === PROPERTIES_STORAGE_KEY) {
        setProperties((prev) => applyOccupancyOverrides(prev));
      }
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loadData]);

  // ---- Numbers worked out from the data above ----
  const totals = useMemo(() => calculateTotals(properties), [properties]);

  const collected = extras.payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const outstanding = extras.overdue.reduce((sum, row) => sum + row.amountDue, 0);

  const chartMax = Math.max(1, ...extras.trend.flatMap((row) => [row.billed, row.collected]));
  const vacantUnits = totals.totalUnits - totals.totalOccupied;

  const quickActions = [
    { label: "Add Property", href: "/properties", icon: Building2 },
    { label: "Add Tenant", href: "/tenants", icon: UserPlus },
    { label: "Create Lease", href: "/leases", icon: FilePlus2 },
    { label: "Generate Invoice", href: "/billing&Invoice", icon: ReceiptText },
    { label: "Record Payment", href: "/rent-payments", icon: Banknote },
    { label: "Log Maintenance", href: "/maintenance", icon: Wrench },
  ];

  // ---- Header (always visible) ----
  const header = (
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Live overview of your Panel{updatedAt ? ` · updated ${updatedAt}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => loadData(true)}
          disabled={loading || refreshing}
          className="gap-2"
        >
          <RefreshCw className={refreshing ? "animate-spin" : ""} /> Refresh
        </Button>
        <Link
          href="/payments"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Record Payment
        </Link>
      </div>
    </header>
  );

  return (
    <div className="mx-auto w-full max-w-screen-xl space-y-6 px-4 pb-20 sm:px-6 lg:px-8">
      {header}

      {/* Could not reach the backend */}
      {error && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">Could not load your data: {error}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="gap-1.5 border-rose-300 bg-white text-rose-800"
          >
            {refreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />} Try again
          </Button>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* ===== 6 key numbers ===== */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Monthly Rent"
              value={formatRent(totals.totalRent)}
              hint={`${totals.totalProperties} ${totals.totalProperties === 1 ? "property" : "properties"}`}
              icon={IndianRupee}
              color="text-violet-700"
              bg="bg-violet-100"
              href="/properties"
            />
            <StatCard
              label="Collected"
              value={formatRent(collected)}
              hint="Paid this month"
              icon={Banknote}
              color="text-emerald-700"
              bg="bg-emerald-100"
              href="/billing&Invoice"
            />
            <StatCard
              label="Outstanding"
              value={formatRent(outstanding)}
              hint={`${extras.overdue.length} overdue ${extras.overdue.length === 1 ? "invoice" : "invoices"}`}
              icon={Wallet}
              color="text-rose-700"
              bg="bg-rose-100"
              href="/billing&Invoice"
            />
            <StatCard
              label="Occupancy"
              value={`${totals.occupancyRate}%`}
              hint={`${totals.totalOccupied} of ${totals.totalUnits} units · ${vacantUnits} vacant`}
              icon={Home}
              color="text-indigo-700"
              bg="bg-indigo-100"
              href="/properties"
            />
            <StatCard
              label="Expiring Leases"
              value={String(extras.leases.length)}
              hint="Ending in 30 days"
              icon={CalendarClock}
              color="text-amber-700"
              bg="bg-amber-100"
              href="/leases"
            />
            <StatCard
              label="Open Tickets"
              value={String(extras.tickets.length)}
              hint="Maintenance requests"
              icon={Wrench}
              color="text-sky-700"
              bg="bg-sky-100"
              href="/maintenance"
            />
          </div>

          {/* ===== Quick actions ===== */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-800 shadow-xs transition-colors hover:border-indigo-300 hover:bg-indigo-50/50"
              >
                <action.icon className="h-4 w-4 shrink-0 text-indigo-600" />
                <span className="truncate">{action.label}</span>
              </Link>
            ))}
          </div>

          {/* ===== Chart  +  Overdue rent ===== */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Section
              title="Billed vs Collected"
              description="Last 6 months"
              href="/billing&Invoice"
              linkLabel="Invoices"
              className="lg:col-span-2"
            >
              {extras.trend.length === 0 ? (
                <EmptyState
                  icon={ReceiptText}
                  title="No billing history yet"
                  text="Once invoices are generated and payments are recorded, your monthly billed vs collected chart appears here."
                  actionLabel="Generate Invoice"
                  actionHref="/billing&Invoice"
                />
              ) : (
                <>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Billed
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Collected
                    </span>
                  </div>

                  <div
                    className="mt-4 grid h-56 gap-3"
                    style={{ gridTemplateColumns: `repeat(${extras.trend.length}, minmax(0, 1fr))` }}
                  >
                    {extras.trend.map((row) => (
                      <div key={row.month} className="flex h-full flex-col">
                        <div className="flex flex-1 items-end justify-center gap-1.5">
                          <div
                            className="w-full max-w-[28px] rounded-t-md bg-slate-300"
                            style={{ height: `${(row.billed / chartMax) * 100}%` }}
                            title={`Billed: ${formatRupees(row.billed)}`}
                          />
                          <div
                            className="w-full max-w-[28px] rounded-t-md bg-emerald-500"
                            style={{ height: `${(row.collected / chartMax) * 100}%` }}
                            title={`Collected: ${formatRupees(row.collected)}`}
                          />
                        </div>
                        <p className="mt-2 text-center text-xs font-semibold text-slate-600">
                          {formatMonth(row.month)}
                        </p>
                        <p className="text-center text-[11px] tabular-nums text-slate-400">
                          {formatRent(row.collected)}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Section>

            <Section title="Overdue Rent" description="Needs follow-up" href="/billing&Invoice" linkLabel="All">
              {extras.overdue.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title="Nothing overdue"
                  text="Unpaid invoices past their due date will be listed here so you can follow up."
                />
              ) : (
                <ul className="space-y-2.5">
                  {extras.overdue.slice(0, 5).map((row) => (
                    <li
                      key={row.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{row.tenantName}</p>
                        <p className="truncate text-xs text-slate-500">
                          {row.propertyName} · {row.unitLabel}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold tabular-nums text-rose-700">
                          {formatRupees(row.amountDue)}
                        </p>
                        <p className="text-xs text-slate-500">{row.daysOverdue}d overdue</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          {/* ===== Recent payments  +  Leases & tickets ===== */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Section
              title="Recent Payments"
              description="Latest rent received"
              href="/payments"
              className="lg:col-span-2"
            >
              {extras.payments.length === 0 ? (
                <EmptyState
                  icon={Banknote}
                  title="No payments recorded yet"
                  text="Rent payments you record will show up here with tenant, amount and status."
                  actionLabel="Record Payment"
                  actionHref="/payments"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-2 pr-3 font-semibold">Tenant</th>
                        <th className="px-3 py-2 font-semibold">Property</th>
                        <th className="px-3 py-2 font-semibold">Amount</th>
                        <th className="px-3 py-2 font-semibold">Date</th>
                        <th className="py-2 pl-3 text-right font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {extras.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="py-3 pr-3">
                            <p className="font-semibold text-slate-900">{payment.tenantName}</p>
                            <p className="text-xs text-slate-500">{payment.unitLabel}</p>
                          </td>
                          <td className="px-3 py-3 text-slate-600">{payment.propertyName}</td>
                          <td className="px-3 py-3">
                            <p className="font-semibold tabular-nums text-slate-900">
                              {formatRupees(payment.amount)}
                            </p>
                            <p className="text-xs text-slate-500">{payment.method}</p>
                          </td>
                          <td className="px-3 py-3 text-slate-600">{formatDate(payment.paidAt)}</td>
                          <td className="py-3 pl-3 text-right">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${PAYMENT_STYLE[payment.status]}`}
                            >
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <div className="space-y-6">
              <Section title="Leases Ending Soon" description="Next 30 days" href="/leases">
                {extras.leases.length === 0 ? (
                  <EmptyState
                    icon={CalendarClock}
                    title="No leases ending soon"
                    text="Leases that end within 30 days will appear here."
                  />
                ) : (
                  <ul className="space-y-2.5">
                    {extras.leases.slice(0, 4).map((lease) => (
                      <li
                        key={lease.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {lease.tenantName}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {lease.propertyName} · {lease.unitLabel}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="inline-block rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800">
                            {lease.daysLeft}d left
                          </span>
                          <p className="mt-0.5 text-xs text-slate-500">{formatDate(lease.endDate)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="Open Maintenance" description="Not yet closed" href="/maintenance">
                {extras.tickets.length === 0 ? (
                  <EmptyState
                    icon={Wrench}
                    title="No open tickets"
                    text="Maintenance requests that are not closed will be listed here."
                    actionLabel="Log Maintenance"
                    actionHref="/maintenance"
                  />
                ) : (
                  <ul className="space-y-2.5">
                    {extras.tickets.slice(0, 4).map((ticket) => (
                      <li key={ticket.id} className="rounded-xl border border-slate-100 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-snug text-slate-900">
                            {ticket.title}
                          </p>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${PRIORITY_STYLE[ticket.priority]}`}
                          >
                            {ticket.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {ticket.propertyName} · {ticket.unitLabel} · {formatDate(ticket.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
          </div>

          {/* ===== Property performance (REAL data from /properties) ===== */}
          <Section
            title="Property Performance"
            description="Occupancy and monthly rent for each property"
            href="/properties"
            linkLabel="Manage properties"
          >
            {properties.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No properties yet"
                text="Add your first property and its occupancy and rent will show up here."
                actionLabel="Add Property"
                actionHref="/properties"
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {properties.slice(0, 6).map((property) => {
                  const occupancy = getOccupancyPercent(property);
                  const barColor =
                    occupancy >= 80 ? "bg-emerald-500" : occupancy >= 40 ? "bg-amber-500" : "bg-rose-500";

                  return (
                    <div
                      key={getId(property)}
                      className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">{property.name}</p>
                          <p className="truncate text-xs text-slate-500">
                            {property.location || "Location not added"}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold tabular-nums text-slate-950">
                          {formatRent(property.rent)}
                          <span className="text-[11px] font-normal text-slate-500">/mo</span>
                        </span>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${occupancy}%` }} />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                        <span>
                          {property.occupied} of {property.units} units
                        </span>
                        <span className="font-semibold tabular-nums text-slate-900">{occupancy}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}