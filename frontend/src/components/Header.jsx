import React from 'react';
import { Menu, Plus, Calendar, DollarSign, Sparkles } from 'lucide-react';

export default function Header({
  activeTab,
  onOpenSidebar,
  onOpenExpenseModal,
  selectedMonth,
  setSelectedMonth,
  summary
}) {
  const titles = {
    dashboard: { title: 'Financial Dashboard', subtitle: 'Live overview of your income, expenses, and savings goals' },
    expenses: { title: 'Expenses & Budget Allocations', subtitle: 'Manage transactions and monthly category budgets' },
    advisor: { title: 'Smart Purchase Advisor', subtitle: 'AI-evaluated purchase affordability with PayPal Sandbox checkout' },
    ai: { title: 'AI Financial Assistant', subtitle: 'Real-time financial guidance grounded in your live spending data' },
    analytics: { title: 'Financial Analytics & Trends', subtitle: 'Historical spending trends and PayPal transaction records' },
    settings: { title: 'Settings & Integrations', subtitle: 'Configure PayPal Sandbox credentials and AI LLM provider keys' },
  };

  const current = titles[activeTab] || titles.dashboard;

  // Month list generator (current and past 5 months)
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      options.push({ val, label });
    }
    return options;
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {current.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Month Selector, Balance Chip & Add Expense Button */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 w-full sm:w-auto justify-end">
          {/* Month Selector */}
          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none outline-none cursor-pointer pr-2 font-medium text-slate-800"
            >
              {getMonthOptions().map((opt) => (
                <option key={opt.val} value={opt.val}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Available Balance Pill */}
          {summary && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 border border-brand-200/80 text-brand-900 text-xs font-semibold shadow-sm">
              <span className="text-brand-600">Balance:</span>
              <span className="text-sm font-bold text-brand-700">
                ${summary.remaining_budget?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Add Expense Button */}
          <button
            onClick={onOpenExpenseModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-brand-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>
    </header>
  );
}
