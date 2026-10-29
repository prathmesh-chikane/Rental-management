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

const menu = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Properties", href: "#", icon: Building2 },
  { name: "Tenants", href: "#", icon: Users },
  { name: "Finances", href: "#", icon: Wallet },
  { name: "Maintenance", href: "#", icon: Wrench },
  { name: "Settings", href: "#", icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="offcanvas" className="bg-[#111827]">
      <SidebarHeader className="border-b border-white/10 bg-[#111827] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-white">Property Manager</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#111827] text-white">
        <SidebarGroup className="p-3">
          <SidebarMenu>
            {menu.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

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
                    className="h-10 w-full text-sm text-slate-300 hover:bg-white/10 hover:text-white data-[active=true]:bg-emerald-500/15 data-[active=true]:text-emerald-300"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 bg-[#111827] p-4">
        <div className="flex items-center gap-3 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 font-semibold">
            N
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
