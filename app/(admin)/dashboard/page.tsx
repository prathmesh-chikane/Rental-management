import StatCard from "@/components/dashboard/StatCard";
import RentChart from "@/components/dashboard/RentChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { stats, tasks } from "@/lib/mock-data/dashboard";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold tracking-tight text-slate-800">Dashboard</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Income" value={stats.income} />
        <StatCard title="Expenses" value={stats.expenses} />
        <StatCard title="Balance" value={stats.balance} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-slate-800">Rent Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <RentChart />
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-slate-800">Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 pt-2 text-sm text-slate-700">
              {tasks.map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-slate-400" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
