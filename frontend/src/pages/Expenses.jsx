import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Tag,
  CreditCard,
  DollarSign,
  TrendingDown,
  Sliders,
  Check,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { api } from '../services/api';

export default function Expenses({
  expenses = [],
  categories = [],
  budgets = [],
  selectedMonth,
  onOpenExpenseModal,
  onEditExpense,
  onDeleteExpense,
  onRefreshData,
  showToast,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' or 'budgets'
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [editBudgetLimit, setEditBudgetLimit] = useState('');

  // Filter transactions
  const filteredExpenses = expenses.filter((tx) => {
    const matchesSearch =
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? String(tx.category_id) === String(categoryFilter) : true;
    const matchesPayment = paymentFilter ? tx.payment_method === paymentFilter : true;
    return matchesSearch && matchesCategory && matchesPayment;
  });

  const totalFiltered = filteredExpenses
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const handleSaveBudget = async (categoryId) => {
    try {
      await api.updateBudget({
        category_id: categoryId,
        monthly_limit: parseFloat(editBudgetLimit),
        month: selectedMonth,
      });
      showToast('Budget updated successfully!', 'success');
      setEditingBudgetId(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      showToast(err.message || 'Failed to update budget', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab toggle: Transactions vs Monthly Budgets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'transactions'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Transactions ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'budgets'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Category Budgets ({categories.filter((c) => c.type === 'expense').length})
          </button>
        </div>

        <button
          onClick={onOpenExpenseModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {activeTab === 'transactions' ? (
        /* TRANSACTIONS VIEW */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search description, notes or stores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full md:w-48 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Payment Method Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full md:w-44 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="">All Methods</option>
              <option value="card">Card</option>
              <option value="paypal">PayPal</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          {/* Table Card */}
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {filteredExpenses.length} transactions</span>
              <span>
                Total Filtered Expenses:{' '}
                <strong className="text-slate-900 font-bold">${totalFiltered.toFixed(2)}</strong>
              </span>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold text-slate-600">No transactions found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Try adjusting your filters or record a new transaction
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Notes</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{tx.date}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{tx.description}</span>
                            {tx.payment_method === 'paypal' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">
                                PayPal
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                            style={{
                              backgroundColor: `${tx.category_color}15`,
                              color: tx.category_color || '#10b981',
                            }}
                          >
                            {tx.category_name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 uppercase text-[10px] font-mono">
                          {tx.payment_method}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px] truncate max-w-xs">
                          {tx.notes || '—'}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-bold whitespace-nowrap ${
                            tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}${tx.amount?.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditExpense(tx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteExpense(tx.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CATEGORY BUDGETS VIEW */
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Monthly Category Budgets ({selectedMonth})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Set spending limits per category. FinWise AI references these limits when advising on planned purchases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories
              .filter((c) => c.type === 'expense')
              .map((c) => {
                const b = budgets.find((b) => b.category_id === c.id);
                const limit = b ? b.monthly_limit : 100.0;
                const isEditing = editingBudgetId === c.id;

                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="font-bold text-xs text-slate-800">{c.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">Monthly</span>
                    </div>

                    <div className="my-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="10"
                            value={editBudgetLimit}
                            onChange={(e) => setEditBudgetLimit(e.target.value)}
                            className="w-24 px-2 py-1 text-sm font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                          <button
                            onClick={() => handleSaveBudget(c.id)}
                            className="p-1 rounded-lg bg-brand-600 text-white hover:bg-brand-700"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingBudgetId(null)}
                            className="p-1 rounded-lg border hover:bg-slate-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-baseline justify-between">
                          <span className="text-2xl font-black text-slate-900">
                            ${limit.toFixed(2)}
                          </span>
                          <button
                            onClick={() => {
                              setEditingBudgetId(c.id);
                              setEditBudgetLimit(String(limit));
                            }}
                            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                          >
                            Edit Limit
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Evaluated live by Smart Purchase Advisor
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
