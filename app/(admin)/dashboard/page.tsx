import StatCard from "@/components/dashboard/StatCard";
import RentChart from "@/components/dashboard/RentChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { stats, tasks } from "@/lib/mock-data/dashboard";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Income" value={stats.income} />
        <StatCard title="Expenses" value={stats.expenses} />
        <StatCard title="Balance" value={stats.balance} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rent Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <RentChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {tasks.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
