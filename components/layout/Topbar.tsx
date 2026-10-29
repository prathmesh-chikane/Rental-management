import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* The trigger exposes the off-canvas sidebar on mobile and collapses it on desktop. */}
        <SidebarTrigger
          aria-label="Toggle navigation"
          className="shrink-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        />
        <div className="w-full max-w-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search..."
              className="h-9 border-slate-200 bg-slate-50 pl-9 text-sm placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pl-4">
        <button
          aria-label="Notifications"
          className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
            P
          </div>
          <span className="hidden text-sm font-medium text-slate-700 sm:block">
            Prathmesh
          </span>
        </div>
      </div>
    </header>
  );
}
