/**
 * @file StatCard.tsx
 * @description Ultra-Premium Key Performance Indicator (KPI) Metric Card.
 * Crafted with sleek typography, subtle gradient glow, trend indicators,
 * and micro-interactions suited for luxury/enterprise SaaS dashboards.
 */

import React from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
  trend?: string;
  trendType?: "up" | "down" | "neutral";
  prefix?: string;
  suffix?: string;
  badge?: string;
  subValue?: string;
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
  trend,
  trendType = "neutral",
  prefix = "₹",
  suffix = "",
  badge,
  subValue,
}: StatCardProps) {
  // Format numeric values according to Indian numbering standard
  const formattedValue =
    typeof value === "number"
      ? `${prefix}${value.toLocaleString("en-IN")}${suffix}`
      : `${prefix}${value}${suffix}`;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.08)]">
      {/* Top subtle gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Header row: Title, Badge, and Icon */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {title}
            </h3>
            {badge && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200/60">
                {badge}
              </span>
            )}
          </div>

          {/* Primary Metric Value */}
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            {formattedValue}
          </p>

          {subValue && (
            <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
              {subValue}
            </p>
          )}
        </div>

        {/* Executive Icon Container with Soft Glow */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform duration-300 group-hover:scale-105 ${iconClassName}`}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* Footer row: Trend Indicator & Context subtext */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
        {trend && (
          <div
            className={`inline-flex items-center gap-1 font-bold text-[11px] ${
              trendType === "up"
                ? "text-emerald-700 bg-emerald-50/90 px-2 py-0.5 rounded-md ring-1 ring-emerald-200/60"
                : trendType === "down"
                ? "text-rose-700 bg-rose-50/90 px-2 py-0.5 rounded-md ring-1 ring-rose-200/60"
                : "text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md ring-1 ring-slate-200/60"
            }`}
          >
            {trendType === "up" && <ArrowUpRight className="h-3 w-3" />}
            {trendType === "down" && <ArrowDownRight className="h-3 w-3" />}
            {trendType === "neutral" && <Minus className="h-3 w-3" />}
            <span>{trend}</span>
          </div>
        )}

        <p className="truncate text-[11px] font-medium text-slate-400">
          {description}
        </p>
      </div>
    </article>
  );
}
