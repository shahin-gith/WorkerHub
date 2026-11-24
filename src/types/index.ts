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
  basicSalary: number; // monthly or daily or hourly based on calculationBasis
  hourlyRateMode?: 'fixed';
  customHourlyBasicRate?: number; // defaults to 2.50 across all 3 sections
  workingDaysPerWeek: number; // e.g., 6 or 5.5 or 5
  normalHoursPerDay: number; // e.g., 8 or 9
  otMultiplierNormal: number; // typically 1.5
  otMultiplierSundayRest: number; // typically 2.0
  otMultiplierPublicHoliday: number; // typically 2.0
  allowancesList: AllowanceDeductionItem[];
  deductionsList: AllowanceDeductionItem[];
  defaultCompany: string;
  defaultWorksite: string;
  defaultStartTime: string;
  defaultEndTime: string;
  defaultBreakMinutes: number;
}

export interface DeviceUser {
  id: string; // 8-digit numeric User ID e.g. "48291037"
  displayName: string;
  role: 'worker' | 'admin';
  createdAt: number;
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

export type DocumentCategory =
  | 'work_permit'
  | 'passport'
  | 'employment_contract'
  | 'medical'
  | 'payslip'
  | 'certificate'
  | 'other';

export interface DocumentItem {
  id: string;
  name: string;
  category: DocumentCategory;
  issueDate?: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  notes?: string;
  fileName?: string;
  fileDataUrl?: string; // stored in Base64 if attached (up to 5MB)
  fileSizeKb?: number;
  createdAt: number;
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
  residentialArea: string; // e.g. Jurong / Woodlands / Tuas
  nationality: string; // Bangladeshi / Indian / etc.
  passType: string; // Work Permit / S Pass
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
    level: string; // Basic / Conversational / Fluent
  }>;
  drivingLicence: {
    hasLicence: boolean;
    licenceClass: string; // Class 3, Class 4, 3A, Forklift
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
  ratingWorkEnv: number; // 1-5
  ratingSalaryPayment: number; // 1-5
  ratingAccommodation: number; // 1-5
  ratingManagement: number; // 1-5
  title: string;
  comment: string;
  employmentStatus: 'Current Worker' | 'Former Worker';
  status: 'approved' | 'pending' | 'flagged';
  likesCount: number;
  likedByMe?: boolean;
  googleSourceUrl?: string;
  createdAt: number;
}

export interface GoogleCompanyResult {
  name: string;
  industry: 'Construction' | 'Marine Shipyard' | 'Manufacturing' | 'Process' | 'Services' | 'Other';
  address: string;
  description: string;
  sourceUrl?: string;
  sourceTitle?: string;
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

export interface HelpSearchResult {
  summaryText: string;
  articles: Array<{
    title: string;
    summary: string;
    category: HelpArticle['category'];
    url: string;
    sourceName: string;
  }>;
  groundingLinks: Array<{ title: string; uri: string }>;
}

export type MoneyAccountType = 'cash' | 'bank' | 'savings' | 'mobile_wallet';

export interface MoneyAccount {
  id: string;
  name: string;
  type: MoneyAccountType;
  initialBalance: number;
  createdAt: number;
}

export type FinanceCategory =
  | 'salary'
  | 'overtime'
  | 'food'
  | 'remittance'
  | 'dormitory'
  | 'transport'
  | 'mobile_data'
  | 'medical'
  | 'entertainment'
  | 'other';

export interface FinanceTransaction {
  id: string;
  type: 'income' | 'expense' | 'remittance';
  category: FinanceCategory;
  accountId?: string;
  accountName?: string;
  amountSgd: number;
  amountForeign?: number;
  foreignCurrency?: string; // e.g. 'BDT'
  exchangeRate?: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetSgd: number;
  currentSgd: number;
  targetDate: string;
}

export interface DashboardCardConfig {
  showTodaySummary: boolean;
  showMonthStats: boolean;
  showSalaryEstimate: boolean;
  showExpiryAlerts: boolean;
  showQuickActions: boolean;
  showEmergencyHelp: boolean;
}
