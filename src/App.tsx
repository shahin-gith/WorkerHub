import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  storageService,
  DEFAULT_DASHBOARD_CONFIG,
  DEFAULT_SAVINGS_GOAL,
  DEFAULT_MONEY_ACCOUNTS,
  PREFILLED_CV,
} from './services/storageService';
import { DEFAULT_SALARY_SETTINGS } from './services/salaryEngine';
import {
  offlineAccountService,
  AccountDataBundle,
} from './services/offlineAccountService';
import {
  UserAccount,
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
import { AccountModal } from './components/Auth/AccountModal';
import { CheckCircle2, X } from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>(() => storageService.getLanguage());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => storageService.getTheme());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  const [isLogShiftModalOpen, setIsLogShiftModalOpen] = useState(false);

  // Offline Email Account state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<UserAccount[]>([]);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToast, setAccountToast] = useState<string | null>(null);
  const [workspaceReady, setWorkspaceReady] = useState(false);

  // Active workspace data state
  const [shifts, setShifts] = useState<WorkShift[]>(() => storageService.getShifts());
  const [salarySettings, setSalarySettings] = useState<SalarySettings>(() =>
    storageService.getSalarySettings()
  );
  const [documents, setDocuments] = useState<DocumentItem[]>(() => storageService.getDocuments());
  const [companyHistory, setCompanyHistory] = useState<CompanyHistoryItem[]>(() =>
    storageService.getCompanyHistory()
  );
  const [cv, setCv] = useState<SingaporeCV>(() => storageService.getCV());
  const [finance, setFinance] = useState<FinanceTransaction[]>(() => storageService.getFinance());
  const [moneyAccounts, setMoneyAccounts] = useState<MoneyAccount[]>(() =>
    storageService.getMoneyAccounts()
  );
  const [savingsGoal, setSavingsGoal] = useState<SavingsGoal>(() => storageService.getSavings());
  const [dashboardConfig, setDashboardConfig] = useState<DashboardCardConfig>(() =>
    storageService.getDashboardConfig()
  );

  // Offline Community Reviews & Help Articles
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [helpArticles, setHelpArticles] = useState<HelpArticle[]>([]);

  // Ref always pointing to latest active workspace ID & bundle so switching never loses data
  const activeActorId = currentUser ? currentUser.id : 'guest';
  const activeActorIdRef = useRef(activeActorId);
  activeActorIdRef.current = activeActorId;

  const currentBundleRef = useRef<AccountDataBundle>({
    shifts,
    documents,
    companyHistory,
    finance,
    salarySettings,
    cv,
    savingsGoal,
    moneyAccounts,
    dashboardConfig,
  });
  currentBundleRef.current = {
    shifts,
    documents,
    companyHistory,
    finance,
    salarySettings,
    cv,
    savingsGoal,
    moneyAccounts,
    dashboardConfig,
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    storageService.saveTheme(theme);
  }, [theme]);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    storageService.saveLanguage(lang);
  };

  const applyWorkspaceBundle = useCallback((bundle: AccountDataBundle) => {
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
  }, []);

  const refreshCommunityFeeds = useCallback(async (actorId: string) => {
    const [revList, artList] = await Promise.all([
      offlineAccountService.getReviews(actorId),
      offlineAccountService.getHelpArticles(actorId),
    ]);
    setReviews(revList);
    setHelpArticles(artList);
  }, []);

  // Load saved offline session on app boot
  useEffect(() => {
    let mounted = true;
    offlineAccountService
      .initializeSession()
      .then(async (session) => {
        if (!mounted) return;
        setCurrentUser(session.currentUser);
        setSavedAccounts(session.accounts);
        applyWorkspaceBundle(session.data);
        const actor = session.currentUser ? session.currentUser.id : 'guest';
        await refreshCommunityFeeds(actor);
        if (mounted) setWorkspaceReady(true);
      })
      .catch(() => {
        if (mounted) setWorkspaceReady(true);
      });
    return () => {
      mounted = false;
    };
  }, [applyWorkspaceBundle, refreshCommunityFeeds]);

  // Persist active workspace automatically whenever data changes after initial boot
  const persistWorkspace = useCallback((nextBundle: AccountDataBundle) => {
    const actor = activeActorIdRef.current;
    offlineAccountService.saveWorkspace(actor, nextBundle);
    if (actor === 'guest') {
      storageService.saveShifts(nextBundle.shifts);
      storageService.saveDocuments(nextBundle.documents);
      storageService.saveCompanyHistory(nextBundle.companyHistory);
      storageService.saveFinance(nextBundle.finance);
      storageService.saveSalarySettings(nextBundle.salarySettings);
      storageService.saveCV(nextBundle.cv);
      storageService.saveSavings(nextBundle.savingsGoal);
      storageService.saveMoneyAccounts(nextBundle.moneyAccounts);
      storageService.saveDashboardConfig(nextBundle.dashboardConfig);
    }
  }, []);

  const showToast = (msg: string) => {
    setAccountToast(msg);
    setTimeout(() => {
      setAccountToast((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Account Handlers (100% offline, instant switch guaranteed)
  const flushCurrentBeforeSwitch = async () => {
    if (!workspaceReady) return;
    await offlineAccountService.saveWorkspace(
      activeActorIdRef.current,
      currentBundleRef.current
    );
  };

  const handleCreateAccount = async (params: {
    email: string;
    fullName: string;
    password: string;
    copyGuestData: boolean;
  }) => {
    await flushCurrentBeforeSwitch();
    const res = await offlineAccountService.createAccount(params);
    setCurrentUser(res.user);
    setSavedAccounts(res.accounts);
    applyWorkspaceBundle(res.data);
    await refreshCommunityFeeds(res.user.id);
    showToast(`Account created & active: ${res.user.email}`);
  };

  const handleLoginAccount = async (params: { email: string; password: string }) => {
    await flushCurrentBeforeSwitch();
    const res = await offlineAccountService.loginAccount(params);
    setCurrentUser(res.user);
    setSavedAccounts(res.accounts);
    applyWorkspaceBundle(res.data);
    await refreshCommunityFeeds(res.user.id);
    showToast(`Signed in to ${res.user.email}`);
  };

  const handleSwitchAccount = async (accountId: string) => {
    if (currentUser?.id === accountId) return;
    await flushCurrentBeforeSwitch();
    const res = await offlineAccountService.switchAccount(accountId);
    setCurrentUser(res.user);
    setSavedAccounts(res.accounts);
    applyWorkspaceBundle(res.data);
    await refreshCommunityFeeds(res.user.id);
    showToast(`Switched account to ${res.user.fullName} (${res.user.email})`);
  };

  const handleSwitchToGuest = async () => {
    await flushCurrentBeforeSwitch();
    const res = await offlineAccountService.switchToGuestMode();
    setCurrentUser(null);
    setSavedAccounts(res.accounts);
    applyWorkspaceBundle(res.data);
    await refreshCommunityFeeds('guest');
    showToast('Switched to Offline Guest workspace');
  };

  const handleDeleteCurrentAccount = async () => {
    if (!currentUser) return;
    const deletedEmail = currentUser.email;
    const res = await offlineAccountService.deleteAccount(currentUser.id);
    setCurrentUser(null);
    setSavedAccounts(res.accounts);
    applyWorkspaceBundle(res.data);
    await refreshCommunityFeeds('guest');
    showToast(`Deleted account ${deletedEmail}`);
  };

  const handleClearCurrentWorkspace = async () => {
    const emptyBundle: AccountDataBundle = {
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
    applyWorkspaceBundle(emptyBundle);
    await offlineAccountService.saveWorkspace(activeActorId, emptyBundle);
    if (activeActorId === 'guest') {
      storageService.clearAllLocalRecords();
    }
    showToast('Cleared current workspace records');
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
    const nextBundle: AccountDataBundle = {
      shifts: Array.isArray(data.shifts) ? data.shifts : shifts,
      documents: Array.isArray(data.documents) ? data.documents : documents,
      companyHistory: Array.isArray(data.companyHistory)
        ? data.companyHistory
        : companyHistory,
      finance: Array.isArray(data.finance) ? data.finance : finance,
      salarySettings: data.salarySettings
        ? { ...DEFAULT_SALARY_SETTINGS, ...data.salarySettings }
        : salarySettings,
      cv: data.cv ? { ...PREFILLED_CV, ...data.cv } : cv,
      savingsGoal: data.savings
        ? { ...DEFAULT_SAVINGS_GOAL, ...data.savings }
        : savingsGoal,
      moneyAccounts:
        Array.isArray(data.moneyAccounts) && data.moneyAccounts.length > 0
          ? data.moneyAccounts
          : moneyAccounts,
      dashboardConfig,
    };
    applyWorkspaceBundle(nextBundle);
    await offlineAccountService.saveWorkspace(activeActorId, nextBundle);
  };

  // Shift Handlers
  const handleSaveShift = (shift: WorkShift) => {
    const updated = [shift, ...shifts.filter((s) => s.id !== shift.id)];
    setShifts(updated);
    persistWorkspace({ ...currentBundleRef.current, shifts: updated });
  };

  const handleDeleteShift = (id: string) => {
    const updated = shifts.filter((s) => s.id !== id);
    setShifts(updated);
    persistWorkspace({ ...currentBundleRef.current, shifts: updated });
  };

  // Salary Settings Handler
  const handleUpdateSalarySettings = (settings: SalarySettings) => {
    setSalarySettings(settings);
    persistWorkspace({ ...currentBundleRef.current, salarySettings: settings });
  };

  // Document Handlers
  const handleSaveDocument = (doc: DocumentItem) => {
    const updated = [doc, ...documents.filter((d) => d.id !== doc.id)];
    setDocuments(updated);
    persistWorkspace({ ...currentBundleRef.current, documents: updated });
  };

  const handleDeleteDocument = (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    setDocuments(updated);
    persistWorkspace({ ...currentBundleRef.current, documents: updated });
  };

  // Company History Handlers
  const handleSaveHistoryItem = (item: CompanyHistoryItem) => {
    const updated = [item, ...companyHistory.filter((h) => h.id !== item.id)];
    setCompanyHistory(updated);
    persistWorkspace({ ...currentBundleRef.current, companyHistory: updated });
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = companyHistory.filter((h) => h.id !== id);
    setCompanyHistory(updated);
    persistWorkspace({ ...currentBundleRef.current, companyHistory: updated });
  };

  // CV Handler
  const handleUpdateCV = (updatedCv: SingaporeCV) => {
    setCv(updatedCv);
    persistWorkspace({ ...currentBundleRef.current, cv: updatedCv });
  };

  // Offline Reviews Handlers
  const handleSubmitReview = async (
    review: Omit<CompanyReview, 'id' | 'status' | 'createdAt' | 'likesCount' | 'likedByMe' | 'userId'>
  ) => {
    const next = await offlineAccountService.addReview(activeActorId, review);
    setReviews(next);
  };

  const handleLikeReview = async (id: string) => {
    const next = await offlineAccountService.toggleReviewLike(activeActorId, id);
    setReviews(next);
  };

  const handleDeleteReview = async (id: string) => {
    const next = await offlineAccountService.deleteReview(activeActorId, id);
    setReviews(next);
  };

  // Offline Help Articles Handlers
  const handlePostHelpArticle = async (article: {
    title: string;
    category: HelpArticle['category'];
    summary: string;
    content: string;
    language: Language;
    sourceUrl?: string;
  }) => {
    const label = currentUser ? currentUser.fullName : 'Worker Note';
    const next = await offlineAccountService.addHelpArticle(activeActorId, label, article);
    setHelpArticles(next);
  };

  const handleLikeHelpArticle = async (id: string) => {
    const next = await offlineAccountService.toggleHelpLike(activeActorId, id);
    setHelpArticles(next);
  };

  const handleDeleteHelpArticle = async (id: string) => {
    const next = await offlineAccountService.deleteHelpArticle(activeActorId, id);
    setHelpArticles(next);
  };

  // Finance Handlers
  const handleSaveTransaction = (tx: FinanceTransaction) => {
    const updated = [tx, ...finance.filter((f) => f.id !== tx.id)];
    setFinance(updated);
    persistWorkspace({ ...currentBundleRef.current, finance: updated });
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = finance.filter((f) => f.id !== id);
    setFinance(updated);
    persistWorkspace({ ...currentBundleRef.current, finance: updated });
  };

  const handleSaveMoneyAccounts = (accounts: MoneyAccount[]) => {
    setMoneyAccounts(accounts);
    persistWorkspace({ ...currentBundleRef.current, moneyAccounts: accounts });
  };

  const handleUpdateSavingsGoal = (goal: SavingsGoal) => {
    setSavingsGoal(goal);
    persistWorkspace({ ...currentBundleRef.current, savingsGoal: goal });
  };

  // Dashboard Config Handler
  const handleUpdateDashboardConfig = (cfg: DashboardCardConfig) => {
    setDashboardConfig(cfg);
    persistWorkspace({ ...currentBundleRef.current, dashboardConfig: cfg });
  };

  const resolvedWorkerName = cv.fullName || currentUser?.fullName || 'Worker';
  const hasGuestRecords =
    !currentUser &&
    (shifts.length > 0 ||
      documents.length > 0 ||
      companyHistory.length > 0 ||
      finance.length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors overflow-x-hidden">
      {/* Top Bar */}
      <TopBar
        language={language}
        onLanguageChange={handleLanguageChange}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        currentUser={currentUser}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
      />

      {/* Account Switch Confirmation Toast */}
      {accountToast && (
        <div className="no-print max-w-5xl w-full mx-auto px-3 sm:px-4 pt-3">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{accountToast}</span>
            </div>
            <button
              onClick={() => setAccountToast(null)}
              className="p-1 text-emerald-700 dark:text-emerald-300 hover:opacity-75"
              aria-label="Dismiss notice"
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
            currentUser={currentUser}
            actorId={activeActorId}
            onSubmitReview={handleSubmitReview}
            onLikeReview={handleLikeReview}
            onDeleteReview={handleDeleteReview}
          />
        )}

        {activeTab === 'help' && (
          <WorkerHelpView
            language={language}
            articles={helpArticles}
            actorId={activeActorId}
            onPostArticle={handlePostHelpArticle}
            onLikeArticle={handleLikeHelpArticle}
            onDeleteArticle={handleDeleteHelpArticle}
          />
        )}

        {activeTab === 'translator' && <TranslatorView language={language} />}

        {activeTab === 'settings' && (
          <SettingsView
            language={language}
            currentUser={currentUser}
            savedAccounts={savedAccounts}
            onOpenAccountModal={() => setIsAccountModalOpen(true)}
            onSwitchAccount={handleSwitchAccount}
            onDeleteCurrentAccount={handleDeleteCurrentAccount}
            onClearCurrentWorkspace={handleClearCurrentWorkspace}
            onImportBackupData={handleImportBackupData}
            currentAccountData={{
              shifts,
              salarySettings,
              documents,
              companyHistory,
              cv,
              finance,
              moneyAccounts,
              savings: savingsGoal,
            }}
          />
        )}
      </main>

      {/* Navigation Bars */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        language={language}
        showMoreDrawer={showMoreDrawer}
        setShowMoreDrawer={setShowMoreDrawer}
      />

      {/* Offline Email Accounts Create / Login / Switcher Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        language={language}
        currentUser={currentUser}
        savedAccounts={savedAccounts}
        hasGuestRecords={hasGuestRecords}
        onCreateAccount={handleCreateAccount}
        onLoginAccount={handleLoginAccount}
        onSwitchAccount={handleSwitchAccount}
        onSwitchToGuest={handleSwitchToGuest}
      />
    </div>
  );
}
