import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Briefcase, 
  DollarSign, 
  AlertTriangle, 
  PlusCircle, 
  ChevronRight, 
  FileCheck, 
  PhoneCall, 
  ShieldAlert,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { 
  Language, 
  WorkShift, 
  SalarySettings, 
  DocumentItem, 
  DashboardCardConfig 
} from '../../types';
import { getTranslation } from '../../services/i18n';
import { getMonthlySummary } from '../../services/workHoursEngine';
import { calculateMonthlySalary } from '../../services/salaryEngine';
import { ActiveTab } from '../Navigation/BottomNav';

interface DashboardViewProps {
  language: Language;
  shifts: WorkShift[];
  salarySettings: SalarySettings;
  documents: DocumentItem[];
  dashboardConfig: DashboardCardConfig;
  onUpdateDashboardConfig: (cfg: DashboardCardConfig) => void;
  onNavigate: (tab: ActiveTab) => void;
  onOpenLogShiftModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  language,
  shifts,
  salarySettings,
  documents,
  dashboardConfig,
  onUpdateDashboardConfig,
  onNavigate,
  onOpenLogShiftModal,
}) => {
  const t = getTranslation(language);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Format today's date
  const todayFormatted = now.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-SG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate monthly metrics
  const monthSummary = getMonthlySummary(shifts, currentYear, currentMonth);
  const hasBasicSalary = (salarySettings.basicSalary || 0) > 0;
  const salaryBreakdown = calculateMonthlySalary(salarySettings, monthSummary);

  // Check upcoming document expiries within 30 days
  const upcomingExpiries = documents.filter((doc) => {
    if (!doc.expiryDate) return false;
    const expDate = new Date(doc.expiryDate);
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30; // within 30 days or expired
  }).map((doc) => {
    const expDate = new Date(doc.expiryDate!);
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      ...doc,
      diffDays,
      isExpired: diffDays < 0,
    };
  });

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

      {/* Expiry Alerts Card (if any documents are expiring soon) */}
      {dashboardConfig.showExpiryAlerts && upcomingExpiries.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{t.upcomingExpiries}</span>
            </div>
            <button
              onClick={() => onNavigate('documents')}
              className="text-xs font-semibold text-amber-800 dark:text-amber-200 hover:underline flex items-center gap-0.5"
            >
              <span>{t.navDocuments}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {upcomingExpiries.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between text-xs bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{doc.name}</div>
                  <div className="text-slate-500 text-[11px]">
                    {t.expiryDate}: {doc.expiryDate}
                  </div>
                </div>
                <div className="text-right">
                  {doc.isExpired ? (
                    <span className="text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/60">
                      {t.expired} ({Math.abs(doc.diffDays)}d ago)
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-100/70 dark:bg-amber-900/40">
                      {doc.diffDays} {t.daysRemaining}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Summary Statistics Grid */}
      {dashboardConfig.showMonthStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Working Days */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">{t.workingDays}</span>
              <Briefcase className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {monthSummary.workingDaysCount}
              </span>
              <span className="text-xs text-slate-500 ml-1">/ 31</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {monthSummary.restDaysWorkedCount > 0 ? `+${monthSummary.restDaysWorkedCount} Rest Days Worked` : 'This month'}
            </div>
          </div>

          {/* Normal Hours */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">{t.normalHours}</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {monthSummary.totalNormalHours.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 ml-1">hrs</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Standard contract hours
            </div>
          </div>

          {/* Overtime Hours */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">{t.otHours}</span>
              <Clock className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {monthSummary.totalOtHours.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 ml-1">hrs</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Multiplier: {salarySettings.otMultiplierNormal}x basic
            </div>
          </div>

          {/* Estimated Monthly Salary */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">{t.estimatedSalary}</span>
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-3">
              {hasBasicSalary ? (
                <>
                  <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                    ${salaryBreakdown.estimatedTakeHomeSalary.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">SGD</span>
                </>
              ) : (
                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Configure Basic Pay
                </div>
              )}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {hasBasicSalary ? `Gross: $${salaryBreakdown.estimatedGrossSalary.toFixed(2)}` : 'Tap to set basic salary'}
            </div>
          </div>
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
              onClick={onOpenLogShiftModal}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-transform active:scale-[0.98] shadow-sm text-left"
            >
              <div className="p-2 rounded-xl bg-slate-950/15">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm leading-tight">
                {t.logTodayShift}
              </div>
            </button>

            <button
              onClick={() => onNavigate('salary')}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold transition-all text-left shadow-sm"
            >
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
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
                { key: 'showMonthStats', label: 'Monthly Summary Cards (Days, Normal Hrs, OT)' },
                { key: 'showExpiryAlerts', label: 'Document Expiry Alerts (30 Days)' },
                { key: 'showQuickActions', label: 'Quick Action Shortcuts' },
                { key: 'showEmergencyHelp', label: 'MOM Helpline & Emergency Banner' },
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
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
