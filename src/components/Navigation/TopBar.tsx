import React from 'react';
import { Shield, Globe, Moon, Sun, UserCheck, UserPlus, WifiOff, CheckCircle2 } from 'lucide-react';
import { AuthUser, Language } from '../../types';
import { getTranslation } from '../../services/i18n';

interface TopBarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  isOnline: boolean;
  authUser: AuthUser | null;
  onOpenAccountModal: () => void;
  onOpenSettings: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  language,
  onLanguageChange,
  theme,
  onThemeToggle,
  isOnline,
  authUser,
  onOpenAccountModal,
  onOpenSettings,
}) => {
  const t = getTranslation(language);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-sm">
            <Shield className="w-4 h-4 text-slate-950 fill-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none whitespace-nowrap">
              WorkerHub
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold tracking-wider uppercase mt-0.5">
              Singapore
            </span>
          </div>
        </div>

        {/* Zone 2: Sync / Storage Status */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          {!isOnline ? (
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Mode</span>
            </span>
          ) : authUser ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Synced · {authUser.email}</span>
            </span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">
              {language === 'bn' ? 'লোকাল মোড (অ্যাকাউন্টে সেভ করুন)' : 'Local Storage Mode'}
            </span>
          )}
        </div>

        {/* Zone 3: Interactive Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {authUser ? (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 transition-colors whitespace-nowrap"
              title={t.navSettings}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="max-w-[110px] truncate">{authUser.fullName}</span>
            </button>
          ) : (
            <button
              onClick={onOpenAccountModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors whitespace-nowrap shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'অ্যাকাউন্ট খুলুন' : 'Open Account'}</span>
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => onLanguageChange(language === 'en' ? 'bn' : 'en')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
