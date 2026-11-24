import {
  AuthUser,
  CompanyHistoryItem,
  CompanyReview,
  DashboardCardConfig,
  DocumentItem,
  FinanceTransaction,
  SalarySettings,
  SavingsGoal,
  SingaporeCV,
  WorkShift,
} from '../types';

export interface AccountDataBundle {
  shifts: WorkShift[];
  documents: DocumentItem[];
  companyHistory: CompanyHistoryItem[];
  finance: FinanceTransaction[];
  salarySettings: SalarySettings | null;
  cv: SingaporeCV | null;
  savingsGoal: SavingsGoal | null;
  dashboardConfig: DashboardCardConfig | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  data: AccountDataBundle;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(payload.error || `Request failed (${res.status})`) as Error & {
      status?: number;
      needsVerification?: boolean;
    };
    err.status = res.status;
    err.needsVerification = payload.needsVerification;
    throw err;
  }

  return payload as T;
}

export const apiClient = {
  getEmailStatus() {
    return request<{ emailConfigured: boolean; provider: 'resend' | 'smtp' | 'none' }>(
      '/api/auth/status'
    );
  },

  register(fullName: string, email: string, password: string) {
    return request<{ sent: boolean; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    });
  },

  verifyRegistration(email: string, otp: string) {
    return request<AuthResponse>('/api/auth/verify-registration', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  sendOtp(email: string, purpose: 'verify_account' | 'login' | 'reset_password') {
    return request<{ sent: boolean; message: string }>('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, purpose }),
    });
  },

  loginWithPassword(email: string, password: string) {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  loginWithOtp(email: string, otp: string) {
    return request<AuthResponse>('/api/auth/login-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  resetPassword(email: string, otp: string, newPassword: string) {
    return request<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },

  logout(token: string) {
    return request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }, token);
  },

  deleteAccount(token: string) {
    return request<{ success: boolean }>('/api/auth/account', { method: 'DELETE' }, token);
  },

  getAccountData(token: string) {
    return request<{ data: AccountDataBundle }>('/api/account/data', {}, token);
  },

  importLocalData(token: string, bundle: Partial<AccountDataBundle>) {
    return request<{ data: AccountDataBundle }>(
      '/api/account/import-local',
      { method: 'POST', body: JSON.stringify(bundle) },
      token
    );
  },

  saveShift(token: string, shift: WorkShift) {
    return request<{ success: boolean }>(
      '/api/account/shifts',
      { method: 'POST', body: JSON.stringify(shift) },
      token
    );
  },

  deleteShift(token: string, id: string) {
    return request<{ success: boolean }>(
      `/api/account/shifts/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      token
    );
  },

  saveDocument(token: string, doc: DocumentItem) {
    return request<{ success: boolean }>(
      '/api/account/documents',
      { method: 'POST', body: JSON.stringify(doc) },
      token
    );
  },

  deleteDocument(token: string, id: string) {
    return request<{ success: boolean }>(
      `/api/account/documents/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      token
    );
  },

  saveHistoryItem(token: string, item: CompanyHistoryItem) {
    return request<{ success: boolean }>(
      '/api/account/history',
      { method: 'POST', body: JSON.stringify(item) },
      token
    );
  },

  deleteHistoryItem(token: string, id: string) {
    return request<{ success: boolean }>(
      `/api/account/history/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      token
    );
  },

  saveFinance(token: string, tx: FinanceTransaction) {
    return request<{ success: boolean }>(
      '/api/account/finance',
      { method: 'POST', body: JSON.stringify(tx) },
      token
    );
  },

  deleteFinance(token: string, id: string) {
    return request<{ success: boolean }>(
      `/api/account/finance/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      token
    );
  },

  saveSalarySettings(token: string, settings: SalarySettings) {
    return request<{ success: boolean }>(
      '/api/account/salary-settings',
      { method: 'PUT', body: JSON.stringify(settings) },
      token
    );
  },

  saveCV(token: string, cv: SingaporeCV) {
    return request<{ success: boolean }>(
      '/api/account/cv',
      { method: 'PUT', body: JSON.stringify(cv) },
      token
    );
  },

  saveSavingsGoal(token: string, goal: SavingsGoal) {
    return request<{ success: boolean }>(
      '/api/account/savings',
      { method: 'PUT', body: JSON.stringify(goal) },
      token
    );
  },

  saveDashboardConfig(token: string, config: DashboardCardConfig) {
    return request<{ success: boolean }>(
      '/api/account/dashboard-config',
      { method: 'PUT', body: JSON.stringify(config) },
      token
    );
  },

  getReviews(token?: string | null) {
    return request<{ reviews: CompanyReview[]; isAdmin: boolean }>('/api/reviews', {}, token);
  },

  submitReview(token: string, review: Omit<CompanyReview, 'id' | 'status' | 'createdAt'>) {
    return request<{ success: boolean; id: string }>(
      '/api/reviews',
      { method: 'POST', body: JSON.stringify(review) },
      token
    );
  },

  reportReview(token: string, id: string) {
    return request<{ success: boolean }>(
      `/api/reviews/${encodeURIComponent(id)}/report`,
      { method: 'POST' },
      token
    );
  },

  moderateReview(token: string, id: string, status: 'approved' | 'flagged') {
    return request<{ success: boolean }>(
      `/api/reviews/${encodeURIComponent(id)}/moderate`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      token
    );
  },

  deleteReview(token: string, id: string) {
    return request<{ success: boolean }>(
      `/api/reviews/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      token
    );
  },
};
