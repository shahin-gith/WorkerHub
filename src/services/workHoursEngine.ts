import { WorkShift, WorkStatus, MonthlySummary } from '../types';

export interface ShiftCalculationResult {
  totalHours: number;
  normalHours: number;
  otHours: number;
  isOvernight: boolean;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Parses "HH:mm" time string into minutes since 00:00.
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Checks if a shift crosses midnight.
 */
export function isMidnightShift(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false;
  const startMin = timeStringToMinutes(startTime);
  const endMin = timeStringToMinutes(endTime);
  return endMin < startMin;
}

/**
 * Calculates net working hours, normal hours, and overtime hours for a shift.
 * Accurately handles midnight crossovers and unpaid break deductions.
 */
export function calculateShiftHours(
  startTime: string,
  endTime: string,
  breakMinutes: number = 0,
  normalHoursPerDay: number = 8,
  workStatus: WorkStatus = 'normal'
): ShiftCalculationResult {
  // If the worker is on leave with no active work performed
  if (
    workStatus === 'unpaid_leave' ||
    workStatus === 'medical_leave' ||
    workStatus === 'paid_leave'
  ) {
    return {
      totalHours: 0,
      normalHours: 0,
      otHours: 0,
      isOvernight: false,
      isValid: true,
    };
  }

  if (!startTime || !endTime) {
    return {
      totalHours: 0,
      normalHours: 0,
      otHours: 0,
      isOvernight: false,
      isValid: false,
      errorMessage: 'Start and end time are required.',
    };
  }

  const startMin = timeStringToMinutes(startTime);
  let endMin = timeStringToMinutes(endTime);
  const overnight = endMin < startMin;

  if (overnight) {
    endMin += 24 * 60; // Add 24 hours in minutes
  }

  const grossMinutes = endMin - startMin;
  const validBreak = Math.max(0, Number(breakMinutes) || 0);

  if (validBreak > grossMinutes) {
    return {
      totalHours: 0,
      normalHours: 0,
      otHours: 0,
      isOvernight: overnight,
      isValid: false,
      errorMessage: 'Break duration cannot exceed total shift time.',
    };
  }

  const netMinutes = grossMinutes - validBreak;
  const totalHours = Math.round((netMinutes / 60) * 100) / 100;

  // On Rest Day or Public Holiday, some companies count all hours as OT or separate category
  let normalHours = 0;
  let otHours = 0;

  if (workStatus === 'rest_day' || workStatus === 'public_holiday') {
    // Specialized rest day / PH counting: entire shift is subject to weekend/holiday rates
    normalHours = 0;
    otHours = totalHours;
  } else {
    const maxNormal = Math.max(0, Number(normalHoursPerDay) || 8);
    normalHours = Math.round(Math.min(maxNormal, totalHours) * 100) / 100;
    otHours = Math.round(Math.max(0, totalHours - normalHours) * 100) / 100;
  }

  return {
    totalHours,
    normalHours,
    otHours,
    isOvernight: overnight,
    isValid: true,
  };
}




/**
 * Aggregates work records for a specific calendar month.
 */
export function getMonthlySummary(
  shifts: WorkShift[],
  year: number,
  month: number
): MonthlySummary {
  const targetPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const monthShifts = shifts.filter((s) => s.date.startsWith(targetPrefix));

  let workingDaysCount = 0;
  let restDaysWorkedCount = 0;
  let publicHolidaysWorkedCount = 0;
  let mcDaysCount = 0;
  let paidLeaveDaysCount = 0;
  let unpaidLeaveDaysCount = 0;
  let totalNormalHours = 0;
  let totalOtHours = 0;
  let totalWorkingHours = 0;

  for (const s of monthShifts) {
    if (s.workStatus === 'normal') {
      workingDaysCount++;
      totalNormalHours += s.normalHours || 0;
      totalOtHours += s.otHours || 0;
      totalWorkingHours += s.totalWorkingHours || 0;
    } else if (s.workStatus === 'rest_day') {
      if (s.totalWorkingHours > 0) {
        restDaysWorkedCount++;
        totalOtHours += s.totalWorkingHours;
        totalWorkingHours += s.totalWorkingHours;
      }
    } else if (s.workStatus === 'public_holiday') {
      if (s.totalWorkingHours > 0) {
        publicHolidaysWorkedCount++;
        totalOtHours += s.totalWorkingHours;
        totalWorkingHours += s.totalWorkingHours;
      }
    } else if (s.workStatus === 'medical_leave') {
      mcDaysCount++;
    } else if (s.workStatus === 'paid_leave') {
      paidLeaveDaysCount++;
    } else if (s.workStatus === 'unpaid_leave') {
      unpaidLeaveDaysCount++;
    }
  }

  return {
    year,
    month,
    totalShiftsCount: monthShifts.length,
    workingDaysCount,
    restDaysWorkedCount,
    publicHolidaysWorkedCount,
    mcDaysCount,
    paidLeaveDaysCount,
    unpaidLeaveDaysCount,
    totalNormalHours: Math.round(totalNormalHours * 100) / 100,
    totalOtHours: Math.round(totalOtHours * 100) / 100,
    totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
    shifts: monthShifts.sort((a, b) => a.date.localeCompare(b.date)),
  };
}
