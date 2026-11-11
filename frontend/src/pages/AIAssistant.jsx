import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { api } from '../services/api';

export default function AIAssistant({ summary, showToast }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Hello Alex! I am **FinWise AI**, your personal financial assistant.

I have direct, real-time access to your SQLite financial records for **${summary?.month || 'this month'}**:
• **Income:** $${summary?.total_income?.toFixed(2) || '3,200.00'}
• **Total Expenses:** $${summary?.total_expenses?.toFixed(2) || '0.00'}
• **Available Balance:** $${summary?.remaining_budget?.toFixed(2) || '0.00'}
• **Savings Rate:** ${summary?.savings_rate || 0}%

How can I help you optimize your spending or evaluate a financial decision today?`,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    'How much did I spend on food this month?',
    'Can I afford to spend $80 this weekend?',
    'Where can I trim expenses to save $150?',
    'What is my daily burn rate and projected month-end balance?',
  ];

  const handleSend = async (messageText) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await api.chatWithAI(textToSend);
      if (res.success && res.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
      } else {
        throw new Error(res.error || 'Failed to get AI response');
      }
    } catch (err) {
      showToast(err.message || 'Error communicating with AI Assistant', 'error');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ I encountered an issue analyzing your records. Please ensure your backend is active and try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (content) => {
    // Basic formatted markdown (bullets, bold, newlines)
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      let formatted = line;
      // Bold
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italics
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <li key={idx} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: formatted.substring(2) }} />
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
      {/* AI Assistant Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900">FinWise AI Assistant</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Data Connected
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Grounded in your actual SQLite income, expenses, and monthly budgets
            </p>
          </div>
        </div>

        {/* Clear chat button */}
        <button
          onClick={() => {
            setMessages([messages[0]]);
            showToast('Chat history cleared', 'info');
          }}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors self-end sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Chat</span>
        </button>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-slate-900 text-white'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-brand-600 text-white rounded-tr-sm shadow-sm'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-sm space-y-1'
                }`}
              >
                {renderContent(msg.content)}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
              <span>Analyzing your financial data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt suggestions pills */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          Try asking:
        </span>
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="px-3 py-1 rounded-full bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-slate-700 text-[11px] font-medium whitespace-nowrap transition-all shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about your budget, spending trends, or planned expenses..."
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm text-slate-900 font-medium"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-brand-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
