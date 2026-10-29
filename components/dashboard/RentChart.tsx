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
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rentChart}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="paid" fill="#16a34a" name="Paid" />
          <Bar dataKey="expected" fill="#94a3b8" name="Expected" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
