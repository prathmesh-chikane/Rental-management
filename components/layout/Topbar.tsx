import { Bell } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Topbar() {
  return (
    <header className="flex items-center justify-between border-b bg-white px-6">
      <Input placeholder="Search..." className="max-w-xs" />
      <Bell className="h-5 w-5" />
      <div className="h-8 w-8 rounded-full bg-gray-200"></div>
    </header>
  );
}
