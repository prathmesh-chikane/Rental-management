import StatCard from "@/components/dashboard/StatCard";
import RentChart from "@/components/dashboard/RentChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { rentChart, stats, tasks } from "@/lib/mock-data/dashboard";
import {
  Banknote,
  CalendarDays,
  ClipboardList,
  ReceiptText,
  Wallet,
} from "lucide-react";

export default function DashboardPage() {
  const period = `${rentChart[0].month} - ${rentChart[rentChart.length - 1].month}`;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Property overview
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Track rental income, expenses, and your upcoming tasks.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm">
          <CalendarDays className="h-4 w-4 text-emerald-600" />
          {period}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Income"
          value={stats.income}
          description="Rental income recorded"
          icon={Banknote}
          iconClassName="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Expenses"
          value={stats.expenses}
          description="Property expenses recorded"
          icon={ReceiptText}
          iconClassName="bg-amber-50 text-amber-700"
        />
        <StatCard
          title="Overdue"
          value={stats.overdue}
          description="Amount overdue"
          icon={Wallet}
          iconClassName="bg-sky-50 text-sky-700"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.9fr)]">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-0">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Rent overview
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Expected rent compared with payments received
              </p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
              <Banknote className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <RentChart />
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-0">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Upcoming tasks
              </CardTitle>
            </div>
            <div className="rounded-lg bg-violet-50 p-2 text-violet-700">
              <ClipboardList className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100">
              {tasks.map((task, index) => (
                <li key={task} className="flex items-start gap-3 py-4">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-sm leading-5 text-slate-700">
                    {task}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
