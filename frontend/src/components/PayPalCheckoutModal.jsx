import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, ShoppingBag, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function PayPalCheckoutModal({ isOpen, onClose, purchaseItem, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [capturedData, setCapturedData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && purchaseItem) {
      setOrderData(null);
      setCapturedData(null);
      setError('');
      initiateOrder();
    }
  }, [isOpen, purchaseItem]);

  const initiateOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.createPayPalOrder({
        amount: purchaseItem.price,
        item_name: purchaseItem.item_name,
        category_id: purchaseItem.category_id,
        currency: 'USD',
      });
      setOrderData(res);
    } catch (err) {
      setError(err.message || 'Failed to initialize PayPal order.');
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async () => {
    if (!orderData?.order_id) return;

    try {
      setLoading(true);
      setError('');
      const res = await api.capturePayPalOrder(orderData.order_id);
      setCapturedData(res);
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      setError(err.message || 'Payment capture failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-sm">
              P
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">PayPal Sandbox Checkout</h2>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Server-side REST Order & Capture</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Order Success State */}
        {capturedData ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce-in">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">Payment Captured & Verified!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Transaction recorded in your SQLite database & budget
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Item:</span>
                <span className="font-semibold text-slate-800">{capturedData.purchase_item}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-600">${capturedData.amount?.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Order ID:</span>
                <span className="font-mono text-slate-700 text-[11px]">{capturedData.order_id}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Capture ID:</span>
                <span className="font-mono text-slate-700 text-[11px]">{capturedData.capture_id}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Verification:</span>
                <span className="font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                  Server-Verified
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm shadow-brand-500/30 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          /* Checkout Preparation State */
          <div className="mt-5 space-y-4">
            {/* Item Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-600 shadow-sm shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Planned Purchase</p>
                <h4 className="text-sm font-bold text-slate-900 truncate">{purchaseItem?.item_name}</h4>
                <p className="text-xs text-slate-500">{purchaseItem?.category_name || 'Shopping & Tech'}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-slate-900">${purchaseItem?.price?.toFixed(2)}</p>
                <p className="text-[10px] text-slate-400">USD</p>
              </div>
            </div>

            {/* Sandbox Notice */}
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>PayPal Developer Sandbox</span>
              </div>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Test environment enabled. No real currency is charged. Order is generated on Flask backend via PayPal REST API.
              </p>
            </div>

            {/* Order Details */}
            {orderData && (
              <div className="text-[11px] text-slate-500 space-y-1 px-1">
                <div className="flex justify-between">
                  <span>Backend Order ID:</span>
                  <span className="font-mono text-slate-700 font-semibold">{orderData.order_id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-emerald-600 font-bold uppercase">Ready for Capture</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                onClick={handleCapture}
                disabled={loading || !orderData}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Capturing Payment on Server...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm PayPal Sandbox Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
