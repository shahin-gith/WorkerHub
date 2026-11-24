import {
  CompanyHistoryItem,
  CompanyReview,
  DashboardCardConfig,
  DeviceUser,
  DocumentItem,
  FinanceTransaction,
  GoogleCompanyResult,
  HelpArticle,
  HelpSearchResult,
  Language,
  MoneyAccount,
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
  moneyAccounts: MoneyAccount[] | null;
  dashboardConfig: DashboardCardConfig | null;
}

export interface DeviceAuthResponse {
  token: string;
  user: DeviceUser;
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
    };
    err.status = res.status;
    throw err;
  }

  return payload as T;
}

export const apiClient = {
  initDevice(displayName?: string) {
    return request<DeviceAuthResponse>('/api/device/init', {
      method: 'POST',
      body: JSON.stringify({ displayName }),
    });
  },

  connectDevice(userId: string, autoCreateIfMissing = false) {
    return request<DeviceAuthResponse>('/api/device/connect', {
      method: 'POST',
      body: JSON.stringify({ userId, autoCreateIfMissing }),
    });
  },

  updateDeviceProfile(token: string, displayName: string) {
    return request<{ user: DeviceUser }>(
      '/api/device/profile',
      { method: 'PATCH', body: JSON.stringify({ displayName }) },
      token
    );
  },

  deleteDeviceAccount(token: string) {
    return request<{ success: boolean }>('/api/device/account', { method: 'DELETE' }, token);
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

  saveMoneyAccounts(token: string, accounts: MoneyAccount[]) {
    return request<{ success: boolean }>(
      '/api/account/money-accounts',
      { method: 'PUT', body: JSON.stringify(accounts) },
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

  searchGoogleCompanies(query: string) {
    return request<{
      companies: GoogleCompanyResult[];
      groundingLinks: Array<{ title: string; uri: string }>;
    }>(`/api/companies/search?q=${encodeURIComponent(query)}`);
  },

  getReviews(token?: string | null) {
    return request<{ reviews: CompanyReview[] }>('/api/reviews', {}, token);
  },

  submitReview(
    token: string,
    review: Omit<CompanyReview, 'id' | 'status' | 'createdAt' | 'likesCount' | 'likedByMe' | 'userId'>
  ) {
    return request<{ success: boolean; id: string }>(
      '/api/reviews',
      { method: 'POST', body: JSON.stringify(review) },
      token
    );
  },

  likeReview(token: string, id: string) {
    return request<{ likedByMe: boolean; likesCount: number }>(
      `/api/reviews/${encodeURIComponent(id)}/like`,
      { method: 'POST' },
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

  deleteReview(token: string, id: string) {
    return request<{ success: boolean }>(
      `/api/reviews/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      token
    );
  },

  searchHelpArticles(query: string, lang: Language) {
    return request<HelpSearchResult>(
      `/api/help/search?q=${encodeURIComponent(query)}&lang=${lang}`
    );
  },

  getHelpArticles(token?: string | null) {
    return request<{ articles: HelpArticle[] }>('/api/help/articles', {}, token);
  },

  postHelpArticle(
    token: string,
    article: {
      title: string;
      category: HelpArticle['category'];
      summary: string;
      content: string;
      language: Language;
      authorLabel?: string;
      sourceUrl?: string;
    }
  ) {
    return request<{ success: boolean; id: string }>(
      '/api/help/articles',
      { method: 'POST', body: JSON.stringify(article) },
      token
    );
  },

  likeHelpArticle(token: string, id: string) {
    return request<{ likedByMe: boolean; likesCount: number }>(
      `/api/help/articles/${encodeURIComponent(id)}/like`,
      { method: 'POST' },
      token
    );
  },

  deleteHelpArticle(token: string, id: string) {
    return request<{ success: boolean }>(
      `/api/help/articles/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      token
    );
  },
};
