import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';
import ExpenseModal from './components/ExpenseModal';
import PayPalCheckoutModal from './components/PayPalCheckoutModal';

import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import SmartAdvisor from './pages/SmartAdvisor';
import AIAssistant from './pages/AIAssistant';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [user, setUser] = useState({
    username: 'alex_student',
    email: 'alex@example.com',
    monthly_income: 3200.0,
    currency: 'USD',
  });

  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trends, setTrends] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [insights, setInsights] = useState([]);
  const [budgets, setBudgets] = useState([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [isPayPalModalOpen, setIsPayPalModalOpen] = useState(false);
  const [paypalPurchaseItem, setPaypalPurchaseItem] = useState(null);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadAllData = async (month = selectedMonth) => {
    try {
      const [sumRes, catRes, trendRes, expRes, insRes, budRes] = await Promise.all([
        api.getSummary(month).catch(() => ({ data: null })),
        api.getCategoryBreakdown(month).catch(() => ({ data: [] })),
        api.getTrends(6).catch(() => ({ data: [] })),
        api.getExpenses({ month }).catch(() => ({ expenses: [] })),
        api.getInsights(month).catch(() => ({ data: [] })),
        api.getBudgets(month).catch(() => ({ budgets: [] })),
      ]);

      if (sumRes.data) setSummary(sumRes.data);
      if (catRes.data) setCategories(catRes.data);
      if (trendRes.data) setTrends(trendRes.data);
      if (expRes.expenses) setExpenses(expRes.expenses);
      if (insRes.data) setInsights(insRes.data);
      if (budRes.budgets) setBudgets(budRes.budgets);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    loadAllData(selectedMonth);
  }, [selectedMonth]);

  const handleSaveExpense = async (formData) => {
    if (editingExpense) {
      await api.updateExpense(editingExpense.id, formData);
      showToast('Transaction updated successfully!', 'success');
    } else {
      await api.addExpense(formData);
      showToast('Transaction recorded successfully!', 'success');
    }
    setEditingExpense(null);
    loadAllData();
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.deleteExpense(id);
      showToast('Transaction deleted successfully', 'success');
      loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to delete transaction', 'error');
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleOpenPayPalModal = (purchaseDetails) => {
    setPaypalPurchaseItem(purchaseDetails);
    setIsPayPalModalOpen(true);
  };

  const handlePayPalSuccess = (result) => {
    showToast(`PayPal payment captured! Added to expenses.`, 'success');
    loadAllData();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenExpenseModal={() => {
            setEditingExpense(null);
            setIsExpenseModalOpen(true);
          }}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          summary={summary}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              summary={summary}
              categories={categories}
              trends={trends}
              expenses={expenses}
              insights={insights}
              onOpenExpenseModal={() => {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
              onOpenPayPalModal={handleOpenPayPalModal}
              setActiveTab={setActiveTab}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'expenses' && (
            <Expenses
              expenses={expenses}
              categories={categories}
              budgets={budgets}
              selectedMonth={selectedMonth}
              onOpenExpenseModal={() => {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
              onRefreshData={() => loadAllData(selectedMonth)}
              showToast={showToast}
            />
          )}

          {activeTab === 'advisor' && (
            <SmartAdvisor
              categories={categories}
              summary={summary}
              onOpenPayPalModal={handleOpenPayPalModal}
              showToast={showToast}
            />
          )}

          {activeTab === 'ai' && (
            <AIAssistant summary={summary} showToast={showToast} />
          )}

          {activeTab === 'analytics' && (
            <Analytics
              trends={trends}
              categories={categories}
              summary={summary}
              showToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <Settings
              user={user}
              showToast={showToast}
              onRefreshData={() => loadAllData(selectedMonth)}
            />
          )}
        </main>
      </div>

      {/* Expense Modal (Add / Edit) */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        editingExpense={editingExpense}
        categories={categories}
      />

      {/* PayPal Checkout Modal */}
      <PayPalCheckoutModal
        isOpen={isPayPalModalOpen}
        onClose={() => {
          setIsPayPalModalOpen(false);
          setPaypalPurchaseItem(null);
        }}
        purchaseItem={paypalPurchaseItem}
        onSuccess={handlePayPalSuccess}
      />

      {/* Floating Toast Notification */}
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
