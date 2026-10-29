"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { rentChart } from "@/lib/mock-data/dashboard";

export default function RentChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rentChart}
          barGap={8}
          barCategoryGap={18}
          margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickFormatter={(value: number) => `₹${value / 1000}k`}
            width={56}
          />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
            formatter={(value, name) => [
              `₹${Number(value).toLocaleString("en-IN")}`,
              name,
            ]}
            contentStyle={{
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              backgroundColor: "#fff",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingTop: 16, fontSize: "12px" }}
          />
          <Bar
            dataKey="expected"
            fill="#cbd5e1"
            name="Expected"
            radius={[5, 5, 0, 0]}
          />
          <Bar
            dataKey="paid"
            fill="#10b981"
            name="Paid"
            radius={[5, 5, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
