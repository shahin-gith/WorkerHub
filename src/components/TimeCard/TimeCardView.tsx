import React, { useState, useMemo } from 'react';
import {
  Plus,
  Copy,
  FileSpreadsheet,
  Printer,
  Download,
  Trash2,
  Edit3,
  Clock,
  Moon,
  Filter,
  Calendar as CalendarIcon,
  X,
  AlertCircle,
} from 'lucide-react';
import { WorkShift, WorkStatus, SalarySettings, Language } from '../../types';
import { getTranslation } from '../../services/i18n';
import { calculateShiftHours, getMonthlySummary } from '../../services/workHoursEngine';
import { exportTimeCardPDF, exportShiftsToCSV } from '../../services/pdfExportService';

interface TimeCardViewProps {
  language: Language;
  shifts: WorkShift[];
  onSaveShift: (shift: WorkShift) => void;
  onDeleteShift: (id: string) => void;
  salarySettings: SalarySettings;
  workerName?: string;
  isLogModalOpen: boolean;
  setIsLogModalOpen: (open: boolean) => void;
}

export const TimeCardView: React.FC<TimeCardViewProps> = ({
  language,
  shifts,
  onSaveShift,
  onDeleteShift,
  salarySettings,
  workerName = 'Worker',
  isLogModalOpen,
  setIsLogModalOpen,
}) => {
  const t = getTranslation(language);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Determine smart prefill values from latest shift or salarySettings defaults
  const getPrefillDefaults = () => {
    const latest = [...shifts].sort((a, b) => b.createdAt - a.createdAt)[0];
    return {
      date: new Date().toISOString().split('T')[0],
      companyName:
        latest?.companyName ||
        salarySettings.defaultCompany ||
        'Singapore Construction & Marine Pte Ltd',
      worksiteName:
        latest?.worksiteName ||
        salarySettings.defaultWorksite ||
        'Main Project Worksite',
      startTime: latest?.startTime || salarySettings.defaultStartTime || '08:00',
      endTime: latest?.endTime || salarySettings.defaultEndTime || '17:00',
      breakDurationMinutes:
        latest?.breakDurationMinutes ?? salarySettings.defaultBreakMinutes ?? 60,
      workStatus: (latest?.workStatus || 'normal') as WorkStatus,
      dailyNotes: '',
    };
  };

  // Form State for Shift Modal (prefilled on mount)
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    date: string;
    companyName: string;
    worksiteName: string;
    startTime: string;
    endTime: string;
    breakDurationMinutes: number;
    workStatus: WorkStatus;
    dailyNotes: string;
  }>(() => getPrefillDefaults());

  // Calculate live preview in modal
  const liveCalculation = useMemo(() => {
    return calculateShiftHours(
      formData.startTime,
      formData.endTime,
      formData.breakDurationMinutes,
      salarySettings.normalHoursPerDay || 8,
      formData.workStatus
    );
  }, [formData, salarySettings.normalHoursPerDay]);

  // Unique companies & worksites lists for filter & datalist autocomplete
  const companyOptions = useMemo(() => {
    const set = new Set<string>();
    if (salarySettings.defaultCompany) set.add(salarySettings.defaultCompany);
    shifts.forEach((s) => {
      if (s.companyName) set.add(s.companyName);
    });
    return Array.from(set);
  }, [shifts, salarySettings.defaultCompany]);

  const worksiteOptions = useMemo(() => {
    const set = new Set<string>();
    if (salarySettings.defaultWorksite) set.add(salarySettings.defaultWorksite);
    shifts.forEach((s) => {
      if (s.worksiteName) set.add(s.worksiteName);
    });
    return Array.from(set);
  }, [shifts, salarySettings.defaultWorksite]);

  // Filtered shifts for selected month & year
  const monthlySummary = useMemo(() => {
    const rawSummary = getMonthlySummary(shifts, selectedYear, selectedMonth);
    if (filterCompany === 'all') {
      return rawSummary;
    }
    const filtered = rawSummary.shifts.filter((s) => s.companyName === filterCompany);
    return {
      ...rawSummary,
      shifts: filtered,
    };
  }, [shifts, selectedYear, selectedMonth, filterCompany]);

  const handleOpenNewShift = () => {
    setEditingShiftId(null);
    setFormData(getPrefillDefaults());
    setIsLogModalOpen(true);
  };

  const handleEditShift = (shift: WorkShift) => {
    setEditingShiftId(shift.id);
    setFormData({
      date: shift.date,
      companyName: shift.companyName,
      worksiteName: shift.worksiteName,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakDurationMinutes: shift.breakDurationMinutes,
      workStatus: shift.workStatus,
      dailyNotes: shift.dailyNotes || '',
    });
    setIsLogModalOpen(true);
  };

  const handleCopyYesterday = () => {
    const sorted = [...shifts].sort((a, b) => b.date.localeCompare(a.date));
    if (sorted.length > 0) {
      const prev = sorted[0];
      setFormData((prevForm) => ({
        ...prevForm,
        companyName: prev.companyName,
        worksiteName: prev.worksiteName,
        startTime: prev.startTime,
        endTime: prev.endTime,
        breakDurationMinutes: prev.breakDurationMinutes,
        workStatus: prev.workStatus,
      }));
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveCalculation.isValid) {
      return;
    }

    const newShift: WorkShift = {
      id: editingShiftId || `shift-${Date.now()}`,
      date: formData.date,
      companyName: formData.companyName.trim() || 'Company',
      worksiteName: formData.worksiteName.trim() || 'General Site',
      startTime: formData.startTime,
      endTime: formData.endTime,
      breakDurationMinutes: Number(formData.breakDurationMinutes) || 0,
      normalHours: liveCalculation.normalHours,
      otHours: liveCalculation.otHours,
      totalWorkingHours: liveCalculation.totalHours,
      workStatus: formData.workStatus,
      dailyNotes: formData.dailyNotes.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onSaveShift(newShift);
    setIsLogModalOpen(false);
  };

  const getStatusLabel = (status: WorkStatus) => {
    switch (status) {
      case 'normal': return t.statusNormal;
      case 'rest_day': return t.statusRestDay;
      case 'public_holiday': return t.statusPH;
      case 'medical_leave': return t.statusMC;
      case 'paid_leave': return t.statusPaidLeave;
      case 'unpaid_leave': return t.statusUnpaidLeave;
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="space-y-4 pb-24 max-w-5xl mx-auto px-3 sm:px-4 pt-4">
      {/* Screen-Only Controls & Cards */}
      <div className="no-print space-y-4">
        {/* Title & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {t.timeCardTitle}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.timeCardSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportShiftsToCSV(monthlySummary.shifts, selectedMonth, selectedYear)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={t.exportCSV}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={() =>
                exportTimeCardPDF(
                  monthlySummary,
                  filterCompany !== 'all' ? filterCompany : salarySettings.defaultCompany,
                  workerName
                )
              }
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={t.exportPDF}
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>PDF</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Print Time Card Entries Only"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>Print Entries</span>
            </button>

            <button
              onClick={handleOpenNewShift}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-sm ml-auto sm:ml-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t.logNewShift}</span>
            </button>
          </div>
        </div>

        {/* Month & Filter Controls */}
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <CalendarIcon className="w-4 h-4 text-amber-500 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              {monthNames.map((name, i) => (
                <option key={i + 1} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              {[2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="flex-1 sm:flex-initial text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <option value="all">{t.allCompanies}</option>
              {companyOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Monthly Summary Statistics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-amber-50/70 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
          <div>
            <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
              {t.workingDays}
            </div>
            <div className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">
              {monthlySummary.workingDaysCount}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
              {t.normalHours}
            </div>
            <div className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">
              {monthlySummary.totalNormalHours.toFixed(1)}h
            </div>
          </div>
          <div>
            <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
              {t.otHours}
            </div>
            <div className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {monthlySummary.totalOtHours.toFixed(1)}h
            </div>
          </div>
          <div>
            <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
              {t.totalHours}
            </div>
            <div className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">
              {monthlySummary.totalWorkingHours.toFixed(1)}h
            </div>
          </div>
        </div>

        {/* Shifts List (Screen View) */}
        <div className="space-y-2.5">
          {monthlySummary.shifts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <Clock className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {t.noShiftsFound}
              </p>
              <button
                onClick={handleOpenNewShift}
                className="mt-3 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 text-slate-950"
              >
                {t.logNewShift}
              </button>
            </div>
          ) : (
            monthlySummary.shifts.map((shift) => {
              const isOvernight =
                shift.startTime && shift.endTime && shift.endTime < shift.startTime;
              return (
                <div
                  key={shift.id}
                  className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-400 dark:hover:border-amber-600/50 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 text-center py-1.5 px-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase">
                        {new Date(shift.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="block text-base font-bold tabular-nums text-slate-900 dark:text-white">
                        {shift.date.split('-')[2]}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white break-words">
                          {shift.companyName}
                        </span>
                        {shift.workStatus !== 'normal' && (
                          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                            {getStatusLabel(shift.workStatus)}
                          </span>
                        )}
                        {isOvernight && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950/60 px-1.5 py-0.5 rounded">
                            <Moon className="w-3 h-3" />
                            <span>{t.overnightTag}</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-1.5">
                        <span>{shift.worksiteName}</span>
                        <span>·</span>
                        <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">
                          {shift.startTime} - {shift.endTime}
                        </span>
                        <span>·</span>
                        <span>Break {shift.breakDurationMinutes}m</span>
                      </div>

                      {shift.dailyNotes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic break-words">
                          "{shift.dailyNotes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          Normal:{' '}
                          <strong className="text-slate-800 dark:text-slate-200 tabular-nums">
                            {shift.normalHours}h
                          </strong>
                        </span>
                        {shift.otHours > 0 && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                            +OT {shift.otHours}h
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white tabular-nums">
                        Total: {shift.totalWorkingHours}h
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditShift(shift)}
                        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={t.edit}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(shift.id)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title={t.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Print-Only View: Prints ONLY the Time Card Entries Table */}
      <div className="hidden print-only w-full text-black bg-white">
        <div className="flex items-center justify-between border-b border-black pb-2 mb-3 text-xs">
          <div>
            <strong className="text-sm">
              Time Card Entries — {monthNames[selectedMonth - 1]} {selectedYear}
            </strong>
            {filterCompany !== 'all' && <span className="ml-2">({filterCompany})</span>}
          </div>
          <div>Worker: {workerName}</div>
        </div>

        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-black bg-slate-100">
              <th className="text-left py-1.5 px-2 border border-slate-300">Date</th>
              <th className="text-left py-1.5 px-2 border border-slate-300">Company & Worksite</th>
              <th className="text-left py-1.5 px-2 border border-slate-300">Time</th>
              <th className="text-right py-1.5 px-2 border border-slate-300">Break</th>
              <th className="text-right py-1.5 px-2 border border-slate-300">Normal</th>
              <th className="text-right py-1.5 px-2 border border-slate-300">OT</th>
              <th className="text-right py-1.5 px-2 border border-slate-300">Total</th>
              <th className="text-left py-1.5 px-2 border border-slate-300">Status / Notes</th>
            </tr>
          </thead>
          <tbody>
            {monthlySummary.shifts.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-4 border border-slate-300">
                  No time card entries for this period.
                </td>
              </tr>
            ) : (
              monthlySummary.shifts.map((shift) => (
                <tr key={shift.id}>
                  <td className="py-1.5 px-2 border border-slate-300 whitespace-nowrap font-mono">
                    {shift.date}
                  </td>
                  <td className="py-1.5 px-2 border border-slate-300">
                    <div className="font-semibold">{shift.companyName}</div>
                    {shift.worksiteName && (
                      <div className="text-[10px] text-slate-600">{shift.worksiteName}</div>
                    )}
                  </td>
                  <td className="py-1.5 px-2 border border-slate-300 whitespace-nowrap font-mono">
                    {shift.startTime}–{shift.endTime}
                  </td>
                  <td className="py-1.5 px-2 border border-slate-300 text-right">
                    {shift.breakDurationMinutes}m
                  </td>
                  <td className="py-1.5 px-2 border border-slate-300 text-right">
                    {shift.normalHours}h
                  </td>
                  <td className="py-1.5 px-2 border border-slate-300 text-right font-semibold">
                    {shift.otHours}h
                  </td>
                  <td className="py-1.5 px-2 border border-slate-300 text-right font-bold">
                    {shift.totalWorkingHours}h
                  </td>
                  <td className="py-1.5 px-2 border border-slate-300">
                    {getStatusLabel(shift.workStatus)}
                    {shift.dailyNotes ? ` — ${shift.dailyNotes}` : ''}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {monthlySummary.shifts.length > 0 && (
            <tfoot>
              <tr className="font-bold bg-slate-100">
                <td colSpan={4} className="py-1.5 px-2 border border-slate-300 text-right">
                  Monthly Totals ({monthlySummary.shifts.length} entries):
                </td>
                <td className="py-1.5 px-2 border border-slate-300 text-right">
                  {monthlySummary.totalNormalHours.toFixed(1)}h
                </td>
                <td className="py-1.5 px-2 border border-slate-300 text-right">
                  {monthlySummary.totalOtHours.toFixed(1)}h
                </td>
                <td className="py-1.5 px-2 border border-slate-300 text-right">
                  {monthlySummary.totalWorkingHours.toFixed(1)}h
                </td>
                <td className="py-1.5 px-2 border border-slate-300" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              {t.deleteRecord}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              {t.confirmDeleteShift}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  onDeleteShift(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log / Edit Shift Modal (Prefilled Fields) */}
      {isLogModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                {editingShiftId ? t.edit : t.logNewShift}
              </h2>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {!editingShiftId && shifts.length > 0 && (
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Fields prefilled from your latest schedule</span>
                  <button
                    type="button"
                    onClick={handleCopyYesterday}
                    className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.copyYesterday}</span>
                  </button>
                </div>
              )}

              {/* Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.date} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.workStatus}
                  </label>
                  <select
                    value={formData.workStatus}
                    onChange={(e) =>
                      setFormData({ ...formData, workStatus: e.target.value as WorkStatus })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="normal">{t.statusNormal}</option>
                    <option value="rest_day">{t.statusRestDay}</option>
                    <option value="public_holiday">{t.statusPH}</option>
                    <option value="medical_leave">{t.statusMC}</option>
                    <option value="paid_leave">{t.statusPaidLeave}</option>
                    <option value="unpaid_leave">{t.statusUnpaidLeave}</option>
                  </select>
                </div>
              </div>

              {/* Company & Worksite with prefilled autocomplete suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.company}
                  </label>
                  <input
                    type="text"
                    required
                    list="workerhub-company-list"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Enter company name"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <datalist id="workerhub-company-list">
                    {companyOptions.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.worksite}
                  </label>
                  <input
                    type="text"
                    list="workerhub-worksite-list"
                    value={formData.worksiteName}
                    onChange={(e) => setFormData({ ...formData, worksiteName: e.target.value })}
                    placeholder="Enter worksite or project"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <datalist id="workerhub-worksite-list">
                    {worksiteOptions.map((w) => (
                      <option key={w} value={w} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Start Time, End Time & Break */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.startTime}
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.endTime}
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.breakMinutes}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="15"
                    value={formData.breakDurationMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, breakDurationMinutes: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Live Calculation Preview Card */}
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] font-semibold text-slate-500 mb-1">
                  Live Calculation Preview:
                </div>
                {liveCalculation.isValid ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                        Normal: {liveCalculation.normalHours}h
                      </span>
                      {liveCalculation.otHours > 0 && (
                        <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          + OT: {liveCalculation.otHours}h
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {liveCalculation.isOvernight && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-1.5 py-0.5 rounded">
                          <Moon className="w-3 h-3" />
                          <span>Crosses Midnight</span>
                        </span>
                      )}
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                        Total: {liveCalculation.totalHours}h
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{liveCalculation.errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Daily Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.dailyNotes}
                </label>
                <input
                  type="text"
                  value={formData.dailyNotes}
                  onChange={(e) => setFormData({ ...formData, dailyNotes: e.target.value })}
                  placeholder="Optional task details or supervisor approval note"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!liveCalculation.isValid}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 transition-all shadow-sm"
                >
                  {t.saveRecord}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
