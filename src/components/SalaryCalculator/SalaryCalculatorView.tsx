import React, { useState, useMemo } from 'react';
import {
  Calculator,
  HelpCircle,
  Plus,
  Trash2,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
} from 'lucide-react';
import {
  SalarySettings,
  ManualWorkSummary,
  MonthlySummary,
  Language,
  SalaryCalculationBasis,
} from '../../types';
import { getTranslation } from '../../services/i18n';
import { calculateMonthlySalary, STATUTORY_NOTICE } from '../../services/salaryEngine';

interface SalaryCalculatorViewProps {
  language: Language;
  salarySettings: SalarySettings;
  onUpdateSalarySettings: (settings: SalarySettings) => void;
  manualWorkSummary: ManualWorkSummary;
  onUpdateManualWorkSummary: (summary: ManualWorkSummary) => void;
}

export const SalaryCalculatorView: React.FC<SalaryCalculatorViewProps> = ({
  language,
  salarySettings,
  onUpdateSalarySettings,
  manualWorkSummary,
  onUpdateManualWorkSummary,
}) => {
  const t = getTranslation(language);

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showFormulasModal, setShowFormulasModal] = useState(false);

  const [newAllowanceName, setNewAllowanceName] = useState('');
  const [newAllowanceAmount, setNewAllowanceAmount] = useState('');

  const [newDeductionName, setNewDeductionName] = useState('');
  const [newDeductionAmount, setNewDeductionAmount] = useState('');

  const monthSummary = useMemo<MonthlySummary>(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
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
  }, [manualWorkSummary]);

  const breakdown = useMemo(() => {
    return calculateMonthlySalary(salarySettings, monthSummary);
  }, [salarySettings, monthSummary]);

  const handleBasisChange = (basis: SalaryCalculationBasis) => {
    onUpdateSalarySettings({
      ...salarySettings,
      calculationBasis: basis,
      hourlyRateMode: 'fixed',
      customHourlyBasicRate: salarySettings.customHourlyBasicRate ?? 2.5,
    });
  };

  const handleAddAllowance = () => {
    if (!newAllowanceName.trim() || !newAllowanceAmount) return;
    const item = {
      id: `al-${Date.now()}`,
      name: newAllowanceName.trim(),
      amount: parseFloat(newAllowanceAmount) || 0,
    };
    onUpdateSalarySettings({
      ...salarySettings,
      allowancesList: [...(salarySettings.allowancesList || []), item],
    });
    setNewAllowanceName('');
    setNewAllowanceAmount('');
  };

  const handleRemoveAllowance = (id: string) => {
    onUpdateSalarySettings({
      ...salarySettings,
      allowancesList: (salarySettings.allowancesList || []).filter((a) => a.id !== id),
    });
  };

  const handleAddDeduction = () => {
    if (!newDeductionName.trim() || !newDeductionAmount) return;
    const item = {
      id: `de-${Date.now()}`,
      name: newDeductionName.trim(),
      amount: parseFloat(newDeductionAmount) || 0,
    };
    onUpdateSalarySettings({
      ...salarySettings,
      deductionsList: [...(salarySettings.deductionsList || []), item],
    });
    setNewDeductionName('');
    setNewDeductionAmount('');
  };

  const handleRemoveDeduction = (id: string) => {
    onUpdateSalarySettings({
      ...salarySettings,
      deductionsList: (salarySettings.deductionsList || []).filter((d) => d.id !== id),
    });
  };

  const hourlyBasicRate = salarySettings.customHourlyBasicRate ?? 2.5;

  return (
    <div className="space-y-4 pb-24 max-w-5xl mx-auto px-3 sm:px-4 pt-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calculator className="w-6 h-6 text-amber-500 shrink-0" />
          <span>{t.salaryTitle}</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t.salarySubtitle}
        </p>
      </div>

      {/* Prominent Statutory Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
            Singapore Ministry of Manpower (MOM) Guidance Notice:
          </span>
          {STATUTORY_NOTICE}
        </div>
      </div>

      {/* Direct Work Hours & Days Input Card (Standalone Offline) */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Work Hours & Days Input
          </h2>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {manualWorkSummary.totalOtHours.toFixed(1)} OT hrs
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Working Days
            </label>
            <input
              type="number"
              min="0"
              max="31"
              step="1"
              value={manualWorkSummary.workingDaysCount}
              onChange={(e) =>
                onUpdateManualWorkSummary({
                  ...manualWorkSummary,
                  workingDaysCount: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className="w-full px-2.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Normal Hours
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={manualWorkSummary.totalNormalHours}
              onChange={(e) =>
                onUpdateManualWorkSummary({
                  ...manualWorkSummary,
                  totalNormalHours: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className="w-full px-2.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
              OT Hours
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={manualWorkSummary.totalOtHours}
              onChange={(e) =>
                onUpdateManualWorkSummary({
                  ...manualWorkSummary,
                  totalOtHours: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className="w-full px-2.5 py-2 text-xs font-bold rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white tabular-nums"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Rest Days Worked
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="1"
              value={manualWorkSummary.restDaysWorkedCount}
              onChange={(e) =>
                onUpdateManualWorkSummary({
                  ...manualWorkSummary,
                  restDaysWorkedCount: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className="w-full px-2.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Public Holidays
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="1"
              value={manualWorkSummary.publicHolidaysWorkedCount}
              onChange={(e) =>
                onUpdateManualWorkSummary({
                  ...manualWorkSummary,
                  publicHolidaysWorkedCount: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className="w-full px-2.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Unpaid Leave Days
            </label>
            <input
              type="number"
              min="0"
              max="31"
              step="0.5"
              value={manualWorkSummary.unpaidLeaveDaysCount}
              onChange={(e) =>
                onUpdateManualWorkSummary({
                  ...manualWorkSummary,
                  unpaidLeaveDaysCount: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className="w-full px-2.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums"
            />
          </div>
        </div>
      </div>

      {/* Primary Configuration Cards */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Employment & Salary Configuration
          </h2>
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            {breakdown.hourlyRateFormula}
          </span>
        </div>

        {/* 3 Calculation Basis Sections */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t.calculationBasis}
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(['monthly', 'daily', 'hourly'] as const).map((basis) => (
              <button
                key={basis}
                type="button"
                onClick={() => handleBasisChange(basis)}
                className={`py-2 px-1 text-[11px] sm:text-xs font-semibold rounded-lg transition-all capitalize ${
                  salarySettings.calculationBasis === basis
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {basis === 'monthly'
                  ? t.basisMonthly
                  : basis === 'daily'
                    ? t.basisDaily
                    : t.basisHourly}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs Row: Basic Salary / Daily Wage / Hourly Basic Rate + Working Days + Normal Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {salarySettings.calculationBasis !== 'hourly' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {salarySettings.calculationBasis === 'monthly'
                  ? t.basicSalaryLabel
                  : 'Daily Wage (SGD)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={salarySettings.basicSalary || ''}
                  onChange={(e) =>
                    onUpdateSalarySettings({
                      ...salarySettings,
                      basicSalary: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder={
                    salarySettings.calculationBasis === 'monthly'
                      ? 'Enter monthly basic'
                      : 'Enter daily wage'
                  }
                  className="w-full pl-7 pr-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Hourly Basic Rate of Pay ($2.50 / hr default) shown in ALL 3 sections */}
          <div className={salarySettings.calculationBasis === 'hourly' ? 'sm:col-span-2 lg:col-span-2' : ''}>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hourly Basic Rate of Pay (SGD / hr)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">$</span>
              <input
                type="number"
                min="0"
                step="0.05"
                value={hourlyBasicRate}
                onChange={(e) =>
                  onUpdateSalarySettings({
                    ...salarySettings,
                    hourlyRateMode: 'fixed',
                    customHourlyBasicRate: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full pl-7 pr-12 py-2 text-xs font-bold rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-slate-900 dark:text-white"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-500">/ hr</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.workingDaysPerWeek}
            </label>
            <select
              value={salarySettings.workingDaysPerWeek}
              onChange={(e) =>
                onUpdateSalarySettings({
                  ...salarySettings,
                  workingDaysPerWeek: parseFloat(e.target.value),
                })
              }
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value={6}>6 days / week</option>
              <option value={5.5}>5.5 days / week (Alternate Sat)</option>
              <option value={5}>5 days / week (Monday - Friday)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.normalHoursPerDay}
            </label>
            <select
              value={salarySettings.normalHoursPerDay}
              onChange={(e) =>
                onUpdateSalarySettings({
                  ...salarySettings,
                  normalHoursPerDay: parseFloat(e.target.value),
                })
              }
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value={8}>8 hours per day</option>
              <option value={8.8}>8.8 hours per day (5-day week)</option>
              <option value={9}>9 hours per day</option>
            </select>
          </div>
        </div>

        {/* OT Multipliers Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.otMultiplierNormal}
            </label>
            <select
              value={salarySettings.otMultiplierNormal}
              onChange={(e) =>
                onUpdateSalarySettings({
                  ...salarySettings,
                  otMultiplierNormal: parseFloat(e.target.value),
                })
              }
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value={1.5}>1.5x (Standard Rate)</option>
              <option value={2.0}>2.0x (Double Time)</option>
              <option value={1.0}>1.0x (Flat Rate)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.otMultiplierSunday}
            </label>
            <select
              value={salarySettings.otMultiplierSundayRest}
              onChange={(e) =>
                onUpdateSalarySettings({
                  ...salarySettings,
                  otMultiplierSundayRest: parseFloat(e.target.value),
                })
              }
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value={2.0}>2.0x / 2 Full Days Pay</option>
              <option value={1.5}>1.5x Hourly Rate</option>
              <option value={1.0}>1.0x Normal Pay</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.otMultiplierPH}
            </label>
            <select
              value={salarySettings.otMultiplierPublicHoliday}
              onChange={(e) =>
                onUpdateSalarySettings({
                  ...salarySettings,
                  otMultiplierPublicHoliday: parseFloat(e.target.value),
                })
              }
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value={2.0}>2.0x (+1 Day Gross Pay)</option>
              <option value={1.5}>1.5x Rate</option>
            </select>
          </div>
        </div>

        {/* Derived rates chip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-slate-500">{t.hourlyRateDisplay}:</span>
            <strong className="text-slate-900 dark:text-white tabular-nums text-sm font-bold">
              ${breakdown.hourlyRate.toFixed(2)} / hr
            </strong>
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-slate-500">Overtime Rate ({salarySettings.otMultiplierNormal}x):</span>
            <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums text-sm font-bold">
              ${(breakdown.hourlyRate * (salarySettings.otMultiplierNormal || 1.5)).toFixed(2)} / hr
            </strong>
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-slate-500">{t.dailyRateDisplay}:</span>
            <strong className="text-slate-900 dark:text-white tabular-nums text-sm font-bold">
              ${breakdown.dailyRate.toFixed(2)} / day
            </strong>
          </div>
        </div>

        {/* Allowances & Deductions Accordion */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
          <button
            type="button"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="flex items-center justify-between w-full text-xs font-bold text-slate-700 dark:text-slate-200 gap-2 text-left"
          >
            <span>
              Allowances & Deductions Management ({salarySettings.allowancesList?.length || 0} allowances,{' '}
              {salarySettings.deductionsList?.length || 0} deductions)
            </span>
            {showAdvancedSettings ? (
              <ChevronUp className="w-4 h-4 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 shrink-0" />
            )}
          </button>

          {showAdvancedSettings && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Allowances List */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {t.allowancesSection}
                </span>

                <div className="space-y-1.5">
                  {(salarySettings.allowancesList || []).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 gap-2"
                    >
                      <span className="truncate">{a.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums font-bold">
                          +${Number(a.amount).toFixed(2)}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleRemoveAllowance(a.id)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="e.g. Food Allowance"
                    value={newAllowanceName}
                    onChange={(e) => setNewAllowanceName(e.target.value)}
                    className="flex-1 min-w-0 px-2.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                  <input
                    type="number"
                    placeholder="Amt"
                    value={newAllowanceAmount}
                    onChange={(e) => setNewAllowanceAmount(e.target.value)}
                    className="w-20 px-2 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={handleAddAllowance}
                    className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Deductions List */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {t.deductionsSection}
                </span>

                <div className="space-y-1.5">
                  {(salarySettings.deductionsList || []).map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 gap-2"
                    >
                      <span className="truncate">{d.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <strong className="text-red-600 dark:text-red-400 tabular-nums font-bold">
                          -${Number(d.amount).toFixed(2)}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleRemoveDeduction(d.id)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="e.g. Dorm Utility"
                    value={newDeductionName}
                    onChange={(e) => setNewDeductionName(e.target.value)}
                    className="flex-1 min-w-0 px-2.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                  <input
                    type="number"
                    placeholder="Amt"
                    value={newDeductionAmount}
                    onChange={(e) => setNewDeductionAmount(e.target.value)}
                    className="w-20 px-2 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={handleAddDeduction}
                    className="p-2 rounded-xl bg-red-600 text-white shrink-0 hover:bg-red-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Salary Calculation Breakdown Summary Card */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t.salaryBreakdown}
          </h2>
          <button
            onClick={() => setShowFormulasModal(true)}
            className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t.stepByStepFormula}</span>
          </button>
        </div>

        {/* 9 Line-Item Sections */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="py-2.5 flex items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-400">1. {t.basicPay}</span>
            <span className="font-bold tabular-nums text-slate-900 dark:text-white shrink-0">
              ${breakdown.normalPayTotal.toFixed(2)}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-400">2. Normal Working Hours</span>
            <span className="font-bold tabular-nums text-slate-700 dark:text-slate-300 shrink-0">
              {breakdown.normalHoursTotal.toFixed(1)} hrs
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-400">
              3. {t.otEarnings} ({breakdown.otHoursTotal.toFixed(1)} hrs × ${breakdown.hourlyRate.toFixed(2)} × {salarySettings.otMultiplierNormal}x)
            </span>
            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
              +${breakdown.otPayTotal.toFixed(2)}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-400">
              4. {t.restDayEarnings} ({breakdown.sundayRestDaysTotal} days)
            </span>
            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
              +${breakdown.sundayRestPayTotal.toFixed(2)}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-400">
              5. {t.phEarnings} ({breakdown.phDaysTotal} days)
            </span>
            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
              +${breakdown.phPayTotal.toFixed(2)}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-400">6. {t.totalAllowances}</span>
            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
              +${breakdown.allowancesTotal.toFixed(2)}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-400">
              7. {t.totalDeductions}{' '}
              {breakdown.unpaidLeaveDaysTotal > 0
                ? `(including ${breakdown.unpaidLeaveDaysTotal}d unpaid leave)`
                : ''}
            </span>
            <span className="font-bold tabular-nums text-red-600 dark:text-red-400 shrink-0">
              -${(breakdown.deductionsTotal + breakdown.unpaidLeaveDeductionTotal).toFixed(2)}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/40 px-3 rounded-xl mt-2 font-bold">
            <span className="text-slate-800 dark:text-slate-200">8. {t.estimatedGross}</span>
            <span className="tabular-nums text-slate-900 dark:text-white text-sm shrink-0">
              ${breakdown.estimatedGrossSalary.toFixed(2)} SGD
            </span>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-3 bg-amber-500/15 dark:bg-amber-950/40 px-3.5 sm:px-4 rounded-2xl mt-2 font-bold border border-amber-300 dark:border-amber-900/60">
            <div>
              <span className="text-amber-900 dark:text-amber-200 text-xs sm:text-sm block">
                9. {t.estimatedTakeHome}
              </span>
              <span className="text-[10px] text-amber-800 dark:text-amber-400 font-normal">
                After authorized deductions & unpaid absences
              </span>
            </div>
            <span className="tabular-nums text-slate-950 dark:text-amber-400 text-lg sm:text-xl font-extrabold shrink-0">
              ${breakdown.estimatedTakeHomeSalary.toFixed(2)} SGD
            </span>
          </div>
        </div>
      </div>

      {/* Transparent Formula Step-by-Step Modal */}
      {showFormulasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                {t.stepByStepFormula}
              </h3>
              <button
                onClick={() => setShowFormulasModal(false)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800"
              >
                {t.close}
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {breakdown.formulaSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white mb-1 gap-2">
                    <span>{step.label}</span>
                    <span className="tabular-nums text-amber-600 dark:text-amber-400 shrink-0">
                      ${Math.abs(step.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 break-words">
                    {step.formula}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    {step.explanation}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              * Entitlements must be matched against your In-Principle Approval (IPA) document submitted to MOM.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
