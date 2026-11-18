"use client";

// =============================================================================
// app/(admin)/reports/page.tsx - REPORTS & ANALYTICS
//
// No dummy data on this page.
//   - Properties, units, occupancy and rent are REAL (GET /properties).
//   - Collected rent, expenses and the monthly trend need the Payments and
//     Expenses modules. Until they exist those parts stay EMPTY and show a
//     friendly empty state. When the modules are ready, fill `finance`
//     inside loadData() and the charts and tables light up on their own.
//
// Charts are drawn with plain SVG/CSS, so no chart library has to be installed.
// Money on this page is in RUPEES (same as the Properties page).
// =============================================================================

import { useCallback, useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  Building2,
  Download,
  Home,
  IndianRupee,
  Loader2,
  PieChart as PieChartIcon,
  Percent,
  Printer,
  RefreshCw,
  TrendingUp,
  Wallet,
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
  type Property,
} from "../properties/property-utils";

// -----------------------------------------------------------------------------
// 1. THE SHAPE OF THE DATA THAT WILL COME FROM THE NEXT MODULES
// -----------------------------------------------------------------------------

type TrendRow = { month: string; revenue: number; expenses: number }; // month like "2026-06"
type ExpenseSlice = { category: string; amount: number };
type PropertyMoney = { propertyId: string; collected: number; expenses: number };

type Finance = {
  collected: number; // total rent received in the selected period
  expenses: number; // total expenses in the selected period
  trend: TrendRow[];
  expenseBreakdown: ExpenseSlice[];
  byProperty: PropertyMoney[];
};

// Everything starts empty. Nothing is made up.
const EMPTY_FINANCE: Finance = { collected: 0, expenses: 0, trend: [], expenseBreakdown: [], byProperty: [] };

type PeriodKey = "month" | "quarter" | "year";
const PERIODS: { key: PeriodKey; label: string; months: number }[] = [
  { key: "month", label: "This month", months: 1 },
  { key: "quarter", label: "This quarter", months: 3 },
  { key: "year", label: "This financial year", months: 12 },
];

type SortKey = "name" | "occupancy" | "rent";

// -----------------------------------------------------------------------------
// 2. SMALL HELPERS
// -----------------------------------------------------------------------------

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#0ea5e9", "#f43f5e", "#8b5cf6", "#14b8a6", "#ec4899"];

function formatRupees(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function formatMonth(month: string): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" });
}

type IconType = ComponentType<{ className?: string }>;

// -----------------------------------------------------------------------------
// 3. SMALL BUILDING BLOCKS used only on this page
// -----------------------------------------------------------------------------

function KpiCard(props: { label: string; value: string; hint: string; icon: IconType; color: string; bg: string }) {
  return (
    <Card className="h-full rounded-2xl border-slate-200 py-0 shadow-xs">
      <CardContent className="space-y-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${props.bg}`}>
          <props.icon className={`h-5 w-5 ${props.color}`} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500">{props.label}</p>
          <p className="mt-0.5 truncate text-2xl font-bold tabular-nums tracking-tight text-slate-950">{props.value}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{props.hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Section(props: { title: string; description?: string; className?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <Card className={`rounded-2xl border-slate-200 py-0 shadow-xs ${props.className ?? ""}`}>
      <CardContent className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">{props.title}</h2>
            {props.description && <p className="mt-0.5 text-sm text-slate-500">{props.description}</p>}
          </div>
          {props.right}
        </div>
        {props.children}
      </CardContent>
    </Card>
  );
}

function EmptyState(props: { icon: IconType; title: string; text: string; actionLabel?: string; actionHref?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center">
      <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-xs ring-1 ring-slate-200">
        <props.icon className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-800">{props.title}</p>
      <p className="max-w-xs text-xs text-slate-500">{props.text}</p>
      {props.actionLabel && props.actionHref && (
        <Link
          href={props.actionHref}
          className="mt-3 inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-700"
        >
          {props.actionLabel}
        </Link>
      )}
    </div>
  );
}

type Slice = { label: string; value: number };

// A donut (pie with a hole) drawn with SVG. `centerValue` is the big text in the middle.
function Donut(props: { slices: Slice[]; centerValue: string; centerLabel: string; format: (n: number) => string }) {
  const total = props.slices.reduce((sum, s) => sum + s.value, 0);
  const radius = 15.9155; // makes the circle's edge exactly 100 units long
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
          <circle cx="21" cy="21" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="5" />
          {props.slices.map((slice, index) => {
            const share = total > 0 ? (slice.value / total) * 100 : 0;
            const circle = (
              <circle
                key={slice.label}
                cx="21"
                cy="21"
                r={radius}
                fill="none"
                stroke={COLORS[index % COLORS.length]}
                strokeWidth="5"
                strokeDasharray={`${share} ${100 - share}`}
                strokeDashoffset={-offset}
              />
            );
            offset += share;
            return circle;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold tabular-nums text-slate-950">{props.centerValue}</span>
          <span className="text-[11px] font-medium text-slate-500">{props.centerLabel}</span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-2">
        {props.slices.map((slice, index) => (
          <li key={slice.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="truncate text-slate-700">{slice.label}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-slate-900">
              {props.format(slice.value)}
              <span className="ml-1.5 text-xs font-normal text-slate-500">
                {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="h-[132px] animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-[320px] animate-pulse rounded-2xl bg-slate-100 lg:col-span-2" />
        <div className="h-[320px] animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4. THE PAGE
// -----------------------------------------------------------------------------

export default function ReportsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  // Data from modules that are not built yet. Stays empty for now.
  const [finance] = useState<Finance>(EMPTY_FINANCE);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [period, setPeriod] = useState<PeriodKey>("year");
  const [sortBy, setSortBy] = useState<SortKey>("occupancy");

  const loadData = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    setError("");
    try {
      const response = await api.get<Property[] | { data: Property[] }>("/properties");
      const list = Array.isArray(response) ? response : (response.data ?? []);
      setProperties(list.map(cleanProperty));

      // LATER: when the Payments and Expenses modules exist, fetch them here
      // and call setFinance({ collected, expenses, trend, expenseBreakdown, byProperty }).
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // ---- Numbers worked out from the data above ----
  const totals = useMemo(() => calculateTotals(properties), [properties]);
  const months = PERIODS.find((p) => p.key === period)?.months ?? 1;

  const expectedRent = totals.totalRent * months; // what should be collected in this period
  const collectionRate = expectedRent > 0 ? Math.round((finance.collected / expectedRent) * 100) : null;
  const noi = finance.collected - finance.expenses;
  const vacantUnits = totals.totalUnits - totals.totalOccupied;

  const moneyByProperty = useMemo(() => {
    const map = new Map<string, PropertyMoney>();
    finance.byProperty.forEach((row) => map.set(row.propertyId, row));
    return map;
  }, [finance.byProperty]);

  const sortedProperties = useMemo(() => {
    const copy = [...properties];
    if (sortBy === "name") copy.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "occupancy") copy.sort((a, b) => getOccupancyPercent(b) - getOccupancyPercent(a));
    if (sortBy === "rent") copy.sort((a, b) => b.rent - a.rent);
    return copy;
  }, [properties, sortBy]);

  const bestProperty = useMemo(
    () => [...properties].sort((a, b) => getOccupancyPercent(b) - getOccupancyPercent(a))[0],
    [properties],
  );
  const weakestProperty = useMemo(
    () => [...properties].sort((a, b) => getOccupancyPercent(a) - getOccupancyPercent(b))[0],
    [properties],
  );

  // Chart data
  const occupancySlices: Slice[] = [
    { label: "Occupied units", value: totals.totalOccupied },
    { label: "Vacant units", value: Math.max(0, vacantUnits) },
  ];
  const rentSlices: Slice[] = properties
    .filter((p) => p.rent > 0)
    .map((p) => ({ label: p.name, value: p.rent }))
    .sort((a, b) => b.value - a.value);
  const expenseSlices: Slice[] = finance.expenseBreakdown.map((e) => ({ label: e.category, value: e.amount }));
  const chartMax = Math.max(1, ...finance.trend.flatMap((row) => [row.revenue, row.expenses]));

  // ---- Export (a CSV file that opens in Excel) ----
  function exportCsv() {
    const header = ["Property", "Location", "Units", "Occupied", "Occupancy %", "Monthly Rent (INR)", "Collected (INR)", "Expenses (INR)"];
    const rows = sortedProperties.map((p) => {
      const money = moneyByProperty.get(getId(p));
      return [
        p.name,
        p.location,
        p.units,
        p.occupied,
        getOccupancyPercent(p),
        p.rent,
        money ? money.collected : "",
        money ? money.expenses : "",
      ];
    });
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `property-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ---------------------------------------------------------------------------
  // 5. WHAT YOU SEE
  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto w-full max-w-screen-xl space-y-6 px-4 pb-20 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 print:border-0 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Portfolio income, occupancy and performance at a glance</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodKey)}
            aria-label="Report period"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {PERIODS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={() => loadData(true)} disabled={loading || refreshing} className="gap-2">
            <RefreshCw className={refreshing ? "animate-spin" : ""} /> Refresh
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer /> Print
          </Button>
          <Button onClick={exportCsv} disabled={properties.length === 0} className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700">
            <Download /> Export CSV
          </Button>
        </div>
      </header>

      {error && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">Could not load your data: {error}</span>
          <Button size="sm" variant="outline" onClick={() => loadData(true)} disabled={refreshing} className="gap-1.5 border-rose-300 bg-white text-rose-800">
            {refreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />} Try again
          </Button>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* ===== Key numbers ===== */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <KpiCard
              label="Expected Rent"
              value={formatRent(expectedRent)}
              hint={`${months} ${months === 1 ? "month" : "months"} of rent`}
              icon={IndianRupee}
              color="text-violet-700"
              bg="bg-violet-100"
            />
            <KpiCard
              label="Collected"
              value={formatRent(finance.collected)}
              hint={collectionRate === null ? "Waiting for payments" : `${collectionRate}% collection rate`}
              icon={Wallet}
              color="text-emerald-700"
              bg="bg-emerald-100"
            />
            <KpiCard
              label="Expenses"
              value={formatRent(finance.expenses)}
              hint="Maintenance, taxes, utilities"
              icon={BarChart3}
              color="text-rose-700"
              bg="bg-rose-100"
            />
            <KpiCard
              label="Net Income"
              value={formatRent(noi)}
              hint="Collected minus expenses"
              icon={TrendingUp}
              color="text-indigo-700"
              bg="bg-indigo-100"
            />
            <KpiCard
              label="Occupancy"
              value={`${totals.occupancyRate}%`}
              hint={`${totals.totalOccupied} of ${totals.totalUnits} units`}
              icon={Home}
              color="text-sky-700"
              bg="bg-sky-100"
            />
          </div>

          {/* ===== Revenue vs expenses chart  +  Occupancy donut ===== */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Section title="Revenue vs Expenses" description="Month by month" className="lg:col-span-2">
              {finance.trend.length === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title="No financial history yet"
                  text="Once rent payments and expenses are recorded, the monthly comparison appears here."
                  actionLabel="Record Payment"
                  actionHref="/payments"
                />
              ) : (
                <>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Revenue
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-rose-400" /> Expenses
                    </span>
                  </div>
                  <div
                    className="mt-4 grid h-56 gap-3"
                    style={{ gridTemplateColumns: `repeat(${finance.trend.length}, minmax(0, 1fr))` }}
                  >
                    {finance.trend.map((row) => (
                      <div key={row.month} className="flex h-full flex-col">
                        <div className="flex flex-1 items-end justify-center gap-1.5">
                          <div
                            className="w-full max-w-[28px] rounded-t-md bg-emerald-500"
                            style={{ height: `${(row.revenue / chartMax) * 100}%` }}
                            title={`Revenue: ${formatRupees(row.revenue)}`}
                          />
                          <div
                            className="w-full max-w-[28px] rounded-t-md bg-rose-400"
                            style={{ height: `${(row.expenses / chartMax) * 100}%` }}
                            title={`Expenses: ${formatRupees(row.expenses)}`}
                          />
                        </div>
                        <p className="mt-2 text-center text-xs font-semibold text-slate-600">{formatMonth(row.month)}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Section>

            <Section title="Occupancy" description="Occupied vs vacant units">
              {totals.totalUnits === 0 ? (
                <EmptyState
                  icon={Home}
                  title="No units yet"
                  text="Add a property with units to see your occupancy split."
                  actionLabel="Add Property"
                  actionHref="/properties"
                />
              ) : (
                <Donut
                  slices={occupancySlices}
                  centerValue={`${totals.occupancyRate}%`}
                  centerLabel="occupied"
                  format={(n) => `${n}`}
                />
              )}
            </Section>
          </div>

          {/* ===== Rent share pie  +  Expense pie ===== */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Section title="Rent by Property" description="Each property's share of monthly rent">
              {rentSlices.length === 0 ? (
                <EmptyState
                  icon={PieChartIcon}
                  title="No rent data yet"
                  text="Properties with a monthly rent will be compared here."
                  actionLabel="Add Property"
                  actionHref="/properties"
                />
              ) : (
                <Donut
                  slices={rentSlices.slice(0, 6)}
                  centerValue={formatRent(totals.totalRent)}
                  centerLabel="per month"
                  format={formatRent}
                />
              )}
            </Section>

            <Section title="Expense Breakdown" description="Where the money goes">
              {expenseSlices.length === 0 ? (
                <EmptyState
                  icon={PieChartIcon}
                  title="No expenses recorded"
                  text="Maintenance, utilities and tax expenses will be split by category here."
                />
              ) : (
                <Donut
                  slices={expenseSlices}
                  centerValue={formatRent(finance.expenses)}
                  centerLabel="total"
                  format={formatRent}
                />
              )}
            </Section>
          </div>

          {/* ===== Insights ===== */}
          {properties.length > 0 && bestProperty && weakestProperty && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Best occupancy</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900">{bestProperty.name}</p>
                <p className="text-xs text-slate-600">{getOccupancyPercent(bestProperty)}% of units occupied</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Needs attention</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900">{weakestProperty.name}</p>
                <p className="text-xs text-slate-600">{getOccupancyPercent(weakestProperty)}% of units occupied</p>
              </div>
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Vacant units</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{Math.max(0, vacantUnits)} to fill</p>
                <p className="text-xs text-slate-600">across {totals.totalProperties} {totals.totalProperties === 1 ? "property" : "properties"}</p>
              </div>
            </div>
          )}

          {/* ===== Property performance table ===== */}
          <Section
            title="Property Performance"
            description="Occupancy, rent and profit for each property"
            right={
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                aria-label="Sort properties"
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 print:hidden"
              >
                <option value="occupancy">Sort: Occupancy</option>
                <option value="rent">Sort: Monthly rent</option>
                <option value="name">Sort: Name</option>
              </select>
            }
          >
            {properties.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No properties to report on"
                text="Add your first property and its performance will appear here."
                actionLabel="Add Property"
                actionHref="/properties"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-2 pr-4 font-semibold">Property</th>
                      <th className="px-4 py-2 font-semibold">Occupancy</th>
                      <th className="px-4 py-2 font-semibold">Monthly Rent</th>
                      <th className="px-4 py-2 font-semibold">Collected</th>
                      <th className="px-4 py-2 font-semibold">Expenses</th>
                      <th className="py-2 pl-4 text-right font-semibold">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedProperties.map((property) => {
                      const occupancy = getOccupancyPercent(property);
                      const money = moneyByProperty.get(getId(property));
                      const net = money ? money.collected - money.expenses : null;
                      return (
                        <tr key={getId(property)} className="transition-colors hover:bg-slate-50/60">
                          <td className="py-3.5 pr-4">
                            <p className="font-semibold text-slate-900">{property.name}</p>
                            <p className="text-xs text-slate-500">
                              {property.occupied} of {property.units} units
                              {property.location ? ` · ${property.location}` : ""}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="w-32">
                              <span className="text-xs font-semibold tabular-nums text-slate-700">{occupancy}%</span>
                              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full rounded-full ${occupancy >= 80 ? "bg-emerald-500" : occupancy >= 40 ? "bg-amber-500" : "bg-rose-500"
                                    }`}
                                  style={{ width: `${occupancy}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-semibold tabular-nums text-slate-900">{formatRent(property.rent)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-700">{money ? formatRupees(money.collected) : "—"}</td>
                          <td className="px-4 py-3.5 tabular-nums text-rose-600">{money ? formatRupees(money.expenses) : "—"}</td>
                          <td
                            className={`py-3.5 pl-4 text-right font-bold tabular-nums ${net === null ? "text-slate-400" : net >= 0 ? "text-emerald-700" : "text-rose-700"
                              }`}
                          >
                            {net === null ? "—" : formatRupees(net)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {collectionRate === null && (
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <Percent className="h-3.5 w-3.5" /> Collected, expenses and net columns fill in after the Payments and
              Expenses modules are connected.
            </p>
          )}
        </>
      )}
    </div>
  );
}