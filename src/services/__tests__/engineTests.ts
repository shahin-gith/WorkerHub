import { calculateShiftHours, getMonthlySummary, timeStringToMinutes } from '../workHoursEngine';
import { calculateHourlyRate, calculateMonthlySalary, DEFAULT_SALARY_SETTINGS } from '../salaryEngine';
import { WorkShift, SalarySettings } from '../../types';

export interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export function runAllEngineTests(): {
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
} {
  const results: TestResult[] = [];

  function assert(name: string, condition: boolean, expected: string, actual: string, details?: string) {
    results.push({
      name,
      passed: condition,
      expected,
      actual,
      details,
    });
  }

  // Test 1: Normal standard day shift (08:00 to 17:00, 60m break, 8h normal)
  {
    const res = calculateShiftHours('08:00', '17:00', 60, 8, 'normal');
    assert(
      'Standard 8-hour day shift with 60m break',
      res.isValid && res.totalHours === 8 && res.normalHours === 8 && res.otHours === 0 && !res.isOvernight,
      'total: 8h, normal: 8h, ot: 0h, overnight: false',
      `total: ${res.totalHours}h, normal: ${res.normalHours}h, ot: ${res.otHours}h, overnight: ${res.isOvernight}`
    );
  }

  // Test 2: Shift with Overtime (08:00 to 21:00, 60m break, 8h normal + 4h OT)
  {
    const res = calculateShiftHours('08:00', '21:00', 60, 8, 'normal');
    assert(
      'Shift with 4 hours Overtime (08:00 - 21:00 with 60m break)',
      res.isValid && res.totalHours === 12 && res.normalHours === 8 && res.otHours === 4,
      'total: 12h, normal: 8h, ot: 4h',
      `total: ${res.totalHours}h, normal: ${res.normalHours}h, ot: ${res.otHours}h`
    );
  }

  // Test 3: Overnight shift crossing midnight (22:00 to 07:00, 60m break)
  {
    const res = calculateShiftHours('22:00', '07:00', 60, 8, 'normal');
    assert(
      'Overnight shift crossing midnight (22:00 to 07:00 next day)',
      res.isValid && res.isOvernight && res.totalHours === 8 && res.normalHours === 8 && res.otHours === 0,
      'total: 8h, overnight: true',
      `total: ${res.totalHours}h, overnight: ${res.isOvernight}`
    );
  }

  // Test 4: Overnight shift with OT (20:00 to 08:00, 60m break = 11h total = 8h normal + 3h OT)
  {
    const res = calculateShiftHours('20:00', '08:00', 60, 8, 'normal');
    assert(
      'Long overnight shift with OT (20:00 to 08:00)',
      res.isValid && res.isOvernight && res.totalHours === 11 && res.normalHours === 8 && res.otHours === 3,
      'total: 11h, normal: 8h, ot: 3h, overnight: true',
      `total: ${res.totalHours}h, normal: ${res.normalHours}h, ot: ${res.otHours}h, overnight: ${res.isOvernight}`
    );
  }

  // Test 5: Break duration deduction validation
  {
    // Break exceeds shift duration (08:00 to 10:00 = 120m, break = 180m)
    const res = calculateShiftHours('08:00', '10:00', 180, 8, 'normal');
    assert(
      'Invalid break duration exceeding shift duration',
      !res.isValid && res.totalHours === 0,
      'isValid: false',
      `isValid: ${res.isValid}, error: ${res.errorMessage}`
    );
  }

  // Test 6: Missing inputs handling
  {
    const res = calculateShiftHours('', '', 60, 8, 'normal');
    assert(
      'Missing start/end time handling',
      !res.isValid && res.totalHours === 0,
      'isValid: false',
      `isValid: ${res.isValid}`
    );
  }

  // Test 7: Leave status zero-hour calculation
  {
    const res = calculateShiftHours('08:00', '17:00', 60, 8, 'medical_leave');
    assert(
      'Medical leave status returns zero work hours',
      res.isValid && res.totalHours === 0 && res.normalHours === 0 && res.otHours === 0,
      'total: 0h, normal: 0h, ot: 0h',
      `total: ${res.totalHours}h, normal: ${res.normalHours}h`
    );
  }

  // Test 8: Default Hourly Basic Rate of Pay = $2.50 / hr across all 3 sections (Monthly, Daily, Hourly)
  {
    const monthlySettings: SalarySettings = {
      ...DEFAULT_SALARY_SETTINGS,
      basicSalary: 600,
      calculationBasis: 'monthly',
    };
    const dailySettings: SalarySettings = {
      ...DEFAULT_SALARY_SETTINGS,
      basicSalary: 45,
      normalHoursPerDay: 9,
      calculationBasis: 'daily',
    };
    const hourlySettings: SalarySettings = {
      ...DEFAULT_SALARY_SETTINGS,
      calculationBasis: 'hourly',
    };
    const rMonth = calculateHourlyRate(monthlySettings);
    const rDaily = calculateHourlyRate(dailySettings);
    const rHourly = calculateHourlyRate(hourlySettings);
    assert(
      'Hourly Basic Rate of Pay ($2.50 / hr) across all 3 sections (Monthly, Daily, Hourly)',
      rMonth.hourlyRate === 2.5 &&
        rDaily.hourlyRate === 2.5 &&
        rDaily.dailyRate === 45 &&
        rHourly.hourlyRate === 2.5,
      'monthly: $2.50/hr, daily: $2.50/hr ($45/day), hourly: $2.50/hr',
      `monthly: $${rMonth.hourlyRate.toFixed(2)}, daily: $${rDaily.hourlyRate.toFixed(2)} ($${rDaily.dailyRate}), hourly: $${rHourly.hourlyRate.toFixed(2)}`
    );
  }

  // Test 9: Custom Hourly Basic Rate of Pay override ($3.00 / hr)
  {
    const customSettings: SalarySettings = {
      ...DEFAULT_SALARY_SETTINGS,
      customHourlyBasicRate: 3.0,
      calculationBasis: 'daily',
      basicSalary: 30,
    };
    const rateInfo = calculateHourlyRate(customSettings);
    assert(
      'Custom Hourly Basic Rate override ($3.00 / hr)',
      rateInfo.hourlyRate === 3.0 && rateInfo.dailyRate === 30,
      'hourly: $3.00, daily: $30.00',
      `hourly: $${rateInfo.hourlyRate.toFixed(2)}, daily: $${rateInfo.dailyRate.toFixed(2)}`
    );
  }

  // Test 10: Overtime pay = $2.50 * 1.5 * 40 OT hrs = $150.00
  {
    const sampleSettings: SalarySettings = {
      ...DEFAULT_SALARY_SETTINGS,
      basicSalary: 600,
      hourlyRateMode: 'fixed',
      customHourlyBasicRate: 2.5,
      otMultiplierNormal: 1.5,
      allowancesList: [{ id: '1', name: 'Food', amount: 100 }],
      deductionsList: [{ id: '2', name: 'Dorm', amount: 50 }],
    };

    const mockSummary = {
      year: 2026,
      month: 10,
      totalShiftsCount: 26,
      workingDaysCount: 26,
      restDaysWorkedCount: 0,
      publicHolidaysWorkedCount: 0,
      mcDaysCount: 0,
      paidLeaveDaysCount: 0,
      unpaidLeaveDaysCount: 0,
      totalNormalHours: 208,
      totalOtHours: 40, // 40 OT hours * $2.50 * 1.5 = $150.00
      totalWorkingHours: 248,
      shifts: [],
    };

    const breakdown = calculateMonthlySalary(sampleSettings, mockSummary);
    assert(
      'Overtime pay = $2.50 × 1.5 × 40 OT hrs ($150.00) + allowances & deductions',
      breakdown.otPayTotal === 150 &&
        breakdown.estimatedGrossSalary === 850 &&
        breakdown.estimatedTakeHomeSalary === 800,
      'OT: $150, Gross: $850, Take-home: $800',
      `OT: $${breakdown.otPayTotal}, Gross: $${breakdown.estimatedGrossSalary}, Take-home: $${breakdown.estimatedTakeHomeSalary}`
    );
  }

  // Test 11: Unpaid leave deduction
  {
    const leaveSettings: SalarySettings = {
      ...DEFAULT_SALARY_SETTINGS,
      basicSalary: 1040,
      workingDaysPerWeek: 6,
      normalHoursPerDay: 8,
      allowancesList: [],
      deductionsList: [],
    };
    // dailyRate = (12 * 1040) / (52 * 6) = 12480 / 312 = $40.00 / day
    const leaveSummary = {
      year: 2026,
      month: 10,
      totalShiftsCount: 24,
      workingDaysCount: 24,
      restDaysWorkedCount: 0,
      publicHolidaysWorkedCount: 0,
      mcDaysCount: 0,
      paidLeaveDaysCount: 0,
      unpaidLeaveDaysCount: 2, // 2 days unpaid leave -> 2 * $40 = $80 deduction
      totalNormalHours: 192,
      totalOtHours: 0,
      totalWorkingHours: 192,
      shifts: [],
    };
    const breakdown = calculateMonthlySalary(leaveSettings, leaveSummary);
    assert(
      'Unpaid leave daily deduction (2 days at $40/day = $80 deduction)',
      breakdown.unpaidLeaveDeductionTotal === 80 && breakdown.estimatedGrossSalary === 960,
      'unpaidDeduction: $80, gross: $960',
      `unpaidDeduction: $${breakdown.unpaidLeaveDeductionTotal}, gross: $${breakdown.estimatedGrossSalary}`
    );
  }

  // Test 12: Date formatting and time string parsing
  {
    const min1 = timeStringToMinutes('08:30');
    const min2 = timeStringToMinutes('17:45');
    assert(
      'Time string parsing accuracy',
      min1 === 510 && min2 === 1065,
      '08:30 = 510m, 17:45 = 1065m',
      `08:30 = ${min1}m, 17:45 = ${min2}m`
    );
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    results,
  };
}
