"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { rentChart } from "@/lib/mock-data/dashboard";

export default function RentChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rentChart} barGap={8} barCategoryGap={12}>
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
            }}
          />
          <Legend wrapperStyle={{ paddingTop: 12, fontSize: "12px" }} />
          <Bar dataKey="expected" fill="#9fb0c1" name="Expected" radius={[4, 4, 0, 0]} />
          <Bar dataKey="paid" fill="#2bb673" name="Paid" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
