"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type CategoryDatum = { name: string; value: number };
type MonthlyDatum = { month: string; total: number };

function formatMonth(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const year = typeof y === "number" ? String(y).slice(-2) : "";
  return `${MONTH_NAMES[(m ?? 1) - 1]} '${year}`;
}

function formatCategoryLabel(name: string): string {
  const cleaned = name.replace(/_/g, " ").trim();
  if (cleaned.length <= 14) return cleaned;
  const words = cleaned.split(/\s+/);
  if (words.length >= 2) return `${words[0]} ${words[1].slice(0, 3)}`;
  return cleaned.slice(0, 12) + "…";
}

export function DashboardCharts({
  categoryData,
  monthlySpending,
}: {
  categoryData: CategoryDatum[];
  monthlySpending: MonthlyDatum[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hasMonthly = monthlySpending.some((d) => d.total > 0);

  if (categoryData.length === 0 && !hasMonthly) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-4">Spending by category</h2>
        <p className="text-zinc-500 dark:text-zinc-400">No spending data this month. Connect an account or upload a statement.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-4">Total spending by month</h2>
        {monthlySpending.length === 0 || !hasMonthly ? (
          <p className="text-zinc-500 dark:text-zinc-400 py-8">No spending data in the last 12 months.</p>
        ) : (
          <div className="w-full min-h-[360px]" style={{ height: 360 }}>
            {mounted && (
              <ResponsiveContainer width="100%" height={360}>
                <BarChart
                  data={monthlySpending.map((d) => ({ ...d, label: formatMonth(d.month) }))}
                  margin={{ top: 16, right: 16, left: 0, bottom: 100 }}
                >
                  <XAxis
                    dataKey="label"
                    angle={-45}
                    textAnchor="end"
                    height={90}
                    tick={{ fontSize: 11 }}
                    interval={0}
                    axisLine={false}
                    tickMargin={12}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
                  <Tooltip
                    formatter={(value: number | undefined) => [value != null ? `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "", "Spent"]}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="total" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-4">Spending by category (this month)</h2>
        <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={categoryData}
            margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
          >
            <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${v}`} />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fontSize: 11 }}
              interval={0}
              tickFormatter={formatCategoryLabel}
            />
            <Tooltip formatter={(value: number | undefined) => [value != null ? `$${value.toFixed(2)}` : "", "Spent"]} />
            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Spent" barCategoryGap="12%" />
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
    </div>
  );
}
