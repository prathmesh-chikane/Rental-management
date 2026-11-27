
"use client";

import { Bell, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SidebarTrigger } from "@/components/ui/sidebar";

const breadcrumbGroups: Record<string, string> = {
  properties: "Properties",
  tenants: "Properties",
  leases: "Properties",
  maintenance: "Properties",
  documents: "Properties",

  "rent-payments": "Payments",
  expenses: "Payments",
  "billing&Invoice": "Payments",

  reports: "Reports",
  communication: "Reports",

  "staff-vendors": "Management",
  settings: "Management",
};

const pageLabels: Record<string, string> = {
  dashboard: "Dashboard",

  properties: "Properties & Units",
  tenants: "Tenants",
  leases: "Leases",
  maintenance: "Maintenance",
  documents: "Documents",

  "rent-payments": "Rent & Payments",
  expenses: "Expenses",
  "billing&Invoice": "Billing & Invoices",

  reports: "Reports & Analytics",
  communication: "Communication",

  "staff-vendors": "Staff & Vendors",
  settings: "Settings",
};

export default function Topbar() {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  const currentSegment = segments[0] || "dashboard";

  const sectionName = breadcrumbGroups[currentSegment];

  const currentPage =
    pageLabels[currentSegment] || currentSegment;

  const isDetailPage = segments.length > 1;



  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">

      {/* Left Section: Sidebar + Breadcrumb */}
      <div className="flex min-w-0 flex-1 items-center gap-4">

        <SidebarTrigger
          aria-label="Toggle navigation"
          className="shrink-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        />

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-2 overflow-hidden text-sm"
        >
          {currentSegment === "dashboard" ? (
            <span className="truncate font-semibold text-slate-900">
              Dashboard
            </span>
          ) : (
            <>
              {/* Parent Section */}
              {sectionName && (
                <>
                  <span className="shrink-0 text-slate-500">
                    {sectionName}
                  </span>

                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </>
              )}

              {/* Main Page */}
              {isDetailPage ? (
                <>
                  <Link
                    href={`/${currentSegment}`}
                    className="shrink-0 text-slate-500 transition hover:text-slate-900"
                  >
                    {currentPage}
                  </Link>

                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />

                </>
              ) : (
                <span className="truncate font-semibold text-slate-900">
                  {currentPage}
                </span>
              )}
            </>
          )}
        </nav>
      </div>

      {/* Right Section: Notifications + Profile */}
      <div className="flex shrink-0 items-center gap-4 pl-3">

        {/* Notification */}
        <button
          aria-label="Notifications"
          className="relative rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
        >
          <Bell className="h-6 w-6" />

          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
            PC
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-900">
              Prathmesh chikane
            </p>

            <p className="text-xs text-slate-500">
              Admin
            </p>
          </div>

          <ChevronDown className="hidden h-4 w-4 text-slate-600 sm:block" />
        </div>
      </div>
    </header>
  );
}
