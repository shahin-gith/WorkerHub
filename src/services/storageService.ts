import {
  CompanyHistoryItem,
  CompanyReview,
  DashboardCardConfig,
  HelpArticle,
  Language,
  ManualWorkSummary,
  SalarySettings,
  SingaporeCV,
} from '../types';
import { DEFAULT_SALARY_SETTINGS } from './salaryEngine';
import { STARTER_COMPANY_REVIEWS } from './offlineDirectoryData';

const STORAGE_KEYS = {
  SALARY_SETTINGS: 'workerhub_salary_settings_v1',
  MANUAL_WORK_SUMMARY: 'workerhub_manual_work_v1',
  HISTORY: 'workerhub_history_v1',
  CV: 'workerhub_cv_v1',
  REVIEWS: 'workerhub_reviews_v2',
  HELP_ARTICLES: 'workerhub_help_articles_v2',
  HELP_LIKED_IDS: 'workerhub_help_liked_ids_v2',
  DASHBOARD_CONFIG: 'workerhub_dash_config_v2',
  LANGUAGE: 'workerhub_lang_v1',
  THEME: 'workerhub_theme_v1',
};

export const DEFAULT_DASHBOARD_CONFIG: DashboardCardConfig = {
  showSalaryEstimate: true,
  showQuickActions: true,
  showEmergencyHelp: true,
};

export const DEFAULT_MANUAL_WORK_SUMMARY: ManualWorkSummary = {
  workingDaysCount: 26,
  totalNormalHours: 208,
  totalOtHours: 40,
  restDaysWorkedCount: 0,
  publicHolidaysWorkedCount: 0,
  unpaidLeaveDaysCount: 0,
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

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota errors
  }
}

export const storageService = {
  getSalarySettings(): SalarySettings {
    const raw = safeGet(STORAGE_KEYS.SALARY_SETTINGS);
    if (!raw) return { ...DEFAULT_SALARY_SETTINGS };
    try {
      return { ...DEFAULT_SALARY_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SALARY_SETTINGS };
    }
  },

  saveSalarySettings(settings: SalarySettings): void {
    safeSet(STORAGE_KEYS.SALARY_SETTINGS, JSON.stringify(settings));
  },

  getManualWorkSummary(): ManualWorkSummary {
    const raw = safeGet(STORAGE_KEYS.MANUAL_WORK_SUMMARY);
    if (!raw) return { ...DEFAULT_MANUAL_WORK_SUMMARY };
    try {
      return { ...DEFAULT_MANUAL_WORK_SUMMARY, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_MANUAL_WORK_SUMMARY };
    }
  },

  saveManualWorkSummary(summary: ManualWorkSummary): void {
    safeSet(STORAGE_KEYS.MANUAL_WORK_SUMMARY, JSON.stringify(summary));
  },

  getCompanyHistory(): CompanyHistoryItem[] {
    const raw = safeGet(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveCompanyHistory(history: CompanyHistoryItem[]): void {
    safeSet(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  },

  getCV(): SingaporeCV {
    const raw = safeGet(STORAGE_KEYS.CV);
    if (!raw) return { ...PREFILLED_CV };
    try {
      return { ...PREFILLED_CV, ...JSON.parse(raw) };
    } catch {
      return { ...PREFILLED_CV };
    }
  },

  saveCV(cv: SingaporeCV): void {
    safeSet(STORAGE_KEYS.CV, JSON.stringify(cv));
  },

  getReviews(): CompanyReview[] {
    const raw = safeGet(STORAGE_KEYS.REVIEWS);
    if (!raw) return [...STARTER_COMPANY_REVIEWS];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [...STARTER_COMPANY_REVIEWS];
    } catch {
      return [...STARTER_COMPANY_REVIEWS];
    }
  },

  saveReviews(reviews: CompanyReview[]): void {
    safeSet(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  },

  getHelpArticles(): HelpArticle[] {
    const raw = safeGet(STORAGE_KEYS.HELP_ARTICLES);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveHelpArticles(articles: HelpArticle[]): void {
    safeSet(STORAGE_KEYS.HELP_ARTICLES, JSON.stringify(articles));
  },

  getDashboardConfig(): DashboardCardConfig {
    const raw = safeGet(STORAGE_KEYS.DASHBOARD_CONFIG);
    if (!raw) return { ...DEFAULT_DASHBOARD_CONFIG };
    try {
      return { ...DEFAULT_DASHBOARD_CONFIG, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_DASHBOARD_CONFIG };
    }
  },

  saveDashboardConfig(cfg: DashboardCardConfig): void {
    safeSet(STORAGE_KEYS.DASHBOARD_CONFIG, JSON.stringify(cfg));
  },

  getLanguage(): Language {
    const raw = safeGet(STORAGE_KEYS.LANGUAGE);
    return raw === 'bn' ? 'bn' : 'en';
  },

  saveLanguage(lang: Language): void {
    safeSet(STORAGE_KEYS.LANGUAGE, lang);
  },

  getTheme(): 'light' | 'dark' {
    const raw = safeGet(STORAGE_KEYS.THEME);
    if (raw === 'dark' || raw === 'light') return raw;
    return typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  },

  saveTheme(theme: 'light' | 'dark'): void {
    safeSet(STORAGE_KEYS.THEME, theme);
  },
};
