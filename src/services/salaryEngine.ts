import { SalaryBreakdown, SalarySettings, FormulaStep, MonthlySummary } from '../types';

export const STATUTORY_NOTICE =
  'Notice: These figures are user-configured estimates based on the settings and work hours provided. Under the Singapore Employment Act, exact entitlements may depend on whether you are covered under Part IV (workmen earning up to $4,500/month or non-workmen earning up to $2,600/month), your written In-Principle Approval (IPA), Key Employment Terms (KETs), and specific collective agreements. This tool is not legal advice.';

/**
 * Calculates the Hourly Basic Rate of Pay ($2.50 / hr default across all 3 sections)
 * and daily rate based on the selected calculation basis.
 */
export function calculateHourlyRate(settings: SalarySettings): {
  hourlyRate: number;
  dailyRate: number;
  weeklyHours: number;
  formulaDescription: string;
} {
  const daysPerWeek = Math.max(1, settings.workingDaysPerWeek || 6);
  const hoursPerDay = Math.max(1, settings.normalHoursPerDay || 8);
  const weeklyHours = Math.round(daysPerWeek * hoursPerDay * 10) / 10;
  const basic = Math.max(0, settings.basicSalary || 0);

  // Default Hourly Basic Rate of Pay is $2.50 / hr across all 3 sections
  const fixedHourlyRate = Math.max(0, settings.customHourlyBasicRate ?? 2.5);
  const hourlyRate = Math.round(fixedHourlyRate * 100) / 100;

  if (settings.calculationBasis === 'hourly') {
    const effectiveHourly =
      settings.customHourlyBasicRate !== undefined
        ? hourlyRate
        : basic > 0
          ? Math.round(basic * 100) / 100
          : 2.5;
    const dailyRate = Math.round(effectiveHourly * hoursPerDay * 100) / 100;
    return {
      hourlyRate: effectiveHourly,
      dailyRate,
      weeklyHours,
      formulaDescription: `Hourly Basic Rate of Pay: $${effectiveHourly.toFixed(2)} / hr`,
    };
  }

  if (settings.calculationBasis === 'daily') {
    const dailyRate =
      basic > 0
        ? Math.round(basic * 100) / 100
        : Math.round(hourlyRate * hoursPerDay * 100) / 100;
    return {
      hourlyRate,
      dailyRate,
      weeklyHours,
      formulaDescription: `Hourly Basic Rate of Pay: $${hourlyRate.toFixed(2)} / hr`,
    };
  }

  // Monthly basic salary mode (Section 1)
  const dailyRate =
    basic > 0
      ? Math.round(((12 * basic) / (52 * daysPerWeek)) * 100) / 100
      : Math.round(hourlyRate * hoursPerDay * 100) / 100;

  return {
    hourlyRate,
    dailyRate,
    weeklyHours: 44,
    formulaDescription: `Hourly Basic Rate of Pay: $${hourlyRate.toFixed(2)} / hr`,
  };
}

/**
 * Calculates complete salary breakdown for a given month and work summary.
 * Overtime pay = Hourly basic rate of pay × OT multiplier (1.5) × number of hours worked overtime.
 */
export function calculateMonthlySalary(
  settings: SalarySettings,
  summary: MonthlySummary
): SalaryBreakdown {
  const { hourlyRate, dailyRate, formulaDescription } = calculateHourlyRate(settings);
  const formulaSteps: FormulaStep[] = [];

  const basicSalary = Math.max(0, settings.basicSalary || 0);

  // 1. Basic Pay Component
  let basicPayCalculated = basicSalary;
  if (settings.calculationBasis === 'daily') {
    basicPayCalculated = Math.round(dailyRate * summary.workingDaysCount * 100) / 100;
    formulaSteps.push({
      label: 'Basic Work Pay (Daily Basis)',
      formula: `${summary.workingDaysCount} working days × $${dailyRate.toFixed(2)}/day`,
      amount: basicPayCalculated,
      explanation: 'Calculated by multiplying the number of logged normal workdays by your daily wage.',
    });
  } else if (settings.calculationBasis === 'hourly') {
    basicPayCalculated = Math.round(hourlyRate * summary.totalNormalHours * 100) / 100;
    formulaSteps.push({
      label: 'Basic Work Pay (Hourly Basis)',
      formula: `${summary.totalNormalHours.toFixed(1)} normal hours × $${hourlyRate.toFixed(2)}/hr`,
      amount: basicPayCalculated,
      explanation: `Calculated using Hourly Basic Rate of Pay ($${hourlyRate.toFixed(2)}/hr) × normal hours worked.`,
    });
  } else {
    formulaSteps.push({
      label: 'Monthly Basic Salary',
      formula: `Fixed Contract Monthly Basic: $${basicSalary.toFixed(2)}`,
      amount: basicSalary,
      explanation: formulaDescription,
    });
  }

  // 2. Overtime Pay = Hourly basic rate of pay × 1.5 × number of hours worked overtime
  const otMultiplier = Math.max(1, settings.otMultiplierNormal || 1.5);
  const otPayTotal = Math.round(hourlyRate * otMultiplier * summary.totalOtHours * 100) / 100;

  formulaSteps.push({
    label: 'Overtime (OT) Pay',
    formula: `$${hourlyRate.toFixed(2)}/hr × ${otMultiplier} × ${summary.totalOtHours.toFixed(2)} OT hrs`,
    amount: otPayTotal,
    explanation: `Overtime pay = Hourly basic rate of pay ($${hourlyRate.toFixed(2)}/hr) × ${otMultiplier} × ${summary.totalOtHours.toFixed(2)} hours worked overtime.`,
  });

  // 3. Rest Day (Sunday) Work Pay
  const sundayMultiplier = Math.max(1, settings.otMultiplierSundayRest || 2.0);
  let sundayRestPayTotal = 0;
  if (summary.restDaysWorkedCount > 0) {
    sundayRestPayTotal =
      Math.round(summary.restDaysWorkedCount * dailyRate * (sundayMultiplier / 1.5) * 100) / 100;
    formulaSteps.push({
      label: 'Rest Day (Sunday) Earnings',
      formula: `${summary.restDaysWorkedCount} rest days worked × $${(dailyRate * (sundayMultiplier / 1.5)).toFixed(2)}`,
      amount: sundayRestPayTotal,
      explanation:
        'Rest day work typically entitles you to up to 2 days basic pay or statutory OT when requested by the employer.',
    });
  }

  // 4. Public Holiday Work Pay
  let phPayTotal = 0;
  if (summary.publicHolidaysWorkedCount > 0) {
    phPayTotal = Math.round(summary.publicHolidaysWorkedCount * dailyRate * 100) / 100;
    formulaSteps.push({
      label: 'Public Holiday Work Premium',
      formula: `${summary.publicHolidaysWorkedCount} public holidays worked × extra 1 day daily pay ($${dailyRate.toFixed(2)})`,
      amount: phPayTotal,
      explanation:
        'Working on a recognized Singapore public holiday entitles an employee to an extra day’s wage or equivalent OT multiplier.',
    });
  }

  // 5. Unpaid Leave Deduction
  let unpaidLeaveDeductionTotal = 0;
  if (summary.unpaidLeaveDaysCount > 0 && settings.calculationBasis === 'monthly' && basicSalary > 0) {
    unpaidLeaveDeductionTotal = Math.round(summary.unpaidLeaveDaysCount * dailyRate * 100) / 100;
    formulaSteps.push({
      label: 'Unpaid Leave Deduction',
      formula: `${summary.unpaidLeaveDaysCount} days × daily rate ($${dailyRate.toFixed(2)})`,
      amount: -unpaidLeaveDeductionTotal,
      explanation: 'Incomplete month deduction removes the daily rate for every day of unpaid absence.',
    });
  }

  // 6. Allowances
  const allowancesTotal =
    Math.round(
      (settings.allowancesList || []).reduce((acc, item) => acc + (Number(item.amount) || 0), 0) * 100
    ) / 100;

  if (allowancesTotal > 0) {
    formulaSteps.push({
      label: 'Fixed Allowances',
      formula: (settings.allowancesList || [])
        .map((a) => `${a.name}: $${Number(a.amount).toFixed(2)}`)
        .join(' + '),
      amount: allowancesTotal,
      explanation: 'Sum of all fixed monthly allowances (e.g., food, housing, transport, attendance).',
    });
  }

  // 7. Deductions
  const deductionsTotal =
    Math.round(
      (settings.deductionsList || []).reduce((acc, item) => acc + (Number(item.amount) || 0), 0) * 100
    ) / 100;

  if (deductionsTotal > 0) {
    formulaSteps.push({
      label: 'Authorized Deductions',
      formula: (settings.deductionsList || [])
        .map((d) => `${d.name}: -$${Number(d.amount).toFixed(2)}`)
        .join(' + '),
      amount: -deductionsTotal,
      explanation: 'Authorized statutory deductions, dormitory fees, or company advances.',
    });
  }

  // 8. Totals
  const grossSalary =
    Math.round(
      (basicPayCalculated +
        otPayTotal +
        sundayRestPayTotal +
        phPayTotal +
        allowancesTotal -
        unpaidLeaveDeductionTotal) *
        100
    ) / 100;

  const takeHomeSalary = Math.max(0, Math.round((grossSalary - deductionsTotal) * 100) / 100);

  return {
    calculationBasis: settings.calculationBasis,
    basicSalary,
    hourlyRate,
    hourlyRateFormula: formulaDescription,
    dailyRate,
    normalHoursTotal: summary.totalNormalHours,
    normalPayTotal: basicPayCalculated,
    otHoursTotal: summary.totalOtHours,
    otPayTotal,
    sundayRestDaysTotal: summary.restDaysWorkedCount,
    sundayRestPayTotal,
    phDaysTotal: summary.publicHolidaysWorkedCount,
    phPayTotal,
    paidLeaveDaysTotal: summary.paidLeaveDaysCount,
    paidLeavePayTotal: 0,
    unpaidLeaveDaysTotal: summary.unpaidLeaveDaysCount,
    unpaidLeaveDeductionTotal,
    allowancesTotal,
    deductionsTotal,
    estimatedGrossSalary: grossSalary,
    estimatedTakeHomeSalary: takeHomeSalary,
    formulaSteps,
  };
}

/**
 * Default salary settings with Hourly Basic Rate of Pay: $2.50 / hr across all 3 sections.
 */
export const DEFAULT_SALARY_SETTINGS: SalarySettings = {
  calculationBasis: 'monthly',
  basicSalary: 0,
  hourlyRateMode: 'fixed',
  customHourlyBasicRate: 2.5,
  workingDaysPerWeek: 6,
  normalHoursPerDay: 8,
  otMultiplierNormal: 1.5,
  otMultiplierSundayRest: 2.0,
  otMultiplierPublicHoliday: 2.0,
  allowancesList: [],
  deductionsList: [],
  defaultCompany: 'Singapore Construction & Marine Pte Ltd',
  defaultWorksite: 'Main Project Worksite',
  defaultStartTime: '08:00',
  defaultEndTime: '17:00',
  defaultBreakMinutes: 60,
};
