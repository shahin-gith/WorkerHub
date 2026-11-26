import React from 'react';
import {
  LayoutDashboard,
  Calculator,
  MoreHorizontal,
  FileCheck,
  History,
  Star,
  LifeBuoy,
  Languages,
  Sparkles,
} from 'lucide-react';
import { Language } from '../../types';
import { getTranslation } from '../../services/i18n';

export type ActiveTab =
  | 'dashboard'
  | 'salary'
  | 'cv'
  | 'history'
  | 'reviews'
  | 'help'
  | 'translator';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  language: Language;
  showMoreDrawer: boolean;
  setShowMoreDrawer: (open: boolean) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  language,
  showMoreDrawer,
  setShowMoreDrawer,
}) => {
  const t = getTranslation(language);

  const mainTabs = [
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'salary', label: t.navSalary, icon: Calculator },
    { id: 'cv', label: t.navCV, icon: FileCheck },
    { id: 'help', label: t.navHelp, icon: LifeBuoy },
  ] as const;

  const moreItems = [
    { id: 'history', label: t.navHistory, icon: History, desc: 'Track past Singapore employers' },
    { id: 'reviews', label: t.navReviews, icon: Star, desc: 'Singapore company directory & worker reviews' },
    { id: 'translator', label: t.navTranslator, icon: Languages, desc: 'Worksite phrases & pronunciation' },
  ] as const;

  const isMoreActive = moreItems.some((item) => item.id === activeTab);

  return (
    <>
      {/* More Drawer Modal for Mobile */}
      {showMoreDrawer && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setShowMoreDrawer(false)}
        >
          <div
            className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-t-3xl p-5 shadow-2xl border-t border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {t.navMore}
              </h3>
              <button
                onClick={() => setShowMoreDrawer(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded"
              >
                {t.close}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setShowMoreDrawer(false);
                    }}
                    className={`w-full flex items-center gap-3.5 p-3 rounded-xl text-left transition-all ${
                      active
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        active
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{item.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar (Mobile) */}
      <nav
        aria-label="Mobile Navigation"
        className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe shadow-lg"
      >
        <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-1">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  setShowMoreDrawer(false);
                }}
                className="flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-all active:scale-95"
              >
                <div
                  className={`p-1 rounded-md transition-colors ${
                    active ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] tracking-tight mt-0.5 truncate max-w-[64px] ${
                    active ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setShowMoreDrawer(!showMoreDrawer)}
            className="flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-all active:scale-95"
          >
            <div
              className={`p-1 rounded-md transition-colors ${
                isMoreActive || showMoreDrawer
                  ? 'text-amber-600 dark:text-amber-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span
              className={`text-[10px] tracking-tight mt-0.5 truncate max-w-[64px] ${
                isMoreActive ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'
              }`}
            >
              {t.navMore}
            </span>
          </button>
        </div>
      </nav>

      {/* Desktop Top Sub-Nav Ribbon */}
      <div className="no-print hidden md:block bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto py-2">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

          {moreItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
