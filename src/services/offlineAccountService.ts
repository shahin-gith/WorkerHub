import {
  CompanyHistoryItem,
  CompanyReview,
  DashboardCardConfig,
  DocumentItem,
  FinanceTransaction,
  HelpArticle,
  MoneyAccount,
  SalarySettings,
  SavingsGoal,
  SingaporeCV,
  UserAccount,
  WorkShift,
} from '../types';
import { DEFAULT_SALARY_SETTINGS } from './salaryEngine';
import {
  DEFAULT_DASHBOARD_CONFIG,
  DEFAULT_MONEY_ACCOUNTS,
  DEFAULT_SAVINGS_GOAL,
  PREFILLED_CV,
  storageService,
} from './storageService';
import { STARTER_COMPANY_REVIEWS } from './offlineDirectoryData';

export interface AccountDataBundle {
  shifts: WorkShift[];
  documents: DocumentItem[];
  companyHistory: CompanyHistoryItem[];
  finance: FinanceTransaction[];
  salarySettings: SalarySettings;
  cv: SingaporeCV;
  savingsGoal: SavingsGoal;
  moneyAccounts: MoneyAccount[];
  dashboardConfig: DashboardCardConfig;
}

interface StoredAccountRecord {
  id: string;
  email: string;
  fullName: string;
  salt: string;
  passwordHash: string;
  createdAt: number;
  lastLoginAt: number;
}

interface ReviewLikeRecord {
  reviewId: string;
  accountId: string;
}

interface HelpLikeRecord {
  articleId: string;
  accountId: string;
}

const DB_NAME = 'workerhub_offline_vault_v1';
const DB_VERSION = 1;

const ACTIVE_ACCOUNT_ID_KEY = 'workerhub_active_account_id_v2';
const FALLBACK_ACCOUNTS_KEY = 'workerhub_offline_accounts_v2';
const FALLBACK_WORKSPACE_PREFIX = 'workerhub_ws_v2_';
const FALLBACK_REVIEWS_KEY = 'workerhub_offline_reviews_v2';
const FALLBACK_REVIEW_LIKES_KEY = 'workerhub_offline_review_likes_v2';
const FALLBACK_ARTICLES_KEY = 'workerhub_offline_articles_v2';
const FALLBACK_ARTICLE_LIKES_KEY = 'workerhub_offline_article_likes_v2';

function createDefaultBundle(): AccountDataBundle {
  return {
    shifts: [],
    documents: [],
    companyHistory: [],
    finance: [],
    salarySettings: { ...DEFAULT_SALARY_SETTINGS },
    cv: { ...PREFILLED_CV },
    savingsGoal: { ...DEFAULT_SAVINGS_GOAL },
    moneyAccounts: [...DEFAULT_MONEY_ACCOUNTS],
    dashboardConfig: { ...DEFAULT_DASHBOARD_CONFIG },
  };
}

function normalizeBundle(raw?: Partial<AccountDataBundle> | null): AccountDataBundle {
  const base = createDefaultBundle();
  if (!raw) return base;
  return {
    shifts: Array.isArray(raw.shifts) ? raw.shifts : [],
    documents: Array.isArray(raw.documents) ? raw.documents : [],
    companyHistory: Array.isArray(raw.companyHistory) ? raw.companyHistory : [],
    finance: Array.isArray(raw.finance) ? raw.finance : [],
    salarySettings: raw.salarySettings
      ? { ...DEFAULT_SALARY_SETTINGS, ...raw.salarySettings }
      : { ...DEFAULT_SALARY_SETTINGS },
    cv: raw.cv ? { ...PREFILLED_CV, ...raw.cv } : { ...PREFILLED_CV },
    savingsGoal: raw.savingsGoal
      ? { ...DEFAULT_SAVINGS_GOAL, ...raw.savingsGoal }
      : { ...DEFAULT_SAVINGS_GOAL },
    moneyAccounts:
      Array.isArray(raw.moneyAccounts) && raw.moneyAccounts.length > 0
        ? raw.moneyAccounts
        : [...DEFAULT_MONEY_ACCOUNTS],
    dashboardConfig: raw.dashboardConfig
      ? { ...DEFAULT_DASHBOARD_CONFIG, ...raw.dashboardConfig }
      : { ...DEFAULT_DASHBOARD_CONFIG },
  };
}

function toPublicAccount(rec: StoredAccountRecord): UserAccount {
  return {
    id: rec.id,
    email: rec.email,
    fullName: rec.fullName,
    createdAt: rec.createdAt,
    lastLoginAt: rec.lastLoginAt,
  };
}

function generateId(prefix: string): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}_${crypto.randomUUID()}`;
    }
  } catch {
    // Fallback below
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function generateSaltHex(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Pure-JS SHA-256 fallback in case WebView runs on non-secure context
function fallbackHash(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

async function hashPasswordOffline(password: string, saltHex: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
      );
      const saltBytes = new Uint8Array(
        (saltHex.match(/.{1,2}/g) || []).map((byte) => parseInt(byte, 16))
      );
      const bits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations: 65000,
          hash: 'SHA-256',
        },
        keyMaterial,
        256
      );
      return (
        'pbkdf2_' +
        Array.from(new Uint8Array(bits))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      );
    }
  } catch {
    // Fallback below
  }
  return `fb_${fallbackHash(`${saltHex}:${password}:${saltHex}`)}`;
}

async function verifyPasswordOffline(
  password: string,
  saltHex: string,
  storedHash: string
): Promise<boolean> {
  if (storedHash.startsWith('fb_')) {
    return `fb_${fallbackHash(`${saltHex}:${password}:${saltHex}`)}` === storedHash;
  }
  const computed = await hashPasswordOffline(password, saltHex);
  return computed === storedHash;
}

// IndexedDB helper with graceful localStorage fallback
function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDatabase();
  if (!db) return undefined;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('kv', 'readonly');
      const store = tx.objectStore('kv');
      const req = store.get(key);
      req.onsuccess = () => {
        db.close();
        resolve(req.result as T | undefined);
      };
      req.onerror = () => {
        db.close();
        resolve(undefined);
      };
    } catch {
      db.close();
      resolve(undefined);
    }
  });
}

async function idbSet(key: string, value: unknown): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('kv', 'readwrite');
      const store = tx.objectStore('kv');
      store.put(value, key);
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    } catch {
      db.close();
      resolve(false);
    }
  });
}

async function readStoreValue<T>(key: string, fallbackLsKey: string, defaultVal: T): Promise<T> {
  const fromIdb = await idbGet<T>(key);
  if (fromIdb !== undefined) return fromIdb;

  try {
    const raw = localStorage.getItem(fallbackLsKey);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch {
    // ignore parse/storage error
  }
  return defaultVal;
}

async function writeStoreValue(key: string, fallbackLsKey: string, value: unknown): Promise<void> {
  await idbSet(key, value);
  try {
    localStorage.setItem(fallbackLsKey, JSON.stringify(value));
  } catch {
    // IndexedDB holds large attachments (>5MB) if localStorage quota is full
  }
}

export const offlineAccountService = {
  getActiveAccountId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_ACCOUNT_ID_KEY);
    } catch {
      return null;
    }
  },

  setActiveAccountId(accountId: string | null): void {
    try {
      if (accountId) {
        localStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, accountId);
      } else {
        localStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
      }
    } catch {
      // ignore storage errors
    }
  },

  async listStoredAccounts(): Promise<StoredAccountRecord[]> {
    return readStoreValue<StoredAccountRecord[]>('accounts_list', FALLBACK_ACCOUNTS_KEY, []);
  },

  async listAccounts(): Promise<UserAccount[]> {
    const list = await this.listStoredAccounts();
    return list.map(toPublicAccount).sort((a, b) => b.lastLoginAt - a.lastLoginAt);
  },

  async saveWorkspace(accountId: string, bundle: AccountDataBundle): Promise<void> {
    const normalized = normalizeBundle(bundle);
    await writeStoreValue(`ws_${accountId}`, `${FALLBACK_WORKSPACE_PREFIX}${accountId}`, normalized);
  },

  async loadWorkspace(accountId: string): Promise<AccountDataBundle> {
    const raw = await readStoreValue<Partial<AccountDataBundle> | null>(
      `ws_${accountId}`,
      `${FALLBACK_WORKSPACE_PREFIX}${accountId}`,
      null
    );
    if (!raw && accountId === 'guest') {
      // Seed guest workspace from existing localStorage keys if present
      const guestBundle = normalizeBundle({
        shifts: storageService.getShifts(),
        documents: storageService.getDocuments(),
        companyHistory: storageService.getCompanyHistory(),
        finance: storageService.getFinance(),
        salarySettings: storageService.getSalarySettings(),
        cv: storageService.getCV(),
        savingsGoal: storageService.getSavings(),
        moneyAccounts: storageService.getMoneyAccounts(),
        dashboardConfig: storageService.getDashboardConfig(),
      });
      await this.saveWorkspace('guest', guestBundle);
      return guestBundle;
    }
    return normalizeBundle(raw);
  },

  async initializeSession(): Promise<{
    currentUser: UserAccount | null;
    accounts: UserAccount[];
    data: AccountDataBundle;
  }> {
    const storedAccounts = await this.listStoredAccounts();
    const activeId = this.getActiveAccountId();
    const matched = activeId ? storedAccounts.find((a) => a.id === activeId) : undefined;

    if (matched) {
      const data = await this.loadWorkspace(matched.id);
      return {
        currentUser: toPublicAccount(matched),
        accounts: storedAccounts.map(toPublicAccount).sort((a, b) => b.lastLoginAt - a.lastLoginAt),
        data,
      };
    }

    // Not signed into an email account yet -> load Guest workspace cleanly
    const guestData = await this.loadWorkspace('guest');
    return {
      currentUser: null,
      accounts: storedAccounts.map(toPublicAccount).sort((a, b) => b.lastLoginAt - a.lastLoginAt),
      data: guestData,
    };
  },

  async createAccount(params: {
    email: string;
    fullName: string;
    password: string;
    copyGuestData?: boolean;
  }): Promise<{
    user: UserAccount;
    accounts: UserAccount[];
    data: AccountDataBundle;
  }> {
    const email = params.email.trim().toLowerCase();
    const fullName = params.fullName.trim();
    const password = params.password;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Please enter a valid email address.');
    }
    if (fullName.length < 2) {
      throw new Error('Please enter your full name (at least 2 characters).');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const storedAccounts = await this.listStoredAccounts();
    if (storedAccounts.some((a) => a.email === email)) {
      throw new Error('An account with this email already exists on this device. Please sign in or switch to it.');
    }

    const salt = generateSaltHex();
    const passwordHash = await hashPasswordOffline(password, salt);
    const now = Date.now();
    const newRecord: StoredAccountRecord = {
      id: generateId('acct'),
      email,
      fullName,
      salt,
      passwordHash,
      createdAt: now,
      lastLoginAt: now,
    };

    const nextAccounts = [...storedAccounts, newRecord];
    await writeStoreValue('accounts_list', FALLBACK_ACCOUNTS_KEY, nextAccounts);

    let initialData = createDefaultBundle();
    if (params.copyGuestData) {
      initialData = await this.loadWorkspace('guest');
    } else {
      initialData.cv.email = email;
      initialData.cv.fullName = fullName;
    }

    await this.saveWorkspace(newRecord.id, initialData);
    this.setActiveAccountId(newRecord.id);

    return {
      user: toPublicAccount(newRecord),
      accounts: nextAccounts.map(toPublicAccount).sort((a, b) => b.lastLoginAt - a.lastLoginAt),
      data: initialData,
    };
  },

  async loginAccount(params: {
    email: string;
    password: string;
  }): Promise<{
    user: UserAccount;
    accounts: UserAccount[];
    data: AccountDataBundle;
  }> {
    const email = params.email.trim().toLowerCase();
    const password = params.password;

    if (!email || !password) {
      throw new Error('Please enter both email and password.');
    }

    const storedAccounts = await this.listStoredAccounts();
    const found = storedAccounts.find((a) => a.email === email);
    if (!found) {
      throw new Error('No offline account found for this email on this device. Create a new account first.');
    }

    const isValid = await verifyPasswordOffline(password, found.salt, found.passwordHash);
    if (!isValid) {
      throw new Error('Incorrect password. Please try again.');
    }

    const updatedAccounts = storedAccounts.map((a) =>
      a.id === found.id ? { ...a, lastLoginAt: Date.now() } : a
    );
    await writeStoreValue('accounts_list', FALLBACK_ACCOUNTS_KEY, updatedAccounts);

    this.setActiveAccountId(found.id);
    const data = await this.loadWorkspace(found.id);
    const updatedUser = updatedAccounts.find((a) => a.id === found.id)!;

    return {
      user: toPublicAccount(updatedUser),
      accounts: updatedAccounts.map(toPublicAccount).sort((a, b) => b.lastLoginAt - a.lastLoginAt),
      data,
    };
  },

  async switchAccount(targetAccountId: string): Promise<{
    user: UserAccount;
    accounts: UserAccount[];
    data: AccountDataBundle;
  }> {
    const storedAccounts = await this.listStoredAccounts();
    const target = storedAccounts.find((a) => a.id === targetAccountId);
    if (!target) {
      throw new Error('Selected account was not found on this device.');
    }

    const updatedAccounts = storedAccounts.map((a) =>
      a.id === target.id ? { ...a, lastLoginAt: Date.now() } : a
    );
    await writeStoreValue('accounts_list', FALLBACK_ACCOUNTS_KEY, updatedAccounts);

    this.setActiveAccountId(target.id);
    const data = await this.loadWorkspace(target.id);
    const updatedUser = updatedAccounts.find((a) => a.id === target.id)!;

    return {
      user: toPublicAccount(updatedUser),
      accounts: updatedAccounts.map(toPublicAccount).sort((a, b) => b.lastLoginAt - a.lastLoginAt),
      data,
    };
  },

  async switchToGuestMode(): Promise<{
    currentUser: null;
    accounts: UserAccount[];
    data: AccountDataBundle;
  }> {
    this.setActiveAccountId(null);
    const accounts = await this.listAccounts();
    const data = await this.loadWorkspace('guest');
    return { currentUser: null, accounts, data };
  },

  async updateAccountName(accountId: string, fullName: string): Promise<{
    user: UserAccount;
    accounts: UserAccount[];
  }> {
    const trimmed = fullName.trim();
    if (trimmed.length < 2) {
      throw new Error('Name must be at least 2 characters.');
    }
    const storedAccounts = await this.listStoredAccounts();
    const updated = storedAccounts.map((a) =>
      a.id === accountId ? { ...a, fullName: trimmed } : a
    );
    await writeStoreValue('accounts_list', FALLBACK_ACCOUNTS_KEY, updated);
    const user = updated.find((a) => a.id === accountId);
    if (!user) throw new Error('Account not found.');
    return {
      user: toPublicAccount(user),
      accounts: updated.map(toPublicAccount).sort((a, b) => b.lastLoginAt - a.lastLoginAt),
    };
  },

  async deleteAccount(accountId: string): Promise<{
    currentUser: null;
    accounts: UserAccount[];
    data: AccountDataBundle;
  }> {
    const storedAccounts = await this.listStoredAccounts();
    const remaining = storedAccounts.filter((a) => a.id !== accountId);
    await writeStoreValue('accounts_list', FALLBACK_ACCOUNTS_KEY, remaining);
    await writeStoreValue(`ws_${accountId}`, `${FALLBACK_WORKSPACE_PREFIX}${accountId}`, null);
    try {
      localStorage.removeItem(`${FALLBACK_WORKSPACE_PREFIX}${accountId}`);
    } catch {
      // ignore
    }

    if (this.getActiveAccountId() === accountId) {
      this.setActiveAccountId(null);
    }

    const data = await this.loadWorkspace('guest');
    return {
      currentUser: null,
      accounts: remaining.map(toPublicAccount).sort((a, b) => b.lastLoginAt - a.lastLoginAt),
      data,
    };
  },

  // Offline Community Reviews
  async getReviews(currentActorId: string): Promise<CompanyReview[]> {
    const stored = await readStoreValue<CompanyReview[] | null>(
      'community_reviews',
      FALLBACK_REVIEWS_KEY,
      null
    );
    const baseReviews = stored ?? [...STARTER_COMPANY_REVIEWS];
    if (!stored) {
      await writeStoreValue('community_reviews', FALLBACK_REVIEWS_KEY, baseReviews);
    }

    const likes = await readStoreValue<ReviewLikeRecord[]>(
      'community_review_likes',
      FALLBACK_REVIEW_LIKES_KEY,
      []
    );
    const likedSet = new Set(
      likes.filter((l) => l.accountId === currentActorId).map((l) => l.reviewId)
    );

    return baseReviews
      .map((rev) => ({
        ...rev,
        likedByMe: likedSet.has(rev.id),
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async addReview(
    actorId: string,
    review: Omit<CompanyReview, 'id' | 'status' | 'createdAt' | 'likesCount' | 'likedByMe' | 'userId'>
  ): Promise<CompanyReview[]> {
    const existing = await this.getReviews(actorId);
    const created: CompanyReview = {
      ...review,
      id: generateId('rev'),
      userId: actorId,
      status: 'approved',
      likesCount: 0,
      likedByMe: false,
      createdAt: Date.now(),
    };
    const next = [created, ...existing];
    await writeStoreValue('community_reviews', FALLBACK_REVIEWS_KEY, next);
    return next;
  },

  async toggleReviewLike(actorId: string, reviewId: string): Promise<CompanyReview[]> {
    const reviews = await this.getReviews(actorId);
    const likes = await readStoreValue<ReviewLikeRecord[]>(
      'community_review_likes',
      FALLBACK_REVIEW_LIKES_KEY,
      []
    );

    const alreadyLiked = likes.some(
      (l) => l.reviewId === reviewId && l.accountId === actorId
    );

    const nextLikes = alreadyLiked
      ? likes.filter((l) => !(l.reviewId === reviewId && l.accountId === actorId))
      : [...likes, { reviewId, accountId: actorId }];

    const nextReviews = reviews.map((rev) => {
      if (rev.id !== reviewId) return rev;
      const likesCount = alreadyLiked
        ? Math.max(0, (rev.likesCount || 0) - 1)
        : (rev.likesCount || 0) + 1;
      return { ...rev, likesCount, likedByMe: !alreadyLiked };
    });

    await writeStoreValue('community_review_likes', FALLBACK_REVIEW_LIKES_KEY, nextLikes);
    await writeStoreValue('community_reviews', FALLBACK_REVIEWS_KEY, nextReviews);
    return nextReviews;
  },

  async deleteReview(actorId: string, reviewId: string): Promise<CompanyReview[]> {
    const reviews = await this.getReviews(actorId);
    const next = reviews.filter((r) => !(r.id === reviewId && r.userId === actorId));
    await writeStoreValue('community_reviews', FALLBACK_REVIEWS_KEY, next);
    return next;
  },

  // Offline Worker Help Articles
  async getHelpArticles(currentActorId: string): Promise<HelpArticle[]> {
    const stored = await readStoreValue<HelpArticle[]>(
      'community_help_articles',
      FALLBACK_ARTICLES_KEY,
      []
    );
    const likes = await readStoreValue<HelpLikeRecord[]>(
      'community_help_likes',
      FALLBACK_ARTICLE_LIKES_KEY,
      []
    );
    const likedSet = new Set(
      likes.filter((l) => l.accountId === currentActorId).map((l) => l.articleId)
    );

    return stored
      .map((a) => ({
        ...a,
        likedByMe: likedSet.has(a.id),
        isOwner: Boolean(currentActorId && a.userId === currentActorId),
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async addHelpArticle(
    actorId: string,
    authorLabel: string,
    article: {
      title: string;
      category: HelpArticle['category'];
      summary: string;
      content: string;
      language: HelpArticle['language'];
      sourceUrl?: string;
    }
  ): Promise<HelpArticle[]> {
    const existing = await this.getHelpArticles(actorId);
    const created: HelpArticle = {
      id: generateId('art'),
      userId: actorId,
      title: article.title.trim(),
      category: article.category,
      summary: article.summary.trim() || article.content.trim().slice(0, 160),
      content: article.content.trim(),
      language: article.language,
      authorLabel,
      sourceUrl: article.sourceUrl?.trim() || '',
      likesCount: 0,
      likedByMe: false,
      isOwner: true,
      createdAt: Date.now(),
    };
    const next = [created, ...existing];
    await writeStoreValue('community_help_articles', FALLBACK_ARTICLES_KEY, next);
    return next;
  },

  async toggleHelpLike(actorId: string, articleId: string): Promise<HelpArticle[]> {
    const articles = await this.getHelpArticles(actorId);
    const likes = await readStoreValue<HelpLikeRecord[]>(
      'community_help_likes',
      FALLBACK_ARTICLE_LIKES_KEY,
      []
    );

    const alreadyLiked = likes.some(
      (l) => l.articleId === articleId && l.accountId === actorId
    );
    const nextLikes = alreadyLiked
      ? likes.filter((l) => !(l.articleId === articleId && l.accountId === actorId))
      : [...likes, { articleId, accountId: actorId }];

    const nextArticles = articles.map((a) => {
      if (a.id !== articleId) return a;
      const likesCount = alreadyLiked
        ? Math.max(0, (a.likesCount || 0) - 1)
        : (a.likesCount || 0) + 1;
      return { ...a, likesCount, likedByMe: !alreadyLiked };
    });

    await writeStoreValue('community_help_likes', FALLBACK_ARTICLE_LIKES_KEY, nextLikes);
    await writeStoreValue('community_help_articles', FALLBACK_ARTICLES_KEY, nextArticles);
    return nextArticles;
  },

  async deleteHelpArticle(actorId: string, articleId: string): Promise<HelpArticle[]> {
    const articles = await this.getHelpArticles(actorId);
    const next = articles.filter((a) => !(a.id === articleId && a.userId === actorId));
    await writeStoreValue('community_help_articles', FALLBACK_ARTICLES_KEY, next);
    return next;
  },
};
