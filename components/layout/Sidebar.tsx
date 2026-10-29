"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Wallet,
  Wrench,
  Settings,
} from "lucide-react";

const menu = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Properties", href: "#", icon: Building2 },
  { name: "Tenants", href: "#", icon: Users },
  { name: "Finances", href: "#", icon: Wallet },
  { name: "Maintenance", href: "#", icon: Wrench },
  { name: "Settings", href: "#", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-black text-white md:flex">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white">
          <LayoutDashboard className="h-4 w-4" />
        </div>
        <h1 className="text-xl font-semibold text-white-900">
          Property Manager
        </h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {menu.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] text-black font-medium transition-colors ${
                isActive
                  ? "bg-slate-100 text-black shadow-sm"
                  : "text-white hover:bg-yellow-50 hover:text-slate-900"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
          N
        </div>
      </div>
    </aside>
  );
}
