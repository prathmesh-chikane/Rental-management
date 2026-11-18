/**
 * @file RentChart.tsx
 * @description Advanced interactive financial analytics chart for rental property management.
 * Built with Recharts ComposedChart supporting:
 * - Expected vs Collected revenue comparison
 * - Operating expenses vs Net operating cash flow
 * - Category-level expense distribution
 */

"use client";

import React, { useState } from "react";
import {
  ComposedChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { rentChart, expenseCategories } from "@/lib/mock-data/dashboard";
import { TrendingUp, Layers, PieChart, CheckCircle2, ArrowUpRight } from "lucide-react";

export default function RentChart() {
  // Toggle view state between 3 analytical modes
  const [activeView, setActiveView] = useState<"collection" | "cashflow" | "expenses">("collection");

  // Financial summary calculations
  const totalPaid = rentChart.reduce((acc, item) => acc + item.paid, 0);
  const totalExpected = rentChart.reduce((acc, item) => acc + item.expected, 0);
  const totalExpenses = rentChart.reduce((acc, item) => acc + item.expenses, 0);
  const totalNet = totalPaid - totalExpenses;
  const collectionRate = ((totalPaid / totalExpected) * 100).toFixed(1);

  return (
    <div className="w-full space-y-4">
      {/* Chart Control Bar with Interactive Pills & Key Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        {/* View Mode Switcher */}
        <div className="inline-flex rounded-xl bg-slate-100/90 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveView("collection")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
              activeView === "collection"
                ? "bg-white text-emerald-800 shadow-2xs font-bold"
                : "hover:text-slate-900"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <span>Target vs Collected</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("cashflow")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
              activeView === "cashflow"
                ? "bg-white text-emerald-800 shadow-2xs font-bold"
                : "hover:text-slate-900"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-sky-600" />
            <span>Net Cash Flow</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("expenses")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
              activeView === "expenses"
                ? "bg-white text-emerald-800 shadow-2xs font-bold"
                : "hover:text-slate-900"
            }`}
          >
            <PieChart className="h-3.5 w-3.5 text-amber-600" />
            <span>Expense Split</span>
          </button>
        </div>

        {/* Live Status indicator */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span>{collectionRate}% Overall Efficiency</span>
        </div>
      </div>

      {/* Primary Chart Canvas */}
      {activeView !== "expenses" ? (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={rentChart}
              barGap={8}
              barCategoryGap={22}
              margin={{ top: 12, right: 12, bottom: 0, left: -10 }}
            >
              {/* Subtle background reference grid */}
              <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />

              {/* X-Axis for months */}
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                dy={8}
              />

              {/* Y-Axis in Indian Rupee thousands (k) */}
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickFormatter={(val: number) => `₹${val / 1000}k`}
                width={56}
              />

              {/* Interactive Tooltip with INR Currency Formatting */}
              <Tooltip
                cursor={{ fill: "rgba(241, 245, 249, 0.7)" }}
                formatter={(value, name) => [
                  `₹${Number(value).toLocaleString("en-IN")}`,
                  name,
                ]}
                contentStyle={{
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 12px 28px -6px rgba(15, 23, 42, 0.12)",
                  fontSize: "12px",
                  padding: "12px 16px",
                  fontWeight: 500,
                }}
              />

              {/* Recharts Legend */}
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingTop: 18, fontSize: "12px", fontWeight: 600 }}
              />

              {/* Render Bars & Areas dynamically depending on active view */}
              {activeView === "collection" && (
                <>
                  <Bar
                    dataKey="expected"
                    fill="#e2e8f0"
                    name="Target Rent"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="paid"
                    fill="#10b981"
                    name="Collected Rent"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </>
              )}

              {activeView === "cashflow" && (
                <>
                  <Bar
                    dataKey="paid"
                    fill="#10b981"
                    name="Gross Inflow"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                  <Bar
                    dataKey="expenses"
                    fill="#f59e0b"
                    name="Outflow Expenses"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                  <Area
                    type="monotone"
                    dataKey="net"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    fill="#e0f2fe"
                    fillOpacity={0.4}
                    name="Net Operating Profit"
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#0369a1"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#0284c7" }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* View 3: Visual Expense Breakdown */
        <div className="h-72 w-full space-y-3.5 overflow-y-auto pr-1 py-1">
          <p className="text-xs font-medium text-slate-500">
            Categorical operational expenditure for the current billing cycle:
          </p>
          {expenseCategories.map((cat) => (
            <div key={cat.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-700">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </span>
                <span className="text-slate-900">
                  ₹{cat.amount.toLocaleString("en-IN")}{" "}
                  <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Summary Highlights */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl bg-slate-50/80 p-3 text-center text-xs">
        <div>
          <span className="text-slate-500">Total Expected</span>
          <p className="mt-0.5 font-bold text-slate-900">
            ₹{totalExpected.toLocaleString("en-IN")}
          </p>
        </div>
        <div>
          <span className="text-slate-500">Total Realized</span>
          <p className="mt-0.5 font-bold text-emerald-700">
            ₹{totalPaid.toLocaleString("en-IN")}
          </p>
        </div>
        <div>
          <span className="text-slate-500">Operating Expenses</span>
          <p className="mt-0.5 font-bold text-amber-700">
            ₹{totalExpenses.toLocaleString("en-IN")}
          </p>
        </div>
        <div>
          <span className="text-slate-500">Net Operating Profit</span>
          <p className="mt-0.5 font-bold text-sky-700">
            ₹{totalNet.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </div>
  );
}
