import React from 'react';
import { Shield, Globe, Moon, Sun, UserCheck, HardDrive } from 'lucide-react';
import { Language, UserAccount } from '../../types';

interface TopBarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  currentUser: UserAccount | null;
  onOpenAccountModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  language,
  onLanguageChange,
  theme,
  onThemeToggle,
  currentUser,
  onOpenAccountModal,
}) => {
  return (
    <header className="no-print sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-sm shrink-0">
            <Shield className="w-4 h-4 text-slate-950 fill-slate-950" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none whitespace-nowrap">
              WorkerHub
            </span>
            <span className="text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-400 font-semibold tracking-wider uppercase mt-0.5">
              Singapore · Offline
            </span>
          </div>
        </div>

        {/* Zone 2: Offline Vault Status */}
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <HardDrive className="w-3.5 h-3.5" />
            <span>
              {currentUser
                ? `Offline Vault · ${currentUser.email}`
                : 'Offline Mode · Guest Profile'}
            </span>
          </span>
        </div>

        {/* Zone 3: Interactive Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onOpenAccountModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors whitespace-nowrap shadow-sm max-w-[160px] sm:max-w-[220px]"
            title="Switch or Manage Email Account"
          >
            <UserCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {currentUser ? currentUser.fullName.split(' ')[0] : 'Account / Login'}
            </span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => onLanguageChange(language === 'en' ? 'bn' : 'en')}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
