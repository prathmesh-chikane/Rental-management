import { Bell, Search, ChevronDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Topbar() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
      {/* Left Section: Sidebar + Search */}
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <SidebarTrigger
          aria-label="Toggle navigation"
          className="shrink-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        />

        <div className="w-full max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

            <Input
              placeholder="Search anything..."
              className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* Right Section: Notifications + Profile */}
      <div className="flex items-center gap-4 pl-3">
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

            <p className="text-xs text-slate-500">Admin</p>
          </div>

          <ChevronDown className="hidden h-4 w-4 text-slate-600 sm:block" />
        </div>
      </div>
    </header>
  );
}
