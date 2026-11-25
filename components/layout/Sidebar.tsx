"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  LayoutDashboard,
  Building2,
  UsersRound,
  FileText,
  // ClipboardPlus,
  WalletCards,
  // CircleDollarSign,
  // Receipt,
  Wrench,
  // ListChecks,
  Users,
  // ClipboardCheck,
  FileChartLine,
  Settings,
  BanknoteArrowDown,
  FolderOpen,
  MessageSquare,
  Receipt,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
const menuGroups = [
  {
    items: [{ name: "Dashboard", href: "/dashboard", icon: House }],
  },
  {
    title: "PROPERTIES",
    items: [
      { name: "Properties & Units", href: "/properties", icon: Building2 },
      { name: "Tenants", href: "/tenants", icon: UsersRound },
      { name: "Leases", href: "/leases", icon: FileText },
      { name: "Maintenance", href: "/maintenance", icon: Wrench },
      { name: "Documents", href: "/documents", icon: FolderOpen },
    ],
  },
  {
    title: "PAYMENTS",
    items: [
      { name: "Rent & Payments", href: "/rent-payments", icon: WalletCards },
      { name: "Expenses", href: "/expenses", icon: BanknoteArrowDown },
      { name: "Billing & Invoices", href: "/billing&Invoice", icon: Receipt },
    ],
  },
  {
    title: "REPORTS",
    items: [
      { name: "Reports & Analytics", href: "/reports", icon: FileChartLine },
      { name: "Communication", href: "/communication", icon: MessageSquare },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { name: "Staff & Vendors", href: "/staff-vendors", icon: Users },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];
export default function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="offcanvas" className="bg-[#111827]">
      <SidebarHeader className="border-b border-white/10 bg-[#111827] p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-white">Property Manager</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#111827] text-white">
        {menuGroups.map((group) => (
          <SidebarGroup key={group.title || "main"} className="px-3 py-1">
            {group.title && (
              <p className="px-3 pb-2 pt-3 text-xs font-medium text-slate-400">
                {group.title}
              </p>
            )}

            <SidebarMenu>
              {group.items.map((item) => {
                const Icon = item.icon;

                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      render={
                        <Link
                          href={item.href}
                          onClick={() => setOpenMobile(false)}
                        />
                      }
                      isActive={isActive}
                      tooltip={item.name}
                      className={`
                  h-11 w-full text-base
                  ${isActive
                          ? "bg-gray-600 text-white hover:bg-gray-400 hover:text-white"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                        }
                `}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 bg-[#111827] p-4">
        <div className="flex items-center gap-3 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 font-semibold">
            P
          </div>
          <div>
            <p className="text-sm font-medium">My Account</p>
            <p className="text-xs text-slate-400">Property manager</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
