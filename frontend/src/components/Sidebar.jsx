import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Sparkles,
  Bot,
  BarChart3,
  Settings,
  CreditCard,
  ShieldCheck,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, user, onOpenExpenseModal, isOpen, onClose }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses & Budgets', icon: Receipt },
    { id: 'advisor', label: 'Smart Purchase Advisor', icon: Sparkles, badge: 'AI + PayPal' },
    { id: 'ai', label: 'AI Financial Assistant', icon: Bot, badge: 'Smart' },
    { id: 'analytics', label: 'Analytics & Trends', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-72 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Brand Header */}
        <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-slate-900 tracking-tight">FinWise</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-brand-100 text-brand-700 rounded-md uppercase tracking-wider">AI</span>
            </div>
            <p className="text-xs text-slate-500">Smart Financial Assistant</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-200/60 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* PayPal Sandbox Status Banner */}
        <div className="p-4 mx-4 mb-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1">
              PayPal Sandbox Connected
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 leading-relaxed">
            REST API active. Payments are verified and captured securely on the backend.
          </p>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-semibold flex items-center justify-center text-sm border border-brand-200">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {user?.username || 'alex_student'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.email || 'alex@example.com'}
            </p>
          </div>
          <div className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-mono text-slate-500">
            DEMO
          </div>
        </div>
      </aside>
    </>
  );
}
