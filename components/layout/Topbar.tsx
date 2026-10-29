import { Bell, Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-slate-900 px-4 text-white shadow-sm">
      <div className="w-full max-w-xs">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search..."
            className="h-9 border-slate-700 bg-slate-800 pl-9 text-sm text-white placeholder:text-slate-400 focus-visible:border-slate-500 focus-visible:ring-slate-500/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 pl-4">
        <button className="rounded-md p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white">
          <Bell className="h-5 w-5" />
        </button>
        <button className="rounded-md p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white">
          <Star className="h-5 w-5" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
          P
        </div>
      </div>
    </header>
  );
}
