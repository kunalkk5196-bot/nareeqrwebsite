const API_BASE = 'http://localhost:5000/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('naree_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    localStorage.removeItem('naree_token');
    localStorage.removeItem('naree_user');
    window.location.href = '/login';
  }

  const data: ApiResponse<T> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'API request failed');
  }

  return data.data as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => request('/auth/me'),
  getDemoAccounts: () => request('/auth/demo-accounts'),

  // Dashboard
  getDashboardMetrics: () => request('/dashboard'),
  getDashboardCharts: (period: string = '7d') => request(`/dashboard/charts?period=${period}`),

  // Machines
  getMachines: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/machines?${query}`);
  },
  getMachine: (id: string) => request(`/machines/${id}`),
  createMachine: (payload: any) =>
    request('/machines', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateMachine: (id: string, payload: any) =>
    request(`/machines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  refillStock: (id: string, payload: { quantity: number; reason?: string }) =>
    request(`/machines/${id}/stock-refill`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteMachine: (id: string) => request(`/machines/${id}`, { method: 'DELETE' }),
  restoreMachine: (id: string) => request(`/machines/${id}/restore`, { method: 'POST' }),
  deleteMachinePermanently: (id: string) => request(`/machines/${id}/permanent`, { method: 'DELETE' }),

  // Payments
  getPayments: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/payments?${query}`);
  },
  getPayment: (id: string) => request(`/payments/${id}`),
  simulatePayment: (payload: any) =>
    request('/payments/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  verifyPaymentLive: (id: string) =>
    request(`/payments/${id}/verify-live`, { method: 'POST' }),

  // Dispensing
  getDispensing: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/dispensing?${query}`);
  },

  // Stock
  getStock: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/stock?${query}`);
  },
  adjustStock: (payload: { machineId: string; newStock: number; reason: string }) =>
    request('/stock/adjust', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Reconciliation
  getReconciliation: () => request('/reconciliation'),
  resolveReconciliation: (payload: { paymentId: string; action: string; notes?: string }) =>
    request('/reconciliation/resolve', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // QR Activity
  getQrActivity: () => request('/qr-activity'),

  // Reports
  getReportSummary: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports/summary?${query}`);
  },

  // Notifications
  getNotifications: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/notifications?${query}`);
  },
  markNotificationRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () =>
    request('/notifications/mark-all-read', { method: 'POST' }),

  // Users
  getUsers: () => request('/users'),
  createUser: (payload: any) =>
    request('/users', { method: 'POST', body: JSON.stringify(payload) }),
  toggleUserStatus: (id: string) =>
    request(`/users/${id}/status`, { method: 'PUT' }),

  // Audit Logs
  getAuditLogs: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/audit-logs?${query}`);
  },

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (payload: any) =>
    request('/settings', { method: 'PUT', body: JSON.stringify(payload) }),
};
