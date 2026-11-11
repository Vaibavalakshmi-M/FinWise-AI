import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Flame,
  ArrowRight,
  Sparkles,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Tag,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import StatCard from '../components/StatCard';

const CATEGORY_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6',
  '#ec4899', '#ef4444', '#6366f1', '#06b6d4', '#64748b'
];

export default function Dashboard({
  summary,
  categories = [],
  trends = [],
  expenses = [],
  insights = [],
  onOpenExpenseModal,
  onOpenPayPalModal,
  setActiveTab,
  onEditExpense,
  onDeleteExpense
}) {
  const recentExpenses = expenses.slice(0, 7);

  // Format pie chart data
  const pieData = categories
    .filter(c => c.total_spent > 0)
    .map(c => ({
      name: c.category_name,
      value: c.total_spent,
      color: c.color || '#10b981'
    }));

  return (
    <div className="space-y-6">
      {/* 1. Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Monthly Income"
          value={`$${summary?.total_income?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`}
          subtitle="Salary & Side Freelance"
          icon={Wallet}
          color="blue"
          trend="+12.5%"
          trendType="positive"
        />

        <StatCard
          title="Total Expenses"
          value={`$${summary?.total_expenses?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`}
          subtitle={`Limit: $${summary?.total_budgeted?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`}
          icon={TrendingDown}
          color={summary?.budget_status === 'Over Budget' ? 'rose' : 'brand'}
          progress={(summary?.total_expenses / (summary?.total_budgeted || 1)) * 100}
        />

        <StatCard
          title="Remaining Balance"
          value={`$${summary?.remaining_budget?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`}
          subtitle="Available for savings & goals"
          icon={DollarSign}
          color="brand"
          trend={`${summary?.savings_rate || 0}% Saved`}
          trendType={summary?.savings_rate >= 20 ? 'positive' : 'negative'}
        />

        <StatCard
          title="Savings Rate"
          value={`${summary?.savings_rate || 0}%`}
          subtitle="Target benchmark: 20%"
          icon={PiggyBank}
          color={summary?.savings_rate >= 20 ? 'brand' : 'amber'}
          progress={summary?.savings_rate}
        />
      </div>

      {/* 2. Spending Velocity & AI Purchase Advisor CTA Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Burn Rate / Spending Velocity Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">Spending Velocity</h3>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              summary?.budget_status === 'Under Budget'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}>
              {summary?.budget_status || 'On Track'}
            </span>
          </div>

          <div className="my-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Current Daily Burn:</span>
              <span className="font-bold text-slate-800">${summary?.daily_avg_spend || 0} / day</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Projected Month-End Spend:</span>
              <span className="font-bold text-slate-800">${summary?.projected_spend || 0}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  summary?.projected_spend > summary?.total_budgeted ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{
                  width: `${Math.min(100, (summary?.projected_spend / (summary?.total_budgeted || 1)) * 100)}%`
                }}
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            {summary?.budget_status === 'Under Budget'
              ? 'At your current spending pace, you will finish the month comfortably within your budget!'
              : 'Pace is slightly elevated. Consider reducing discretionary dining and entertainment.'}
          </p>
        </div>

        {/* Smart Purchase Advisor + PayPal Quick Action */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-300">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold tracking-wider uppercase text-emerald-300">
                Smart Purchase Advisor
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight">
              Wondering if you can afford that next purchase?
            </h3>
            <p className="text-xs text-emerald-100/80 mt-1.5 max-w-xl leading-relaxed">
              Let FinWise AI evaluate your current budget headroom, burn rate, and savings goals. Proceed directly to PayPal Sandbox checkout with verified server-side capture!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-emerald-800/60">
            <button
              onClick={() => setActiveTab('advisor')}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Test Purchase Affordability</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
            >
              <span>Ask AI Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Charts Row: Monthly Trend & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Income vs Expenses Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Income vs. Spending Trend</h3>
              <p className="text-xs text-slate-500">6-Month historical comparison</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400"></span> Expenses
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(val) => [`$${val.toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar dataKey="expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut Chart */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Expense Breakdown</h3>
            <p className="text-xs text-slate-500">By category this month</p>
          </div>

          <div className="h-52 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`$${val.toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top 3 Categories legend */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {categories.slice(0, 3).map((c) => (
              <div key={c.category_id} className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="truncate max-w-[120px]">{c.category_name}</span>
                </div>
                <span className="font-bold text-slate-800">${c.total_spent?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Insights & Recent Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Spending Insights Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-sm text-slate-900">FinWise AI Insights</h3>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px] pr-1">
            {insights.map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  item.type === 'warning'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : item.type === 'caution'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : item.type === 'positive'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="font-bold mb-1 flex items-center gap-1.5">
                  {item.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                  {item.title}
                </div>
                <p className="text-[11px] opacity-90">{item.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Recent Transactions</h3>
              <p className="text-xs text-slate-500">Live SQLite transaction log</p>
            </div>
            <button
              onClick={() => setActiveTab('expenses')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-2.5">Date</th>
                  <th className="pb-2.5">Description</th>
                  <th className="pb-2.5">Category</th>
                  <th className="pb-2.5">Method</th>
                  <th className="pb-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentExpenses.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3 text-slate-500 whitespace-nowrap">{tx.date}</td>
                    <td className="py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{tx.description}</span>
                        {tx.payment_method === 'paypal' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">
                            PayPal
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{
                          backgroundColor: `${tx.category_color}15`,
                          color: tx.category_color || '#10b981',
                        }}
                      >
                        {tx.category_name}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 uppercase text-[10px] font-mono">
                      {tx.payment_method}
                    </td>
                    <td className={`py-3 text-right font-bold whitespace-nowrap ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
