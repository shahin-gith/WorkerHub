export type Language = 'en' | 'bn';

export type WorkStatus =
  | 'normal'
  | 'rest_day'
  | 'public_holiday'
  | 'medical_leave'
  | 'paid_leave'
  | 'unpaid_leave';

export interface WorkShift {
  id: string;
  date: string; // YYYY-MM-DD
  companyName: string;
  worksiteName: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakDurationMinutes: number;
  normalHours: number;
  otHours: number;
  totalWorkingHours: number;
  workStatus: WorkStatus;
  dailyNotes?: string;
  createdAt: number;
  updatedAt: number;
}

export type SalaryCalculationBasis = 'monthly' | 'daily' | 'hourly';

export interface AllowanceDeductionItem {
  id: string;
  name: string;
  amount: number;
}

export interface SalarySettings {
  calculationBasis: SalaryCalculationBasis;
  basicSalary: number;
  hourlyRateMode?: 'fixed';
  customHourlyBasicRate?: number; // defaults to 2.50 across all 3 sections
  workingDaysPerWeek: number;
  normalHoursPerDay: number;
  otMultiplierNormal: number;
  otMultiplierSundayRest: number;
  otMultiplierPublicHoliday: number;
  allowancesList: AllowanceDeductionItem[];
  deductionsList: AllowanceDeductionItem[];
  defaultCompany: string;
  defaultWorksite: string;
  defaultStartTime: string;
  defaultEndTime: string;
  defaultBreakMinutes: number;
}

export interface ManualWorkSummary {
  workingDaysCount: number;
  totalNormalHours: number;
  totalOtHours: number;
  restDaysWorkedCount: number;
  publicHolidaysWorkedCount: number;
  unpaidLeaveDaysCount: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  totalShiftsCount: number;
  workingDaysCount: number;
  restDaysWorkedCount: number;
  publicHolidaysWorkedCount: number;
  mcDaysCount: number;
  paidLeaveDaysCount: number;
  unpaidLeaveDaysCount: number;
  totalNormalHours: number;
  totalOtHours: number;
  totalWorkingHours: number;
  shifts: WorkShift[];
}

export interface FormulaStep {
  label: string;
  formula: string;
  amount: number;
  explanation: string;
}

export interface SalaryBreakdown {
  calculationBasis: SalaryCalculationBasis;
  basicSalary: number;
  hourlyRate: number;
  hourlyRateFormula: string;
  dailyRate: number;
  normalHoursTotal: number;
  normalPayTotal: number;
  otHoursTotal: number;
  otPayTotal: number;
  sundayRestDaysTotal: number;
  sundayRestPayTotal: number;
  phDaysTotal: number;
  phPayTotal: number;
  paidLeaveDaysTotal: number;
  paidLeavePayTotal: number;
  unpaidLeaveDaysTotal: number;
  unpaidLeaveDeductionTotal: number;
  allowancesTotal: number;
  deductionsTotal: number;
  estimatedGrossSalary: number;
  estimatedTakeHomeSalary: number;
  formulaSteps: FormulaStep[];
}

export interface CompanyHistoryItem {
  id: string;
  companyName: string;
  jobTitle: string;
  startDate: string; // YYYY-MM
  endDate?: string; // YYYY-MM or 'Present'
  isCurrent: boolean;
  basicSalary?: number;
  worksite?: string;
  responsibilities: string;
  reasonForLeaving?: string;
  notes?: string;
}

export interface WorkExperienceEntry {
  id: string;
  company: string;
  role: string;
  duration: string;
  responsibilities: string;
}

export interface SingaporeCV {
  fullName: string;
  contactNumber: string;
  email: string;
  residentialArea: string;
  nationality: string;
  passType: string;
  yearsInSingapore: number;
  professionalSummary: string;
  workExperience: WorkExperienceEntry[];
  skills: string[];
  education: Array<{
    id: string;
    institution: string;
    qualification: string;
    year: string;
  }>;
  languages: Array<{
    id: string;
    name: string;
    level: string;
  }>;
  drivingLicence: {
    hasLicence: boolean;
    licenceClass: string;
  };
  certificates: Array<{
    id: string;
    name: string;
    issuer: string;
    year: string;
  }>;
}

export interface CompanyReview {
  id: string;
  userId?: string;
  companyName: string;
  industry: 'Construction' | 'Marine Shipyard' | 'Manufacturing' | 'Process' | 'Services' | 'Other';
  ratingWorkEnv: number;
  ratingSalaryPayment: number;
  ratingAccommodation: number;
  ratingManagement: number;
  title: string;
  comment: string;
  employmentStatus: 'Current Worker' | 'Former Worker';
  status: 'approved' | 'pending' | 'flagged';
  likesCount: number;
  likedByMe?: boolean;
  isOwn?: boolean;
  createdAt: number;
}

export interface HelpArticle {
  id: string;
  userId?: string;
  title: string;
  category: 'salary' | 'safety' | 'medical' | 'housing' | 'remittance' | 'general';
  summary: string;
  content: string;
  language: Language;
  authorLabel: string;
  sourceUrl?: string;
  likesCount: number;
  likedByMe?: boolean;
  isOwner?: boolean;
  createdAt: number;
}

export interface DashboardCardConfig {
  showSalaryEstimate: boolean;
  showQuickActions: boolean;
  showEmergencyHelp: boolean;
}
