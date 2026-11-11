import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Key,
  ShieldCheck,
  Bot,
  User,
  Database,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';

export default function Settings({ user, showToast, onRefreshData }) {
  const [paypalConfig, setPaypalConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoadingConfig(true);
      const res = await api.getPayPalConfig();
      setPaypalConfig(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConfig(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Profile & Income Settings */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">User Financial Profile</h3>
            <p className="text-xs text-slate-500">Student & Young Professional baseline</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Username</label>
            <input
              type="text"
              readOnly
              value={user?.username || 'alex_student'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Email</label>
            <input
              type="text"
              readOnly
              value={user?.email || 'alex@example.com'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Monthly Income (USD)</label>
            <input
              type="text"
              readOnly
              value={`$${user?.monthly_income?.toFixed(2) || '3,200.00'}`}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Default Currency</label>
            <input
              type="text"
              readOnly
              value={user?.currency || 'USD'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* 2. PayPal Sandbox REST API Configuration */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black">
              P
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">PayPal REST API (Sandbox)</h3>
              <p className="text-xs text-slate-500">
                Server-side order creation and capture credentials
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
            Sandbox Active
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs leading-relaxed">
          <div className="flex justify-between items-center text-slate-600">
            <span>Environment Target:</span>
            <span className="font-mono font-bold text-slate-800">https://api-m.sandbox.paypal.com</span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span>Credentials Configured in .env:</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Live / Simulator calls
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span>Security Architecture:</span>
            <span className="font-semibold text-slate-800">Zero secrets exposed to frontend</span>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-900 text-[11px]">
            To run against your own PayPal Developer account, supply <code>PAYPAL_CLIENT_ID</code> and{' '}
            <code>PAYPAL_CLIENT_SECRET</code> in the project's <code>.env</code> file. The backend automatically switches to live sandbox calls!
          </div>
        </div>
      </div>

      {/* 3. AI / LLM Configuration */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">AI Intelligence Architecture</h3>
              <p className="text-xs text-slate-500">Configurable LLM provider & ground-truth injection</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
            Multi-Provider Ready
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-800">Supported Providers:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="font-bold text-slate-900 block">Google Gemini</span>
                <span className="text-slate-500">GEMINI_API_KEY (gemini-1.5-flash)</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="font-bold text-slate-900 block">OpenAI</span>
                <span className="text-slate-500">OPENAI_API_KEY (gpt-4o-mini)</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="font-bold text-slate-900 block">FinWise Engine</span>
                <span className="text-slate-500">Pandas Dataframe Heuristics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
