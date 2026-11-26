import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Briefcase,
  DollarSign,
  FileCheck,
  PhoneCall,
  ShieldAlert,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import {
  Language,
  SalarySettings,
  ManualWorkSummary,
  DashboardCardConfig,
  MonthlySummary,
} from '../../types';
import { getTranslation } from '../../services/i18n';
import { calculateMonthlySalary } from '../../services/salaryEngine';
import { ActiveTab } from '../Navigation/BottomNav';

interface DashboardViewProps {
  language: Language;
  salarySettings: SalarySettings;
  manualWorkSummary: ManualWorkSummary;
  dashboardConfig: DashboardCardConfig;
  onUpdateDashboardConfig: (cfg: DashboardCardConfig) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  language,
  salarySettings,
  manualWorkSummary,
  dashboardConfig,
  onUpdateDashboardConfig,
  onNavigate,
}) => {
  const t = getTranslation(language);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const todayFormatted = now.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-SG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const monthSummary: MonthlySummary = {
    year: currentYear,
    month: currentMonth,
    totalShiftsCount: 0,
    workingDaysCount: manualWorkSummary.workingDaysCount,
    restDaysWorkedCount: manualWorkSummary.restDaysWorkedCount,
    publicHolidaysWorkedCount: manualWorkSummary.publicHolidaysWorkedCount,
    mcDaysCount: 0,
    paidLeaveDaysCount: 0,
    unpaidLeaveDaysCount: manualWorkSummary.unpaidLeaveDaysCount,
    totalNormalHours: manualWorkSummary.totalNormalHours,
    totalOtHours: manualWorkSummary.totalOtHours,
    totalWorkingHours: manualWorkSummary.totalNormalHours + manualWorkSummary.totalOtHours,
    shifts: [],
  };

  const salaryBreakdown = calculateMonthlySalary(salarySettings, monthSummary);
  const hasPayInput =
    (salarySettings.basicSalary || 0) > 0 ||
    salarySettings.calculationBasis === 'hourly';

  return (
    <div className="space-y-4 pb-24 max-w-5xl mx-auto px-3 sm:px-4 pt-4">
      {/* Header bar with customize action */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>{todayFormatted}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            {language === 'bn' ? 'স্বাগতম, প্রবাসী ভাই' : 'Welcome to WorkerHub'}
          </h1>
        </div>

        <button
          onClick={() => setShowConfigModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={t.customizeDashboard}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">{t.customizeDashboard}</span>
        </button>
      </div>

      {/* Salary & Work Estimate Summary Grid */}
      {dashboardConfig.showSalaryEstimate && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onNavigate('salary')}
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-left hover:border-amber-400 transition-colors"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">{t.workingDays}</span>
              <Briefcase className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {manualWorkSummary.workingDaysCount}
              </span>
              <span className="text-xs text-slate-500 ml-1">days</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Tap to adjust in Calculator
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('salary')}
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-left hover:border-amber-400 transition-colors"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">{t.normalHours}</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {manualWorkSummary.totalNormalHours.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 ml-1">hrs</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Standard work hours
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('salary')}
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-left hover:border-amber-400 transition-colors"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">{t.otHours}</span>
              <Clock className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {manualWorkSummary.totalOtHours.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 ml-1">hrs</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {salarySettings.otMultiplierNormal}x @ ${salaryBreakdown.hourlyRate.toFixed(2)}/hr
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('salary')}
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-left hover:border-amber-400 transition-colors"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">{t.estimatedSalary}</span>
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-3">
              {hasPayInput ? (
                <>
                  <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                    ${salaryBreakdown.estimatedTakeHomeSalary.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">SGD</span>
                </>
              ) : (
                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Set Basic Pay
                </div>
              )}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {hasPayInput
                ? `Gross: $${salaryBreakdown.estimatedGrossSalary.toFixed(2)}`
                : 'Tap to calculate salary'}
            </div>
          </button>
        </div>
      )}

      {/* Quick Action Grid */}
      {dashboardConfig.showQuickActions && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 px-1">
            {t.quickActions}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => onNavigate('salary')}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-transform active:scale-[0.98] shadow-sm text-left"
            >
              <div className="p-2 rounded-xl bg-slate-950/15">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm leading-tight">
                {t.calculateSalary}
              </div>
            </button>

            <button
              onClick={() => onNavigate('cv')}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold transition-all text-left shadow-sm"
            >
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm leading-tight">
                {t.createCV}
              </div>
            </button>

            <button
              onClick={() => onNavigate('reviews')}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold transition-all text-left shadow-sm"
            >
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Star className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm leading-tight">
                {t.navReviews}
              </div>
            </button>

            <button
              onClick={() => onNavigate('help')}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold transition-all text-left shadow-sm"
            >
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm leading-tight">
                {t.viewEmergency}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Emergency & MOM Banner */}
      {dashboardConfig.showEmergencyHelp && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white dark:bg-slate-800 border border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-sm">MOM Helpline: 6438 5122 · SCDF: 995</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'বকেয়া বেতন, কাজের নিরাপত্তা বা জরুরি বিপদে বিনা খরচে সাহায্য নিন।'
                  : 'Official assistance for salary disputes, workplace safety, or injury claims.'}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('help')}
            className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold shrink-0 hover:bg-slate-100 transition-colors"
          >
            {t.navHelp}
          </button>
        </div>
      )}

      {/* Dashboard Customization Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.customizeDashboard}
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { key: 'showSalaryEstimate', label: 'Salary & Work Estimate Cards' },
                { key: 'showQuickActions', label: 'Quick Action Shortcuts' },
                { key: 'showEmergencyHelp', label: 'MOM Helpline & Emergency Banner' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer"
                >
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {item.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={!!dashboardConfig[item.key as keyof DashboardCardConfig]}
                    onChange={(e) => {
                      onUpdateDashboardConfig({
                        ...dashboardConfig,
                        [item.key]: e.target.checked,
                      });
                    }}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                  />
                </label>
              ))}
            </div>

            <div className="mt-5">
              <button
                onClick={() => setShowConfigModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
