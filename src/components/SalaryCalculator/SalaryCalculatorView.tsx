import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  HelpCircle, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Info, 
  Sliders, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  FileText
} from 'lucide-react';
import { 
  SalarySettings, 
  WorkShift, 
  Language, 
  SalaryCalculationBasis 
} from '../../types';
import { getTranslation } from '../../services/i18n';
import { getMonthlySummary } from '../../services/workHoursEngine';
import { calculateMonthlySalary, STATUTORY_NOTICE } from '../../services/salaryEngine';

interface SalaryCalculatorViewProps {
  language: Language;
  salarySettings: SalarySettings;
  onUpdateSalarySettings: (settings: SalarySettings) => void;
  shifts: WorkShift[];
}

export const SalaryCalculatorView: React.FC<SalaryCalculatorViewProps> = ({
  language,
  salarySettings,
  onUpdateSalarySettings,
  shifts,
}) => {
  const t = getTranslation(language);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showFormulasModal, setShowFormulasModal] = useState(false);

  // New allowance input state
  const [newAllowanceName, setNewAllowanceName] = useState('');
  const [newAllowanceAmount, setNewAllowanceAmount] = useState('');

  // New deduction input state
  const [newDeductionName, setNewDeductionName] = useState('');
  const [newDeductionAmount, setNewDeductionAmount] = useState('');

  // Summarize the current month's shifts
  const monthSummary = useMemo(() => {
    return getMonthlySummary(shifts, selectedYear, selectedMonth);
  }, [shifts, selectedYear, selectedMonth]);

  // Compute full breakdown
  const breakdown = useMemo(() => {
    return calculateMonthlySalary(salarySettings, monthSummary);
  }, [salarySettings, monthSummary]);

  const handleBasisChange = (basis: SalaryCalculationBasis) => {
    onUpdateSalarySettings({ ...salarySettings, calculationBasis: basis });
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

  return (
    <div className="space-y-4 pb-20 max-w-5xl mx-auto px-4 pt-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calculator className="w-6 h-6 text-amber-500" />
          {t.salaryTitle}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t.salarySubtitle}
        </p>
      </div>

      {/* Prominent Statutory Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
            Singapore Ministry of Manpower (MOM) Guidance Notice:
          </span>
          {STATUTORY_NOTICE}
        </div>
      </div>

      {/* Month Selector for Time Card Integration */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">{t.month}:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            {[
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ].map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            {[2025, 2026, 2027].map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500">
          <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
            {monthSummary.totalOtHours.toFixed(1)} OT hrs
          </span> logged
        </div>
      </div>

      {/* Primary Configuration Cards */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Employment & Salary Configuration
          </h2>
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            {breakdown.hourlyRateFormula}
          </span>
        </div>

        {/* Basis Segmented Control */}
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
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${
                  salarySettings.calculationBasis === basis
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {basis === 'monthly' ? t.basisMonthly : (basis === 'daily' ? t.basisDaily : t.basisHourly)}
              </button>
            ))}
          </div>
        </div>

        {/* Basic Salary, Working Days & Normal Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {salarySettings.calculationBasis === 'monthly' ? t.basicSalaryLabel : (salarySettings.calculationBasis === 'daily' ? 'Daily Wage (SGD)' : 'Hourly Rate (SGD)')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={salarySettings.basicSalary || ''}
                onChange={(e) => onUpdateSalarySettings({ ...salarySettings, basicSalary: parseFloat(e.target.value) || 0 })}
                placeholder="Enter basic salary"
                className="w-full pl-7 pr-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.workingDaysPerWeek}
            </label>
            <select
              value={salarySettings.workingDaysPerWeek}
              onChange={(e) => onUpdateSalarySettings({ ...salarySettings, workingDaysPerWeek: parseFloat(e.target.value) })}
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
              onChange={(e) => onUpdateSalarySettings({ ...salarySettings, normalHoursPerDay: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value={8}>8 hours per day</option>
              <option value={8.8}>8.8 hours per day (5-day week)</option>
              <option value={9}>9 hours per day</option>
            </select>
          </div>
        </div>

        {/* Hourly Basic Rate Mode (when Monthly Basic is active) */}
        {salarySettings.calculationBasis === 'monthly' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hourly Basic Rate Method (for Overtime Pay)
              </label>
              <select
                value={salarySettings.hourlyRateMode || 'fixed'}
                onChange={(e) =>
                  onUpdateSalarySettings({
                    ...salarySettings,
                    hourlyRateMode: e.target.value as 'fixed' | 'mom_formula',
                  })
                }
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="fixed">Fixed Hourly Basic Rate ($2.50 / hr default)</option>
                <option value="mom_formula">MOM Formula: (12 × Monthly Basic) ÷ (52 × 44)</option>
              </select>
            </div>

            {(salarySettings.hourlyRateMode || 'fixed') === 'fixed' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.hourlyRateDisplay} (SGD / hr)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.05"
                    value={salarySettings.customHourlyBasicRate ?? 2.5}
                    onChange={(e) =>
                      onUpdateSalarySettings({
                        ...salarySettings,
                        customHourlyBasicRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-7 pr-12 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">/ hr</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* OT Multipliers Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.otMultiplierNormal}
            </label>
            <select
              value={salarySettings.otMultiplierNormal}
              onChange={(e) => onUpdateSalarySettings({ ...salarySettings, otMultiplierNormal: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value={1.5}>1.5x (Standard MOM Rate)</option>
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
              onChange={(e) => onUpdateSalarySettings({ ...salarySettings, otMultiplierSundayRest: parseFloat(e.target.value) })}
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
              onChange={(e) => onUpdateSalarySettings({ ...salarySettings, otMultiplierPublicHoliday: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value={2.0}>2.0x (+1 Day Gross Pay)</option>
              <option value={1.5}>1.5x Rate</option>
            </select>
          </div>
        </div>

        {/* Derived rates chip */}
        <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          <div>
            <span className="text-slate-500">{t.hourlyRateDisplay}:</span>
            <strong className="text-slate-900 dark:text-white ml-1.5 tabular-nums text-sm font-bold">
              ${breakdown.hourlyRate.toFixed(2)} / hr
            </strong>
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          <div>
            <span className="text-slate-500">Overtime Rate ({salarySettings.otMultiplierNormal}x):</span>
            <strong className="text-emerald-600 dark:text-emerald-400 ml-1.5 tabular-nums text-sm font-bold">
              ${(breakdown.hourlyRate * (salarySettings.otMultiplierNormal || 1.5)).toFixed(2)} / hr
            </strong>
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          <div>
            <span className="text-slate-500">{t.dailyRateDisplay}:</span>
            <strong className="text-slate-900 dark:text-white ml-1.5 tabular-nums text-sm font-bold">
              ${breakdown.dailyRate.toFixed(2)} / day
            </strong>
          </div>
        </div>

        {/* Allowances & Deductions Accordion */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
          <button
            type="button"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="flex items-center justify-between w-full text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <span>Allowances & Deductions Management ({salarySettings.allowancesList?.length || 0} allowances, {salarySettings.deductionsList?.length || 0} deductions)</span>
            {showAdvancedSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
                    <div key={a.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span>{a.name}</span>
                      <div className="flex items-center gap-2">
                        <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums font-bold">
                          +${Number(a.amount).toFixed(2)}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleRemoveAllowance(a.id)}
                          className="text-slate-400 hover:text-red-500"
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
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newAllowanceAmount}
                    onChange={(e) => setNewAllowanceAmount(e.target.value)}
                    className="w-24 px-2 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={handleAddAllowance}
                    className="p-1.5 rounded-xl bg-emerald-600 text-white shrink-0 hover:bg-emerald-700"
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
                    <div key={d.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span>{d.name}</span>
                      <div className="flex items-center gap-2">
                        <strong className="text-red-600 dark:text-red-400 tabular-nums font-bold">
                          -${Number(d.amount).toFixed(2)}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleRemoveDeduction(d.id)}
                          className="text-slate-400 hover:text-red-500"
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
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newDeductionAmount}
                    onChange={(e) => setNewDeductionAmount(e.target.value)}
                    className="w-24 px-2 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={handleAddDeduction}
                    className="p-1.5 rounded-xl bg-red-600 text-white shrink-0 hover:bg-red-700"
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
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
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

        {/* 9 Line-Item Sections as required by prompt */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* 1. Basic Salary */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">1. {t.basicPay}</span>
            <span className="font-bold tabular-nums text-slate-900 dark:text-white">
              ${breakdown.normalPayTotal.toFixed(2)}
            </span>
          </div>

          {/* 2. Normal working hours */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">2. Normal Working Hours</span>
            <span className="font-bold tabular-nums text-slate-700 dark:text-slate-300">
              {breakdown.normalHoursTotal.toFixed(1)} hrs
            </span>
          </div>

          {/* 3. Overtime Earnings */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">
              3. {t.otEarnings} ({breakdown.otHoursTotal.toFixed(1)} OT hrs)
            </span>
            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              +${breakdown.otPayTotal.toFixed(2)}
            </span>
          </div>

          {/* 4. Sunday / Rest Day Earnings */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">
              4. {t.restDayEarnings} ({breakdown.sundayRestDaysTotal} days worked)
            </span>
            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              +${breakdown.sundayRestPayTotal.toFixed(2)}
            </span>
          </div>

          {/* 5. Public Holiday Earnings */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">
              5. {t.phEarnings} ({breakdown.phDaysTotal} days worked)
            </span>
            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              +${breakdown.phPayTotal.toFixed(2)}
            </span>
          </div>

          {/* 6. Allowances */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">6. {t.totalAllowances}</span>
            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              +${breakdown.allowancesTotal.toFixed(2)}
            </span>
          </div>

          {/* 7. Deductions & Unpaid Leave */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">
              7. {t.totalDeductions} {breakdown.unpaidLeaveDaysTotal > 0 ? `(including ${breakdown.unpaidLeaveDaysTotal}d unpaid leave)` : ''}
            </span>
            <span className="font-bold tabular-nums text-red-600 dark:text-red-400">
              -${(breakdown.deductionsTotal + breakdown.unpaidLeaveDeductionTotal).toFixed(2)}
            </span>
          </div>

          {/* 8. Estimated Gross Salary */}
          <div className="py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 px-3 rounded-xl mt-2 font-bold">
            <span className="text-slate-800 dark:text-slate-200">8. {t.estimatedGross}</span>
            <span className="tabular-nums text-slate-900 dark:text-white text-sm">
              ${breakdown.estimatedGrossSalary.toFixed(2)} SGD
            </span>
          </div>

          {/* 9. Estimated Take-Home Salary */}
          <div className="py-3.5 flex items-center justify-between bg-amber-500/15 dark:bg-amber-950/40 px-4 rounded-2xl mt-2 font-bold border border-amber-300 dark:border-amber-900/60">
            <div>
              <span className="text-amber-900 dark:text-amber-200 text-sm block">
                9. {t.estimatedTakeHome}
              </span>
              <span className="text-[10px] text-amber-800 dark:text-amber-400 font-normal">
                After authorized deductions & unpaid absences
              </span>
            </div>
            <span className="tabular-nums text-slate-950 dark:text-amber-400 text-xl font-extrabold">
              ${breakdown.estimatedTakeHomeSalary.toFixed(2)} SGD
            </span>
          </div>
        </div>
      </div>

      {/* Transparent Formula Step-by-Step Modal */}
      {showFormulasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                {t.stepByStepFormula}
              </h3>
              <button
                onClick={() => setShowFormulasModal(false)}
                className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800"
              >
                {t.close}
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {breakdown.formulaSteps.map((step, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white mb-1">
                    <span>{step.label}</span>
                    <span className="tabular-nums text-amber-600 dark:text-amber-400">
                      ${Math.abs(step.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
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
