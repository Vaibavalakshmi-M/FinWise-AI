import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Calendar,
  DollarSign,
  ArrowRight,
  Receipt,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { api } from '../services/api';

export default function Analytics({ trends = [], categories = [], summary, showToast }) {
  const [paypalTransactions, setPaypalTransactions] = useState([]);
  const [loadingPayPal, setLoadingPayPal] = useState(false);

  useEffect(() => {
    fetchPayPalTx();
  }, []);

  const fetchPayPalTx = async () => {
    try {
      setLoadingPayPal(true);
      const res = await api.getPayPalTransactions();
      if (res.success) {
        setPaypalTransactions(res.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load PayPal transactions:', err);
    } finally {
      setLoadingPayPal(false);
    }
  };

  const totalPayPalSpent = paypalTransactions
    .filter((t) => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* 1. Top Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            6-Month Average Savings
          </p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            ${(
              trends.reduce((sum, t) => sum + (t.savings || 0), 0) / Math.max(1, trends.length)
            ).toFixed(2)}
          </h3>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            Consistent surplus trajectory
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            PayPal Sandbox Volume
          </p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            ${totalPayPalSpent.toFixed(2)} USD
          </h3>
          <p className="text-xs text-blue-600 font-semibold mt-1">
            {paypalTransactions.length} Verified Server Captures
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Budget Health Score
          </p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">
            {summary?.savings_rate >= 20 ? 'Optimal' : 'Moderate'}
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            {summary?.savings_rate}% Current Month Rate
          </p>
        </div>
      </div>

      {/* 2. Multi-Month Trend Area Chart */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Historical Savings & Spending Curve</h3>
          <p className="text-xs text-slate-500">Visualizing income vs. expense accumulation over time</p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" />
              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. PayPal Sandbox Transaction Ledger */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                P
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Verified PayPal Sandbox Transactions
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Order creation and server-side capture log verified via PayPal REST API
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
            Server-Side Verified
          </span>
        </div>

        {paypalTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-600">No PayPal transactions yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Use the Smart Purchase Advisor to test a PayPal Sandbox checkout
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Item / Service</th>
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Capture ID</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paypalTransactions.map((ptx) => (
                  <tr key={ptx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {ptx.created_at ? ptx.created_at.split(' ')[0] : 'Today'}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{ptx.purchase_item}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{ptx.order_id}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {ptx.capture_id || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{ptx.category_name || 'Shopping & Tech'}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {ptx.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                      ${ptx.amount?.toFixed(2)} {ptx.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
