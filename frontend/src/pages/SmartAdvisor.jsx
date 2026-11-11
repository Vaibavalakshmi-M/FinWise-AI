import React, { useState } from 'react';
import {
  Sparkles,
  ShoppingBag,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  TrendingDown,
  Clock,
  Wallet,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';

export default function SmartAdvisor({
  categories = [],
  summary,
  onOpenPayPalModal,
  showToast,
}) {
  const [itemName, setItemName] = useState('Sony Noise-Cancelling Headphones');
  const [price, setPrice] = useState('149.99');
  const [categoryName, setCategoryName] = useState('Shopping & Tech');
  const [urgency, setUrgency] = useState('want');
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);

  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || !price || parseFloat(price) <= 0) {
      showToast('Please provide a valid item name and price.', 'error');
      return;
    }

    try {
      setEvaluating(true);
      const res = await api.evaluatePurchase({
        item_name: itemName.trim(),
        price: parseFloat(price),
        category_name: categoryName,
        urgency,
      });
      setResult(res);
      showToast('Purchase analyzed successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Evaluation failed', 'error');
    } finally {
      setEvaluating(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200', bgLight: 'bg-emerald-50' };
    if (score >= 50) return { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200', bgLight: 'bg-amber-50' };
    return { bg: 'bg-rose-500', text: 'text-rose-700', border: 'border-rose-200', bgLight: 'bg-rose-50' };
  };

  const handleProceedToPayPal = () => {
    if (!result) return;
    const cat = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
    onOpenPayPalModal({
      item_name: result.item_name,
      price: result.price,
      category_id: cat ? cat.id : null,
      category_name: categoryName,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Overview Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Spending Decision Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Evaluate Before You Buy
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Never wonder if a purchase will derail your budget. Enter an intended purchase, and FinWise AI cross-references your current available balance, category headroom, and burn rate.
            </p>
          </div>

          {/* Quick Balance Status pill */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shrink-0 text-center md:text-right">
            <span className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider block">
              Remaining Balance
            </span>
            <span className="text-2xl font-black text-white">
              ${summary?.remaining_budget?.toFixed(2) || '0.00'}
            </span>
            <span className="text-[10px] text-emerald-200/70 block mt-0.5">
              Current Month Available
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Card (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Planned Purchase Details</h3>
              <p className="text-[11px] text-slate-500">Provide item details to simulate impact</p>
            </div>
          </div>

          <form onSubmit={handleEvaluate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Item / Service Name *
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Ergonomic Keyboard, Winter Coat"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Price (USD) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700 bg-white cursor-pointer"
              >
                {categories
                  .filter((c) => c.type === 'expense')
                  .map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Need vs. Want
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setUrgency('need')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    urgency === 'need'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Essential Need
                </button>
                <button
                  type="button"
                  onClick={() => setUrgency('want')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    urgency === 'want'
                      ? 'bg-white text-amber-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Discretionary Want
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={evaluating}
              className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {evaluating ? (
                <span>Analyzing Financial Impact...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Evaluate Affordability</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Card (7 cols) */}
        <div className="lg:col-span-7">
          {result ? (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6 animate-fade-in">
              {/* Verdict Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Recommendation Verdict
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                    {result.verdict}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{result.summary}</p>
                </div>

                {/* Score Gauge Badge */}
                <div
                  className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 shrink-0 ${
                    getScoreColor(result.affordability_score).bgLight
                  } ${getScoreColor(result.affordability_score).border}`}
                >
                  <span
                    className={`text-2xl font-black ${
                      getScoreColor(result.affordability_score).text
                    }`}
                  >
                    {result.affordability_score}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    / 100 Score
                  </span>
                </div>
              </div>

              {/* Key Impact Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Daily Burn Impact
                  </span>
                  <span className="text-base font-bold text-slate-800 mt-1 block">
                    {result.metrics.days_equivalent} Days
                  </span>
                  <span className="text-[10px] text-slate-500">of average spend</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Category Headroom
                  </span>
                  <span
                    className={`text-base font-bold mt-1 block ${
                      result.metrics.category_remaining_after < 0
                        ? 'text-rose-600'
                        : 'text-slate-800'
                    }`}
                  >
                    ${result.metrics.category_remaining_after.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500">remaining after</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Month Cushion
                  </span>
                  <span className="text-base font-bold text-emerald-600 mt-1 block">
                    ${result.metrics.remaining_after.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500">net balance</span>
                </div>
              </div>

              {/* Rationale Bullet Points */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Financial Analysis Rationale
                </h4>
                <div className="space-y-2">
                  {result.rationale.map((r, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700 flex items-start gap-2.5 leading-relaxed"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                      <div dangerouslySetInnerHTML={{ __html: r.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* PayPal Sandbox Checkout CTA */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>PayPal Sandbox Ready</span>
                  </div>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Pay securely in the sandbox. We will verify and auto-log this transaction.
                  </p>
                </div>

                <button
                  onClick={handleProceedToPayPal}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shrink-0"
                >
                  <span>Buy with PayPal Sandbox</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white border border-slate-200/80 shadow-sm text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Ready to Evaluate Your Purchase</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Fill in the details on the left and click "Evaluate Affordability". FinWise AI will compute your score and offer direct PayPal Sandbox checkout.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
