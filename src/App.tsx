import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  storageService,
  DEFAULT_DASHBOARD_CONFIG,
  DEFAULT_SAVINGS_GOAL,
  DEFAULT_MONEY_ACCOUNTS,
  PREFILLED_CV,
} from './services/storageService';
import { DEFAULT_SALARY_SETTINGS } from './services/salaryEngine';
import { apiClient, AccountDataBundle, DeviceAuthResponse } from './services/apiClient';
import {
  DeviceUser,
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
  HelpArticle,
  Language,
} from './types';
import { TopBar } from './components/Navigation/TopBar';
import { BottomNav, ActiveTab } from './components/Navigation/BottomNav';
import { DashboardView } from './components/Dashboard/DashboardView';
import { TimeCardView } from './components/TimeCard/TimeCardView';
import { SalaryCalculatorView } from './components/SalaryCalculator/SalaryCalculatorView';
import { DocumentVaultView } from './components/DocumentVault/DocumentVaultView';
import { CVBuilderView } from './components/CVBuilder/CVBuilderView';
import { CompanyHistoryView } from './components/CompanyHistory/CompanyHistoryView';
import { FinanceView } from './components/Finance/FinanceView';
import { CompanyReviewsView } from './components/CompanyReviews/CompanyReviewsView';
import { WorkerHelpView } from './components/WorkerHelp/WorkerHelpView';
import { TranslatorView } from './components/Translator/TranslatorView';
import { SettingsView } from './components/Settings/SettingsView';
import { DeviceIdModal } from './components/Auth/DeviceIdModal';
import { PWAInstallPrompt, OfflineStatusBanner } from './components/PWA/PWAComponents';
import { AlertCircle, X } from 'lucide-react';

export default function App() {
  // App-level UI state
  const [language, setLanguage] = useState<Language>(() => storageService.getLanguage());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => storageService.getTheme());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  const [isLogShiftModalOpen, setIsLogShiftModalOpen] = useState(false);

  // Device User ID & in-memory session token (token is never saved in localStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [deviceUser, setDeviceUser] = useState<DeviceUser | null>(() => {
    const activeId = storageService.getOrCreateDeviceUserId();
    return { id: activeId, displayName: 'Worker', role: 'worker', createdAt: Date.now() };
  });
  const [isDeviceIdModalOpen, setIsDeviceIdModalOpen] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [deviceSessionError, setDeviceSessionError] = useState<string | null>(null);
  const sessionInitPromiseRef = useRef<Promise<{ token: string; user: DeviceUser } | null> | null>(
    null
  );

  // Network online status
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Theme synchronization
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    storageService.saveTheme(theme);
  }, [theme]);

  // Language synchronization
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    storageService.saveLanguage(lang);
  };

  // Data collections state (initialized from local cache for instant offline load)
  const [shifts, setShifts] = useState<WorkShift[]>(() => storageService.getShifts());
  const [salarySettings, setSalarySettings] = useState<SalarySettings>(() =>
    storageService.getSalarySettings()
  );
  const [documents, setDocuments] = useState<DocumentItem[]>(() => storageService.getDocuments());
  const [companyHistory, setCompanyHistory] = useState<CompanyHistoryItem[]>(() =>
    storageService.getCompanyHistory()
  );
  const [cv, setCv] = useState<SingaporeCV>(() => storageService.getCV());
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [helpArticles, setHelpArticles] = useState<HelpArticle[]>([]);
  const [finance, setFinance] = useState<FinanceTransaction[]>(() => storageService.getFinance());
  const [moneyAccounts, setMoneyAccounts] = useState<MoneyAccount[]>(() =>
    storageService.getMoneyAccounts()
  );
  const [savingsGoal, setSavingsGoal] = useState<SavingsGoal>(() => storageService.getSavings());
  const [dashboardConfig, setDashboardConfig] = useState<DashboardCardConfig>(() =>
    storageService.getDashboardConfig()
  );

  // Apply server account data bundle into state & local offline cache
  const applyAccountBundle = useCallback((bundle: AccountDataBundle) => {
    const nextShifts = bundle.shifts || [];
    const nextDocs = bundle.documents || [];
    const nextHistory = bundle.companyHistory || [];
    const nextFinance = bundle.finance || [];
    const nextSalary = bundle.salarySettings
      ? { ...DEFAULT_SALARY_SETTINGS, ...bundle.salarySettings }
      : { ...DEFAULT_SALARY_SETTINGS };
    const nextCv = bundle.cv ? { ...PREFILLED_CV, ...bundle.cv } : { ...PREFILLED_CV };
    const nextSavings = bundle.savingsGoal
      ? { ...DEFAULT_SAVINGS_GOAL, ...bundle.savingsGoal }
      : { ...DEFAULT_SAVINGS_GOAL };
    const nextAccounts =
      bundle.moneyAccounts && bundle.moneyAccounts.length > 0
        ? bundle.moneyAccounts
        : [...DEFAULT_MONEY_ACCOUNTS];
    const nextDashCfg = bundle.dashboardConfig
      ? { ...DEFAULT_DASHBOARD_CONFIG, ...bundle.dashboardConfig }
      : { ...DEFAULT_DASHBOARD_CONFIG };

    setShifts(nextShifts);
    setDocuments(nextDocs);
    setCompanyHistory(nextHistory);
    setFinance(nextFinance);
    setSalarySettings(nextSalary);
    setCv(nextCv);
    setSavingsGoal(nextSavings);
    setMoneyAccounts(nextAccounts);
    setDashboardConfig(nextDashCfg);

    storageService.saveShifts(nextShifts);
    storageService.saveDocuments(nextDocs);
    storageService.saveCompanyHistory(nextHistory);
    storageService.saveFinance(nextFinance);
    storageService.saveSalarySettings(nextSalary);
    storageService.saveCV(nextCv);
    storageService.saveSavings(nextSavings);
    storageService.saveMoneyAccounts(nextAccounts);
    storageService.saveDashboardConfig(nextDashCfg);
  }, []);

  const loadLocalState = useCallback(() => {
    setShifts(storageService.getShifts());
    setSalarySettings(storageService.getSalarySettings());
    setDocuments(storageService.getDocuments());
    setCompanyHistory(storageService.getCompanyHistory());
    setCv(storageService.getCV());
    setFinance(storageService.getFinance());
    setMoneyAccounts(storageService.getMoneyAccounts());
    setSavingsGoal(storageService.getSavings());
    setDashboardConfig(storageService.getDashboardConfig());
  }, []);

  // Auto-bootstrap Device User ID on launch (single-flight mutex prevents duplicate ID creation)
  const ensureDeviceSession = useCallback(async (): Promise<{
    token: string;
    user: DeviceUser;
  } | null> => {
    if (sessionInitPromiseRef.current) {
      return sessionInitPromiseRef.current;
    }

    const promise = (async () => {
      try {
        const activeId = storageService.getOrCreateDeviceUserId();
        const res: DeviceAuthResponse = await apiClient.connectDevice(activeId, true);

        storageService.saveDeviceUserId(res.user.id);
        setAuthToken(res.token);
        setDeviceUser(res.user);
        setDeviceSessionError(null);

        // If this device has offline/local records and the server record is blank, upload them
        const serverIsEmpty =
          res.data.shifts.length === 0 &&
          res.data.documents.length === 0 &&
          res.data.companyHistory.length === 0 &&
          res.data.finance.length === 0;

        if (serverIsEmpty && storageService.hasLocalRecords()) {
          const imported = await apiClient.importLocalData(res.token, {
            shifts: storageService.getShifts(),
            documents: storageService.getDocuments(),
            companyHistory: storageService.getCompanyHistory(),
            finance: storageService.getFinance(),
            moneyAccounts: storageService.getMoneyAccounts(),
            salarySettings: storageService.getSalarySettings(),
            cv: storageService.getCV(),
            savingsGoal: storageService.getSavings(),
            dashboardConfig: storageService.getDashboardConfig(),
          });
          applyAccountBundle(imported.data);
        } else {
          applyAccountBundle(res.data);
        }

        setSyncError(null);
        return { token: res.token, user: res.user };
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Unable to reach sync server right now. Working in offline local mode.';
        setDeviceSessionError(msg);
        return null;
      } finally {
        sessionInitPromiseRef.current = null;
      }
    })();

    sessionInitPromiseRef.current = promise;
    return promise;
  }, [applyAccountBundle]);

  // Connect on startup and reconnect whenever returning online without an active session token
  useEffect(() => {
    if (isOnline && !authToken) {
      ensureDeviceSession();
    }
  }, [isOnline, authToken, ensureDeviceSession]);

  // Load community reviews & help articles
  const fetchReviews = useCallback(async (token: string | null) => {
    try {
      const res = await apiClient.getReviews(token);
      setReviews(res.reviews || []);
    } catch {
      // Reviews unavailable while offline
    }
  }, []);

  const fetchHelpArticles = useCallback(async (token: string | null) => {
    try {
      const res = await apiClient.getHelpArticles(token);
      setHelpArticles(res.articles || []);
    } catch {
      // Community articles unavailable while offline
    }
  }, []);

  useEffect(() => {
    fetchReviews(authToken);
    fetchHelpArticles(authToken);
  }, [authToken, fetchReviews, fetchHelpArticles]);

  const handleApiError = (err: unknown) => {
    const error = err as Error & { status?: number };
    if (error.status === 401) {
      ensureDeviceSession();
    } else {
      setSyncError(error.message || 'Failed to sync changes to server.');
    }
  };

  // Called when switching or generating a Device User ID inside DeviceIdModal
  const handleDeviceConnected = (res: DeviceAuthResponse) => {
    storageService.saveDeviceUserId(res.user.id);
    setAuthToken(res.token);
    setDeviceUser(res.user);
    setDeviceSessionError(null);
    setSyncError(null);
    applyAccountBundle(res.data);
  };

  const handleDeleteDeviceData = async () => {
    if (!authToken) return;
    try {
      await apiClient.deleteDeviceAccount(authToken);
      storageService.clearAllLocalRecords();
      storageService.clearDeviceUserId();
      setAuthToken(null);
      setDeviceUser(null);
      loadLocalState();
      await ensureDeviceSession();
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleImportBackupData = async (data: {
    shifts?: WorkShift[];
    salarySettings?: SalarySettings;
    documents?: DocumentItem[];
    companyHistory?: CompanyHistoryItem[];
    cv?: SingaporeCV;
    finance?: FinanceTransaction[];
    moneyAccounts?: MoneyAccount[];
    savings?: SavingsGoal;
  }) => {
    if (!authToken) return;
    const res = await apiClient.importLocalData(authToken, {
      shifts: Array.isArray(data.shifts) ? data.shifts : [],
      salarySettings: data.salarySettings || null,
      documents: Array.isArray(data.documents) ? data.documents : [],
      companyHistory: Array.isArray(data.companyHistory) ? data.companyHistory : [],
      cv: data.cv || null,
      finance: Array.isArray(data.finance) ? data.finance : [],
      moneyAccounts: Array.isArray(data.moneyAccounts) ? data.moneyAccounts : null,
      savingsGoal: data.savings || null,
    });
    applyAccountBundle(res.data);
  };

  const handleRefreshAllData = () => {
    if (authToken) {
      apiClient
        .getAccountData(authToken)
        .then((res) => applyAccountBundle(res.data))
        .catch(handleApiError);
    } else {
      loadLocalState();
    }
  };

  // Shift Handlers
  const handleSaveShift = (shift: WorkShift) => {
    const updated = [shift, ...shifts.filter((s) => s.id !== shift.id)];
    setShifts(updated);
    storageService.saveShifts(updated);
    if (authToken) {
      apiClient.saveShift(authToken, shift).catch(handleApiError);
    }
  };

  const handleDeleteShift = (id: string) => {
    const updated = shifts.filter((s) => s.id !== id);
    setShifts(updated);
    storageService.saveShifts(updated);
    if (authToken) {
      apiClient.deleteShift(authToken, id).catch(handleApiError);
    }
  };

  // Salary Settings Handler
  const handleUpdateSalarySettings = (settings: SalarySettings) => {
    setSalarySettings(settings);
    storageService.saveSalarySettings(settings);
    if (authToken) {
      apiClient.saveSalarySettings(authToken, settings).catch(handleApiError);
    }
  };

  // Document Handlers
  const handleSaveDocument = (doc: DocumentItem) => {
    const updated = [doc, ...documents.filter((d) => d.id !== doc.id)];
    setDocuments(updated);
    storageService.saveDocuments(updated);
    if (authToken) {
      apiClient.saveDocument(authToken, doc).catch(handleApiError);
    }
  };

  const handleDeleteDocument = (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    setDocuments(updated);
    storageService.saveDocuments(updated);
    if (authToken) {
      apiClient.deleteDocument(authToken, id).catch(handleApiError);
    }
  };

  // Company History Handlers
  const handleSaveHistoryItem = (item: CompanyHistoryItem) => {
    const updated = [item, ...companyHistory.filter((h) => h.id !== item.id)];
    setCompanyHistory(updated);
    storageService.saveCompanyHistory(updated);
    if (authToken) {
      apiClient.saveHistoryItem(authToken, item).catch(handleApiError);
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = companyHistory.filter((h) => h.id !== id);
    setCompanyHistory(updated);
    storageService.saveCompanyHistory(updated);
    if (authToken) {
      apiClient.deleteHistoryItem(authToken, id).catch(handleApiError);
    }
  };

  // CV Handler
  const handleUpdateCV = (updatedCv: SingaporeCV) => {
    setCv(updatedCv);
    storageService.saveCV(updatedCv);
    if (authToken) {
      apiClient.saveCV(authToken, updatedCv).catch(handleApiError);
    }
  };

  // Review Handlers (Direct post + Like button + Report + Delete)
  const getActiveToken = async (): Promise<string> => {
    if (authToken) return authToken;
    const session = await ensureDeviceSession();
    if (!session?.token) {
      throw new Error('Internet connection is required for community reviews.');
    }
    return session.token;
  };

  const handleSubmitReview = async (
    review: Omit<CompanyReview, 'id' | 'status' | 'createdAt' | 'likesCount' | 'likedByMe' | 'userId'>
  ) => {
    const token = await getActiveToken();
    await apiClient.submitReview(token, review);
    await fetchReviews(token);
  };

  const handleLikeReview = async (id: string) => {
    const token = await getActiveToken();
    const res = await apiClient.likeReview(token, id);
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, likedByMe: res.likedByMe, likesCount: res.likesCount } : r
      )
    );
  };

  const handleReportReview = async (id: string) => {
    const token = await getActiveToken();
    await apiClient.reportReview(token, id);
    await fetchReviews(token);
  };

  const handleDeleteReview = async (id: string) => {
    const token = await getActiveToken();
    await apiClient.deleteReview(token, id);
    await fetchReviews(token);
  };

  // Help Articles Handlers
  const handlePostHelpArticle = async (article: {
    title: string;
    category: HelpArticle['category'];
    summary: string;
    content: string;
    language: Language;
    sourceUrl?: string;
  }) => {
    const token = await getActiveToken();
    await apiClient.postHelpArticle(token, article);
    await fetchHelpArticles(token);
  };

  const handleLikeHelpArticle = async (id: string) => {
    const token = await getActiveToken();
    const res = await apiClient.likeHelpArticle(token, id);
    setHelpArticles((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, likedByMe: res.likedByMe, likesCount: res.likesCount } : a
      )
    );
  };

  const handleDeleteHelpArticle = async (id: string) => {
    const token = await getActiveToken();
    await apiClient.deleteHelpArticle(token, id);
    await fetchHelpArticles(token);
  };

  // Finance Handlers
  const handleSaveTransaction = (tx: FinanceTransaction) => {
    const updated = [tx, ...finance.filter((f) => f.id !== tx.id)];
    setFinance(updated);
    storageService.saveFinance(updated);
    if (authToken) {
      apiClient.saveFinance(authToken, tx).catch(handleApiError);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = finance.filter((f) => f.id !== id);
    setFinance(updated);
    storageService.saveFinance(updated);
    if (authToken) {
      apiClient.deleteFinance(authToken, id).catch(handleApiError);
    }
  };

  const handleSaveMoneyAccounts = (accounts: MoneyAccount[]) => {
    setMoneyAccounts(accounts);
    storageService.saveMoneyAccounts(accounts);
    if (authToken) {
      apiClient.saveMoneyAccounts(authToken, accounts).catch(handleApiError);
    }
  };

  const handleUpdateSavingsGoal = (goal: SavingsGoal) => {
    setSavingsGoal(goal);
    storageService.saveSavings(goal);
    if (authToken) {
      apiClient.saveSavingsGoal(authToken, goal).catch(handleApiError);
    }
  };

  // Dashboard Config Handler
  const handleUpdateDashboardConfig = (cfg: DashboardCardConfig) => {
    setDashboardConfig(cfg);
    storageService.saveDashboardConfig(cfg);
    if (authToken) {
      apiClient.saveDashboardConfig(authToken, cfg).catch(handleApiError);
    }
  };

  const resolvedWorkerName = cv.fullName || (deviceUser ? `Worker #${deviceUser.id}` : 'Worker');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors overflow-x-hidden">
      {/* PWA Install Banner */}
      <PWAInstallPrompt />

      {/* Top Bar */}
      <TopBar
        language={language}
        onLanguageChange={handleLanguageChange}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        isOnline={isOnline}
        deviceUser={deviceUser}
        onOpenDeviceIdModal={() => setIsDeviceIdModalOpen(true)}
      />

      {/* Offline Status Floating Toast */}
      <OfflineStatusBanner isOnline={isOnline} />

      {/* Sync Error Notice */}
      {syncError && (
        <div className="no-print max-w-5xl w-full mx-auto px-3 sm:px-4 pt-3">
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{syncError}</span>
            </div>
            <button
              onClick={() => setSyncError(null)}
              className="p-1 text-red-600 dark:text-red-300 hover:opacity-75"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1 w-full max-w-6xl mx-auto">
        {activeTab === 'dashboard' && (
          <DashboardView
            language={language}
            shifts={shifts}
            salarySettings={salarySettings}
            documents={documents}
            dashboardConfig={dashboardConfig}
            onUpdateDashboardConfig={handleUpdateDashboardConfig}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenLogShiftModal={() => {
              setActiveTab('timecard');
              setIsLogShiftModalOpen(true);
            }}
          />
        )}

        {activeTab === 'timecard' && (
          <TimeCardView
            language={language}
            shifts={shifts}
            onSaveShift={handleSaveShift}
            onDeleteShift={handleDeleteShift}
            salarySettings={salarySettings}
            workerName={resolvedWorkerName}
            isLogModalOpen={isLogShiftModalOpen}
            setIsLogModalOpen={setIsLogShiftModalOpen}
          />
        )}

        {activeTab === 'salary' && (
          <SalaryCalculatorView
            language={language}
            salarySettings={salarySettings}
            onUpdateSalarySettings={handleUpdateSalarySettings}
            shifts={shifts}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentVaultView
            language={language}
            documents={documents}
            onSaveDocument={handleSaveDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        )}

        {activeTab === 'cv' && (
          <CVBuilderView
            language={language}
            cv={cv}
            onUpdateCV={handleUpdateCV}
            companyHistory={companyHistory}
          />
        )}

        {activeTab === 'history' && (
          <CompanyHistoryView
            language={language}
            history={companyHistory}
            onSaveHistoryItem={handleSaveHistoryItem}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onNavigateToCV={() => setActiveTab('cv')}
          />
        )}

        {activeTab === 'finance' && (
          <FinanceView
            language={language}
            transactions={finance}
            moneyAccounts={moneyAccounts}
            savingsGoal={savingsGoal}
            onSaveTransaction={handleSaveTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onSaveMoneyAccounts={handleSaveMoneyAccounts}
            onUpdateSavingsGoal={handleUpdateSavingsGoal}
          />
        )}

        {activeTab === 'reviews' && (
          <CompanyReviewsView
            language={language}
            reviews={reviews}
            deviceUser={deviceUser}
            onSubmitReview={handleSubmitReview}
            onLikeReview={handleLikeReview}
            onReportReview={handleReportReview}
            onDeleteReview={handleDeleteReview}
          />
        )}

        {activeTab === 'help' && (
          <WorkerHelpView
            language={language}
            articles={helpArticles}
            deviceUserId={deviceUser?.id}
            onPostArticle={handlePostHelpArticle}
            onLikeArticle={handleLikeHelpArticle}
            onDeleteArticle={handleDeleteHelpArticle}
          />
        )}

        {activeTab === 'translator' && <TranslatorView language={language} />}

        {activeTab === 'settings' && (
          <SettingsView
            language={language}
            deviceUser={deviceUser}
            onOpenDeviceIdModal={() => setIsDeviceIdModalOpen(true)}
            onDeleteDeviceData={handleDeleteDeviceData}
            onRefreshAllData={handleRefreshAllData}
            onImportBackupData={handleImportBackupData}
            currentAccountData={
              deviceUser
                ? {
                    shifts,
                    salarySettings,
                    documents,
                    companyHistory,
                    cv,
                    finance,
                    moneyAccounts,
                    savings: savingsGoal,
                  }
                : undefined
            }
          />
        )}
      </main>

      {/* Navigation Bars: Fixed Bottom Nav (Mobile) & Sub-Nav Header (Desktop) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        language={language}
        showMoreDrawer={showMoreDrawer}
        setShowMoreDrawer={setShowMoreDrawer}
      />

      {/* Device User ID & Cross-Device Sync Modal */}
      <DeviceIdModal
        isOpen={isDeviceIdModalOpen}
        onClose={() => setIsDeviceIdModalOpen(false)}
        language={language}
        deviceUser={deviceUser}
        isSynced={Boolean(authToken)}
        sessionError={deviceSessionError}
        onConnected={handleDeviceConnected}
        onOfflineRandomId={(newId) => {
          storageService.clearAllLocalRecords();
          storageService.saveDeviceUserId(newId);
          setAuthToken(null);
          setDeviceUser({
            id: newId,
            displayName: 'Worker',
            role: 'worker',
            createdAt: Date.now(),
          });
          loadLocalState();
        }}
        onRetryConnect={async () => {
          await ensureDeviceSession();
        }}
        onRefreshSync={async () => {
          if (authToken) {
            const res = await apiClient.getAccountData(authToken);
            applyAccountBundle(res.data);
          } else {
            await ensureDeviceSession();
          }
        }}
      />
    </div>
  );
}
