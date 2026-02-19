"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

type CategoryDatum = { name: string; value: number };

export function DashboardCharts({ categoryData }: { categoryData: CategoryDatum[] }) {
  if (categoryData.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-4">Spending by category</h2>
        <p className="text-zinc-500 dark:text-zinc-400">No spending data this month. Connect an account or upload a statement.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-sm">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-4">Spending by category (this month)</h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip formatter={(value: number | undefined) => [value != null ? `$${value.toFixed(2)}` : "", "Spent"]} />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Spent" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {categoryData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number | undefined) => [value != null ? `$${value.toFixed(2)}` : "", "Spent"]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
