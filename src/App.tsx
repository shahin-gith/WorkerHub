import React, { useState, useEffect, useCallback } from 'react';
import {
  storageService,
  DEFAULT_DASHBOARD_CONFIG,
  DEFAULT_SAVINGS_GOAL,
  EMPTY_CV,
} from './services/storageService';
import { DEFAULT_SALARY_SETTINGS } from './services/salaryEngine';
import { apiClient, AccountDataBundle, AuthResponse } from './services/apiClient';
import {
  AuthUser,
  WorkShift,
  SalarySettings,
  DocumentItem,
  CompanyHistoryItem,
  SingaporeCV,
  CompanyReview,
  FinanceTransaction,
  SavingsGoal,
  DashboardCardConfig,
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
import { AccountModal } from './components/Auth/AccountModal';
import { PWAInstallPrompt, OfflineStatusBanner } from './components/PWA/PWAComponents';
import { AlertCircle, CloudUpload, X } from 'lucide-react';

export default function App() {
  // App-level UI state
  const [language, setLanguage] = useState<Language>(() => storageService.getLanguage());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => storageService.getTheme());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  const [isLogShiftModalOpen, setIsLogShiftModalOpen] = useState(false);

  // Authenticated user & session token (kept strictly in JS memory, never localStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'register' | 'login'>('register');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showLocalImportPrompt, setShowLocalImportPrompt] = useState(false);
  const [importingLocal, setImportingLocal] = useState(false);

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

  // Data collections state
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
  const [finance, setFinance] = useState<FinanceTransaction[]>(() => storageService.getFinance());
  const [savingsGoal, setSavingsGoal] = useState<SavingsGoal>(() => storageService.getSavings());
  const [dashboardConfig, setDashboardConfig] = useState<DashboardCardConfig>(() =>
    storageService.getDashboardConfig()
  );

  // Apply server account data bundle into state
  const applyAccountBundle = useCallback(
    (bundle: AccountDataBundle, user: AuthUser) => {
      setShifts(bundle.shifts || []);
      setDocuments(bundle.documents || []);
      setCompanyHistory(bundle.companyHistory || []);
      setFinance(bundle.finance || []);
      setSalarySettings(
        bundle.salarySettings
          ? { ...DEFAULT_SALARY_SETTINGS, ...bundle.salarySettings }
          : { ...DEFAULT_SALARY_SETTINGS }
      );
      setCv(
        bundle.cv
          ? { ...EMPTY_CV, ...bundle.cv }
          : { ...EMPTY_CV, fullName: user.fullName, email: user.email }
      );
      setSavingsGoal(
        bundle.savingsGoal
          ? { ...DEFAULT_SAVINGS_GOAL, ...bundle.savingsGoal }
          : { ...DEFAULT_SAVINGS_GOAL }
      );
      setDashboardConfig(
        bundle.dashboardConfig
          ? { ...DEFAULT_DASHBOARD_CONFIG, ...bundle.dashboardConfig }
          : { ...DEFAULT_DASHBOARD_CONFIG }
      );
    },
    []
  );

  // Reload local browser state (when logged out or local data refreshed)
  const loadLocalState = useCallback(() => {
    setShifts(storageService.getShifts());
    setSalarySettings(storageService.getSalarySettings());
    setDocuments(storageService.getDocuments());
    setCompanyHistory(storageService.getCompanyHistory());
    setCv(storageService.getCV());
    setFinance(storageService.getFinance());
    setSavingsGoal(storageService.getSavings());
    setDashboardConfig(storageService.getDashboardConfig());
  }, []);

  // Load community reviews from server
  const fetchReviews = useCallback(async (token: string | null) => {
    try {
      const res = await apiClient.getReviews(token);
      setReviews(res.reviews);
    } catch {
      // Fall back to empty array if offline; reviews require server connection
    }
  }, []);

  useEffect(() => {
    fetchReviews(authToken);
  }, [authToken, fetchReviews]);

  const handleApiError = (err: unknown) => {
    const error = err as Error & { status?: number };
    if (error.status === 401) {
      setAuthToken(null);
      setAuthUser(null);
      loadLocalState();
      setSyncError('Your session expired. Please sign in again to sync with your account.');
      setAuthModalMode('login');
      setIsAccountModalOpen(true);
    } else {
      setSyncError(error.message || 'Failed to save changes to your account.');
    }
  };

  // Auth Handlers
  const handleAuthSuccess = (res: AuthResponse) => {
    setSyncError(null);
    setAuthToken(res.token);
    setAuthUser(res.user);
    applyAccountBundle(res.data, res.user);
    if (storageService.hasLocalRecords()) {
      setShowLocalImportPrompt(true);
    }
  };

  const handleImportLocalToAccount = async () => {
    if (!authToken || !authUser) return;
    setImportingLocal(true);
    setSyncError(null);
    try {
      const res = await apiClient.importLocalData(authToken, {
        shifts: storageService.getShifts(),
        documents: storageService.getDocuments(),
        companyHistory: storageService.getCompanyHistory(),
        finance: storageService.getFinance(),
        salarySettings: storageService.getSalarySettings(),
        cv: storageService.getCV(),
        savingsGoal: storageService.getSavings(),
        dashboardConfig: storageService.getDashboardConfig(),
      });
      applyAccountBundle(res.data, authUser);
      storageService.clearAllLocalRecords();
      setShowLocalImportPrompt(false);
    } catch (err) {
      handleApiError(err);
    } finally {
      setImportingLocal(false);
    }
  };

  const handleLogout = async () => {
    if (authToken) {
      await apiClient.logout(authToken).catch(() => undefined);
    }
    setAuthToken(null);
    setAuthUser(null);
    setShowLocalImportPrompt(false);
    setSyncError(null);
    loadLocalState();
  };

  const handleDeleteAccount = async () => {
    if (!authToken) return;
    try {
      await apiClient.deleteAccount(authToken);
      setAuthToken(null);
      setAuthUser(null);
      setShowLocalImportPrompt(false);
      setSyncError(null);
      loadLocalState();
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
    savings?: SavingsGoal;
  }) => {
    if (!authToken || !authUser) return;
    const res = await apiClient.importLocalData(authToken, {
      shifts: Array.isArray(data.shifts) ? data.shifts : [],
      salarySettings: data.salarySettings || null,
      documents: Array.isArray(data.documents) ? data.documents : [],
      companyHistory: Array.isArray(data.companyHistory) ? data.companyHistory : [],
      cv: data.cv || null,
      finance: Array.isArray(data.finance) ? data.finance : [],
      savingsGoal: data.savings || null,
    });
    applyAccountBundle(res.data, authUser);
  };

  // Refresh data handler (used in SettingsView local mode)
  const handleRefreshAllData = () => {
    if (authToken && authUser) {
      apiClient
        .getAccountData(authToken)
        .then((res) => applyAccountBundle(res.data, authUser))
        .catch(handleApiError);
    } else {
      loadLocalState();
    }
  };

  // Shift Handlers
  const handleSaveShift = (shift: WorkShift) => {
    const updated = [shift, ...shifts.filter((s) => s.id !== shift.id)];
    setShifts(updated);
    if (authToken) {
      apiClient.saveShift(authToken, shift).catch(handleApiError);
    } else {
      storageService.saveShifts(updated);
    }
  };

  const handleDeleteShift = (id: string) => {
    const updated = shifts.filter((s) => s.id !== id);
    setShifts(updated);
    if (authToken) {
      apiClient.deleteShift(authToken, id).catch(handleApiError);
    } else {
      storageService.saveShifts(updated);
    }
  };

  // Salary Settings Handler
  const handleUpdateSalarySettings = (settings: SalarySettings) => {
    setSalarySettings(settings);
    if (authToken) {
      apiClient.saveSalarySettings(authToken, settings).catch(handleApiError);
    } else {
      storageService.saveSalarySettings(settings);
    }
  };

  // Document Handlers
  const handleSaveDocument = (doc: DocumentItem) => {
    const updated = [doc, ...documents.filter((d) => d.id !== doc.id)];
    setDocuments(updated);
    if (authToken) {
      apiClient.saveDocument(authToken, doc).catch(handleApiError);
    } else {
      storageService.saveDocuments(updated);
    }
  };

  const handleDeleteDocument = (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    setDocuments(updated);
    if (authToken) {
      apiClient.deleteDocument(authToken, id).catch(handleApiError);
    } else {
      storageService.saveDocuments(updated);
    }
  };

  // Company History Handlers
  const handleSaveHistoryItem = (item: CompanyHistoryItem) => {
    const updated = [item, ...companyHistory.filter((h) => h.id !== item.id)];
    setCompanyHistory(updated);
    if (authToken) {
      apiClient.saveHistoryItem(authToken, item).catch(handleApiError);
    } else {
      storageService.saveCompanyHistory(updated);
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = companyHistory.filter((h) => h.id !== id);
    setCompanyHistory(updated);
    if (authToken) {
      apiClient.deleteHistoryItem(authToken, id).catch(handleApiError);
    } else {
      storageService.saveCompanyHistory(updated);
    }
  };

  // CV Handler
  const handleUpdateCV = (updatedCv: SingaporeCV) => {
    setCv(updatedCv);
    if (authToken) {
      apiClient.saveCV(authToken, updatedCv).catch(handleApiError);
    } else {
      storageService.saveCV(updatedCv);
    }
  };

  // Review Handlers (Server-moderated)
  const handleSubmitReview = async (
    review: Omit<CompanyReview, 'id' | 'status' | 'createdAt'>
  ) => {
    if (!authToken) {
      setAuthModalMode('register');
      setIsAccountModalOpen(true);
      return;
    }
    await apiClient.submitReview(authToken, review);
    await fetchReviews(authToken);
  };

  const handleModerateReview = async (id: string, status: 'approved' | 'flagged') => {
    if (!authToken) return;
    await apiClient.moderateReview(authToken, id, status);
    await fetchReviews(authToken);
  };

  const handleReportReview = async (id: string) => {
    if (!authToken) {
      setAuthModalMode('login');
      setIsAccountModalOpen(true);
      return;
    }
    await apiClient.reportReview(authToken, id);
    await fetchReviews(authToken);
  };

  const handleDeleteReview = async (id: string) => {
    if (!authToken) return;
    await apiClient.deleteReview(authToken, id);
    await fetchReviews(authToken);
  };

  // Finance Handlers
  const handleSaveTransaction = (tx: FinanceTransaction) => {
    const updated = [tx, ...finance.filter((f) => f.id !== tx.id)];
    setFinance(updated);
    if (authToken) {
      apiClient.saveFinance(authToken, tx).catch(handleApiError);
    } else {
      storageService.saveFinance(updated);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = finance.filter((f) => f.id !== id);
    setFinance(updated);
    if (authToken) {
      apiClient.deleteFinance(authToken, id).catch(handleApiError);
    } else {
      storageService.saveFinance(updated);
    }
  };

  const handleUpdateSavingsGoal = (goal: SavingsGoal) => {
    setSavingsGoal(goal);
    if (authToken) {
      apiClient.saveSavingsGoal(authToken, goal).catch(handleApiError);
    } else {
      storageService.saveSavings(goal);
    }
  };

  // Dashboard Config Handler
  const handleUpdateDashboardConfig = (cfg: DashboardCardConfig) => {
    setDashboardConfig(cfg);
    if (authToken) {
      apiClient.saveDashboardConfig(authToken, cfg).catch(handleApiError);
    } else {
      storageService.saveDashboardConfig(cfg);
    }
  };

  const openAccountModal = (mode: 'register' | 'login' = 'register') => {
    setAuthModalMode(mode);
    setIsAccountModalOpen(true);
  };

  const resolvedWorkerName = cv.fullName || authUser?.fullName || 'Worker';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* PWA Install Banner */}
      <PWAInstallPrompt />

      {/* Top Bar */}
      <TopBar
        language={language}
        onLanguageChange={handleLanguageChange}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        isOnline={isOnline}
        authUser={authUser}
        onOpenAccountModal={() => openAccountModal('register')}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Offline Status Floating Toast */}
      <OfflineStatusBanner isOnline={isOnline} />

      {/* Sync Error Notice */}
      {syncError && (
        <div className="max-w-5xl w-full mx-auto px-4 pt-3">
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
            savingsGoal={savingsGoal}
            onSaveTransaction={handleSaveTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateSavingsGoal={handleUpdateSavingsGoal}
          />
        )}

        {activeTab === 'reviews' && (
          <CompanyReviewsView
            language={language}
            reviews={reviews}
            authUser={authUser}
            onOpenAccountModal={() => openAccountModal('login')}
            onSubmitReview={handleSubmitReview}
            onModerateReview={handleModerateReview}
            onReportReview={handleReportReview}
            onDeleteReview={handleDeleteReview}
          />
        )}

        {activeTab === 'help' && <WorkerHelpView language={language} />}

        {activeTab === 'translator' && <TranslatorView language={language} />}

        {activeTab === 'settings' && (
          <SettingsView
            language={language}
            authUser={authUser}
            onOpenAccountModal={() => openAccountModal('register')}
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
            onRefreshAllData={handleRefreshAllData}
            onImportBackupData={handleImportBackupData}
            currentAccountData={
              authUser
                ? {
                    shifts,
                    salarySettings,
                    documents,
                    companyHistory,
                    cv,
                    finance,
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

      {/* Open Account / Sign In / Email OTP Verification Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        language={language}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Explicit Local-to-Account Import Prompt Modal */}
      {showLocalImportPrompt && authUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                <CloudUpload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Import Local Browser Records?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Signed in as {authUser.email}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This device has saved shifts, documents, or profile records from local mode. Would you like to import and save them into your verified WorkerHub account?
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={handleImportLocalToAccount}
                disabled={importingLocal}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-sm transition-colors"
              >
                {importingLocal ? 'Importing...' : 'Import & Save to Account'}
              </button>
              <button
                onClick={() => setShowLocalImportPrompt(false)}
                disabled={importingLocal}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Use Account Data Only
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
