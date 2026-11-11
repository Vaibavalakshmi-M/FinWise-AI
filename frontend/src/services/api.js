const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('finwise_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Health
  getHealth: () => request('/health'),

  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),

  // Analytics
  getSummary: (month) => request(`/analytics/summary${month ? `?month=${month}` : ''}`),
  getCategoryBreakdown: (month) => request(`/analytics/categories${month ? `?month=${month}` : ''}`),
  getTrends: (months = 6) => request(`/analytics/trends?months=${months}`),
  getInsights: (month) => request(`/analytics/insights${month ? `?month=${month}` : ''}`),

  // Expenses & Categories
  getCategories: () => request('/categories'),
  getExpenses: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, val);
      }
    });
    const qs = params.toString();
    return request(`/expenses${qs ? `?${qs}` : ''}`);
  },
  addExpense: (expenseData) => request('/expenses', { method: 'POST', body: JSON.stringify(expenseData) }),
  updateExpense: (id, expenseData) => request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(expenseData) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),

  // Budgets
  getBudgets: (month) => request(`/budgets${month ? `?month=${month}` : ''}`),
  updateBudget: (budgetData) => request('/budgets', { method: 'POST', body: JSON.stringify(budgetData) }),

  // AI Assistant & Smart Advisor
  chatWithAI: (message) => request('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  evaluatePurchase: (purchaseData) => request('/ai/evaluate-purchase', { method: 'POST', body: JSON.stringify(purchaseData) }),
  getAIHistory: () => request('/ai/history'),

  // PayPal
  getPayPalConfig: () => request('/paypal/config'),
  createPayPalOrder: (orderData) => request('/paypal/create-order', { method: 'POST', body: JSON.stringify(orderData) }),
  capturePayPalOrder: (orderId) => request('/paypal/capture-order', { method: 'POST', body: JSON.stringify({ order_id: orderId }) }),
  getPayPalTransactions: () => request('/paypal/transactions'),
};
