import React, { useState, useEffect } from 'react';
import { storageService } from './services/storageService';
import {
  SalarySettings,
  ManualWorkSummary,
  CompanyHistoryItem,
  SingaporeCV,
  CompanyReview,
  DashboardCardConfig,
  HelpArticle,
  Language,
} from './types';
import { TopBar } from './components/Navigation/TopBar';
import { BottomNav, ActiveTab } from './components/Navigation/BottomNav';
import { DashboardView } from './components/Dashboard/DashboardView';
import { SalaryCalculatorView } from './components/SalaryCalculator/SalaryCalculatorView';
import { CVBuilderView } from './components/CVBuilder/CVBuilderView';
import { CompanyHistoryView } from './components/CompanyHistory/CompanyHistoryView';
import { CompanyReviewsView } from './components/CompanyReviews/CompanyReviewsView';
import { WorkerHelpView } from './components/WorkerHelp/WorkerHelpView';
import { TranslatorView } from './components/Translator/TranslatorView';

export default function App() {
  const [language, setLanguage] = useState<Language>(() => storageService.getLanguage());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => storageService.getTheme());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);

  const [salarySettings, setSalarySettings] = useState<SalarySettings>(() =>
    storageService.getSalarySettings()
  );
  const [manualWorkSummary, setManualWorkSummary] = useState<ManualWorkSummary>(() =>
    storageService.getManualWorkSummary()
  );
  const [companyHistory, setCompanyHistory] = useState<CompanyHistoryItem[]>(() =>
    storageService.getCompanyHistory()
  );
  const [cv, setCv] = useState<SingaporeCV>(() => storageService.getCV());
  const [dashboardConfig, setDashboardConfig] = useState<DashboardCardConfig>(() =>
    storageService.getDashboardConfig()
  );
  const [reviews, setReviews] = useState<CompanyReview[]>(() => storageService.getReviews());
  const [helpArticles, setHelpArticles] = useState<HelpArticle[]>(() =>
    storageService.getHelpArticles()
  );

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

  const handleUpdateSalarySettings = (settings: SalarySettings) => {
    setSalarySettings(settings);
    storageService.saveSalarySettings(settings);
  };

  const handleUpdateManualWorkSummary = (summary: ManualWorkSummary) => {
    setManualWorkSummary(summary);
    storageService.saveManualWorkSummary(summary);
  };

  const handleSaveHistoryItem = (item: CompanyHistoryItem) => {
    const updated = [item, ...companyHistory.filter((h) => h.id !== item.id)];
    setCompanyHistory(updated);
    storageService.saveCompanyHistory(updated);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = companyHistory.filter((h) => h.id !== id);
    setCompanyHistory(updated);
    storageService.saveCompanyHistory(updated);
  };

  const handleUpdateCV = (updatedCv: SingaporeCV) => {
    setCv(updatedCv);
    storageService.saveCV(updatedCv);
  };

  const handleSubmitReview = (
    review: Omit<CompanyReview, 'id' | 'status' | 'createdAt' | 'likesCount' | 'likedByMe' | 'userId' | 'isOwn'>
  ) => {
    const entry: CompanyReview = {
      ...review,
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      status: 'approved',
      likesCount: 0,
      likedByMe: false,
      isOwn: true,
      createdAt: Date.now(),
    };
    const next = [entry, ...reviews];
    setReviews(next);
    storageService.saveReviews(next);
  };

  const handleLikeReview = (id: string) => {
    const next = reviews.map((r) => {
      if (r.id !== id) return r;
      const liked = !r.likedByMe;
      return {
        ...r,
        likedByMe: liked,
        likesCount: Math.max(0, (r.likesCount || 0) + (liked ? 1 : -1)),
      };
    });
    setReviews(next);
    storageService.saveReviews(next);
  };

  const handleDeleteReview = (id: string) => {
    const next = reviews.filter((r) => r.id !== id);
    setReviews(next);
    storageService.saveReviews(next);
  };

  const handlePostHelpArticle = (article: {
    title: string;
    category: HelpArticle['category'];
    summary: string;
    content: string;
    language: Language;
    sourceUrl?: string;
  }) => {
    const entry: HelpArticle = {
      id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: article.title,
      category: article.category,
      summary: article.summary,
      content: article.content,
      language: article.language,
      authorLabel: 'Worker Note',
      sourceUrl: article.sourceUrl,
      likesCount: 0,
      likedByMe: false,
      isOwner: true,
      createdAt: Date.now(),
    };
    const next = [entry, ...helpArticles];
    setHelpArticles(next);
    storageService.saveHelpArticles(next);
  };

  const handleLikeHelpArticle = (id: string) => {
    const next = helpArticles.map((a) => {
      if (a.id !== id) return a;
      const liked = !a.likedByMe;
      return {
        ...a,
        likedByMe: liked,
        likesCount: Math.max(0, (a.likesCount || 0) + (liked ? 1 : -1)),
      };
    });
    setHelpArticles(next);
    storageService.saveHelpArticles(next);
  };

  const handleDeleteHelpArticle = (id: string) => {
    const next = helpArticles.filter((a) => a.id !== id);
    setHelpArticles(next);
    storageService.saveHelpArticles(next);
  };

  const handleUpdateDashboardConfig = (cfg: DashboardCardConfig) => {
    setDashboardConfig(cfg);
    storageService.saveDashboardConfig(cfg);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors overflow-x-hidden">
      <TopBar
        language={language}
        onLanguageChange={handleLanguageChange}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto">
        {activeTab === 'dashboard' && (
          <DashboardView
            language={language}
            salarySettings={salarySettings}
            manualWorkSummary={manualWorkSummary}
            dashboardConfig={dashboardConfig}
            onUpdateDashboardConfig={handleUpdateDashboardConfig}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'salary' && (
          <SalaryCalculatorView
            language={language}
            salarySettings={salarySettings}
            onUpdateSalarySettings={handleUpdateSalarySettings}
            manualWorkSummary={manualWorkSummary}
            onUpdateManualWorkSummary={handleUpdateManualWorkSummary}
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

        {activeTab === 'reviews' && (
          <CompanyReviewsView
            language={language}
            reviews={reviews}
            onSubmitReview={handleSubmitReview}
            onLikeReview={handleLikeReview}
            onDeleteReview={handleDeleteReview}
          />
        )}

        {activeTab === 'help' && (
          <WorkerHelpView
            language={language}
            articles={helpArticles}
            onPostArticle={handlePostHelpArticle}
            onLikeArticle={handleLikeHelpArticle}
            onDeleteArticle={handleDeleteHelpArticle}
          />
        )}

        {activeTab === 'translator' && <TranslatorView language={language} />}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        language={language}
        showMoreDrawer={showMoreDrawer}
        setShowMoreDrawer={setShowMoreDrawer}
      />
    </div>
  );
}
