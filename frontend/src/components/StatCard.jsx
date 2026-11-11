import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Wallet, PiggyBank, Flame } from 'lucide-react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon = DollarSign,
  color = 'brand',
  trend,
  trendType = 'positive',
  progress,
  onClick
}) {
  const colorStyles = {
    brand: {
      bg: 'bg-emerald-50 text-emerald-600',
      progress: 'bg-emerald-500',
    },
    blue: {
      bg: 'bg-blue-50 text-blue-600',
      progress: 'bg-blue-500',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      progress: 'bg-amber-500',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600',
      progress: 'bg-rose-500',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600',
      progress: 'bg-purple-500',
    },
  }[color] || {
    bg: 'bg-emerald-50 text-emerald-600',
    progress: 'bg-emerald-500',
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm transition-all duration-200 hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-brand-300' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            {title}
          </p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorStyles.bg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-3.5 text-xs">
          {trend && (
            <span
              className={`flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-md ${
                trendType === 'positive'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {trendType === 'positive' ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {trend}
            </span>
          )}
          {subtitle && <span className="text-slate-500 truncate">{subtitle}</span>}
        </div>
      )}

      {progress !== undefined && (
        <div className="mt-3">
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${colorStyles.progress}`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
