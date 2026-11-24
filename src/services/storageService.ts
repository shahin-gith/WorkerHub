import {
  WorkShift,
  SalarySettings,
  DocumentItem,
  CompanyHistoryItem,
  SingaporeCV,
  CompanyReview,
  FinanceTransaction,
  MoneyAccount,
  SavingsGoal,
  DashboardCardConfig,
  Language,
} from '../types';
import { DEFAULT_SALARY_SETTINGS } from './salaryEngine';

const STORAGE_KEYS = {
  DEVICE_USER_ID: 'workerhub_device_uid_v1',
  SHIFTS: 'workerhub_shifts_v1',
  SALARY_SETTINGS: 'workerhub_salary_settings_v1',
  DOCUMENTS: 'workerhub_documents_v1',
  HISTORY: 'workerhub_history_v1',
  CV: 'workerhub_cv_v1',
  REVIEWS: 'workerhub_reviews_v1',
  FINANCE: 'workerhub_finance_v1',
  MONEY_ACCOUNTS: 'workerhub_money_accounts_v1',
  SAVINGS: 'workerhub_savings_v1',
  DASHBOARD_CONFIG: 'workerhub_dash_config_v1',
  LANGUAGE: 'workerhub_lang_v1',
  THEME: 'workerhub_theme_v1',
};

export const DEFAULT_DASHBOARD_CONFIG: DashboardCardConfig = {
  showTodaySummary: true,
  showMonthStats: true,
  showSalaryEstimate: true,
  showExpiryAlerts: true,
  showQuickActions: true,
  showEmergencyHelp: true,
};

export const PREFILLED_CV: SingaporeCV = {
  fullName: 'MD. Karim Hossain',
  contactNumber: '+65 8123 4567',
  email: '',
  residentialArea: 'Tuas South / Jurong West, Singapore',
  nationality: 'Bangladeshi',
  passType: 'Work Permit',
  yearsInSingapore: 3,
  professionalSummary:
    'Dedicated and safety-focused Singapore Work Permit worker with 3+ years of site experience in construction and marine engineering projects. Certified in MOM/BCA safety protocols, reliable in overtime and night-shift teamwork, and experienced with tools, rigging, and structural installation.',
  workExperience: [
    {
      id: 'we-starter-1',
      company: 'Singapore Engineering & Builders Pte Ltd',
      role: 'General Construction & Maintenance Worker',
      duration: '2023 - Present',
      responsibilities:
        'Assisted site supervisors with rebar, formwork, material handling, housekeeping, and daily toolbox safety briefings in compliance with WSH standards.',
    },
  ],
  skills: [
    'Workplace Safety & Health (WSH)',
    'Material Handling & Rigging',
    'Power Tools & Grinding',
    'Basic Structural & Civil Works',
    'Teamwork & Site Coordination',
  ],
  education: [
    {
      id: 'edu-starter-1',
      institution: 'Technical & Vocational Training Centre',
      qualification: 'Secondary School Certificate (SSC) & Trade Certification',
      year: '2020',
    },
  ],
  languages: [
    { id: 'la-1', name: 'Bengali', level: 'Native / Mother Tongue' },
    { id: 'la-2', name: 'English', level: 'Conversational (Worksite)' },
  ],
  drivingLicence: {
    hasLicence: false,
    licenceClass: '',
  },
  certificates: [
    {
      id: 'cert-starter-1',
      name: 'CSOC / Apply Workplace Safety & Health in Construction Sites (AWSHCS)',
      issuer: 'MOM / SCAL Accredited Training Centre',
      year: '2024',
    },
  ],
};

export const DEFAULT_MONEY_ACCOUNTS: MoneyAccount[] = [
  {
    id: 'acc-cash',
    name: 'Cash Wallet',
    type: 'cash',
    initialBalance: 0,
    createdAt: 1,
  },
  {
    id: 'acc-bank',
    name: 'Bank Account (POSB / DBS)',
    type: 'bank',
    initialBalance: 0,
    createdAt: 2,
  },
  {
    id: 'acc-savings',
    name: 'Savings Reserve',
    type: 'savings',
    initialBalance: 0,
    createdAt: 3,
  },
];

export const DEFAULT_SAVINGS_GOAL: SavingsGoal = {
  id: 'sav-1',
  title: 'Personal Savings Goal',
  targetSgd: 5000,
  currentSgd: 0,
  targetDate: '',
};

export const storageService = {
  getDeviceUserId(): string | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DEVICE_USER_ID);
      return raw && /^\d{6,12}$/.test(raw.trim()) ? raw.trim() : null;
    } catch {
      return null;
    }
  },

  saveDeviceUserId(userId: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DEVICE_USER_ID, userId.trim());
    } catch {
      // Ignore storage quota / restricted storage errors
    }
  },

  clearDeviceUserId(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.DEVICE_USER_ID);
    } catch {
      // Ignore storage errors
    }
  },

  getShifts(): WorkShift[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveShifts(shifts: WorkShift[]): void {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
  },

  getSalarySettings(): SalarySettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SALARY_SETTINGS);
    if (!raw) return { ...DEFAULT_SALARY_SETTINGS };
    try {
      return { ...DEFAULT_SALARY_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SALARY_SETTINGS };
    }
  },

  saveSalarySettings(settings: SalarySettings): void {
    localStorage.setItem(STORAGE_KEYS.SALARY_SETTINGS, JSON.stringify(settings));
  },

  getDocuments(): DocumentItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveDocuments(docs: DocumentItem[]): void {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
  },

  getCompanyHistory(): CompanyHistoryItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveCompanyHistory(history: CompanyHistoryItem[]): void {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  },

  getCV(): SingaporeCV {
    const raw = localStorage.getItem(STORAGE_KEYS.CV);
    if (!raw) return { ...PREFILLED_CV };
    try {
      return { ...PREFILLED_CV, ...JSON.parse(raw) };
    } catch {
      return { ...PREFILLED_CV };
    }
  },

  saveCV(cv: SingaporeCV): void {
    localStorage.setItem(STORAGE_KEYS.CV, JSON.stringify(cv));
  },

  getReviews(): CompanyReview[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveReviews(reviews: CompanyReview[]): void {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  },

  getFinance(): FinanceTransaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FINANCE);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveFinance(txs: FinanceTransaction[]): void {
    localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(txs));
  },

  getMoneyAccounts(): MoneyAccount[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MONEY_ACCOUNTS);
    if (!raw) return [...DEFAULT_MONEY_ACCOUNTS];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_MONEY_ACCOUNTS];
    } catch {
      return [...DEFAULT_MONEY_ACCOUNTS];
    }
  },

  saveMoneyAccounts(accounts: MoneyAccount[]): void {
    localStorage.setItem(STORAGE_KEYS.MONEY_ACCOUNTS, JSON.stringify(accounts));
  },

  getSavings(): SavingsGoal {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVINGS);
    if (!raw) return { ...DEFAULT_SAVINGS_GOAL };
    try {
      return { ...DEFAULT_SAVINGS_GOAL, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SAVINGS_GOAL };
    }
  },

  saveSavings(goal: SavingsGoal): void {
    localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(goal));
  },

  getDashboardConfig(): DashboardCardConfig {
    const raw = localStorage.getItem(STORAGE_KEYS.DASHBOARD_CONFIG);
    if (!raw) return { ...DEFAULT_DASHBOARD_CONFIG };
    try {
      return { ...DEFAULT_DASHBOARD_CONFIG, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_DASHBOARD_CONFIG };
    }
  },

  saveDashboardConfig(cfg: DashboardCardConfig): void {
    localStorage.setItem(STORAGE_KEYS.DASHBOARD_CONFIG, JSON.stringify(cfg));
  },

  getLanguage(): Language {
    const raw = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return raw === 'bn' ? 'bn' : 'en';
  },

  saveLanguage(lang: Language): void {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  },

  getTheme(): 'light' | 'dark' {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME);
    if (raw === 'dark' || raw === 'light') return raw;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  },

  saveTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  hasLocalRecords(): boolean {
    return (
      this.getShifts().length > 0 ||
      this.getDocuments().length > 0 ||
      this.getCompanyHistory().length > 0 ||
      this.getFinance().length > 0
    );
  },

  exportCompleteBackup(overrideData?: {
    shifts: WorkShift[];
    salarySettings: SalarySettings;
    documents: DocumentItem[];
    companyHistory: CompanyHistoryItem[];
    cv: SingaporeCV;
    finance: FinanceTransaction[];
    moneyAccounts?: MoneyAccount[];
    savings: SavingsGoal;
  }): void {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      appName: 'WorkerHub Singapore',
      data: overrideData || {
        shifts: this.getShifts(),
        salarySettings: this.getSalarySettings(),
        documents: this.getDocuments(),
        companyHistory: this.getCompanyHistory(),
        cv: this.getCV(),
        finance: this.getFinance(),
        moneyAccounts: this.getMoneyAccounts(),
        savings: this.getSavings(),
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workerhub_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  importBackup(jsonString: string): { success: boolean; message: string; data?: Record<string, unknown> } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data) {
        return { success: false, message: 'Invalid backup file structure.' };
      }
      if (Array.isArray(parsed.data.shifts)) this.saveShifts(parsed.data.shifts);
      if (parsed.data.salarySettings) this.saveSalarySettings(parsed.data.salarySettings);
      if (Array.isArray(parsed.data.documents)) this.saveDocuments(parsed.data.documents);
      if (Array.isArray(parsed.data.companyHistory)) this.saveCompanyHistory(parsed.data.companyHistory);
      if (parsed.data.cv) this.saveCV(parsed.data.cv);
      if (Array.isArray(parsed.data.finance)) this.saveFinance(parsed.data.finance);
      if (Array.isArray(parsed.data.moneyAccounts)) this.saveMoneyAccounts(parsed.data.moneyAccounts);
      if (parsed.data.savings) this.saveSavings(parsed.data.savings);

      return { success: true, message: 'Data restored successfully.', data: parsed.data };
    } catch (err: unknown) {
      return { success: false, message: (err as Error).message || 'Failed to parse backup.' };
    }
  },

  clearAllLocalRecords(): void {
    [
      STORAGE_KEYS.SHIFTS,
      STORAGE_KEYS.SALARY_SETTINGS,
      STORAGE_KEYS.DOCUMENTS,
      STORAGE_KEYS.HISTORY,
      STORAGE_KEYS.CV,
      STORAGE_KEYS.FINANCE,
      STORAGE_KEYS.MONEY_ACCOUNTS,
      STORAGE_KEYS.SAVINGS,
      STORAGE_KEYS.DASHBOARD_CONFIG,
    ].forEach((k) => localStorage.removeItem(k));
  },

  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  },
};
