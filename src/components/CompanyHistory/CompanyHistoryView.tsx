import React, { useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  Edit3, 
  Building2, 
  Calendar, 
  ArrowRight, 
  X,
  FileCheck,
  DollarSign
} from 'lucide-react';
import { CompanyHistoryItem, Language } from '../../types';
import { getTranslation } from '../../services/i18n';

interface CompanyHistoryViewProps {
  language: Language;
  history: CompanyHistoryItem[];
  onSaveHistoryItem: (item: CompanyHistoryItem) => void;
  onDeleteHistoryItem: (id: string) => void;
  onNavigateToCV?: () => void;
}

export const CompanyHistoryView: React.FC<CompanyHistoryViewProps> = ({
  language,
  history,
  onSaveHistoryItem,
  onDeleteHistoryItem,
  onNavigateToCV,
}) => {
  const t = getTranslation(language);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<CompanyHistoryItem, 'id'>>({
    companyName: '',
    jobTitle: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    basicSalary: 950,
    worksite: '',
    responsibilities: '',
    reasonForLeaving: '',
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      companyName: '',
      jobTitle: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      basicSalary: 950,
      worksite: '',
      responsibilities: '',
      reasonForLeaving: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CompanyHistoryItem) => {
    setEditingId(item.id);
    setFormData({
      companyName: item.companyName,
      jobTitle: item.jobTitle,
      startDate: item.startDate,
      endDate: item.endDate || '',
      isCurrent: item.isCurrent,
      basicSalary: item.basicSalary || 950,
      worksite: item.worksite || '',
      responsibilities: item.responsibilities,
      reasonForLeaving: item.reasonForLeaving || '',
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim() || !formData.jobTitle.trim()) return;

    const record: CompanyHistoryItem = {
      id: editingId || `hist-${Date.now()}`,
      companyName: formData.companyName.trim(),
      jobTitle: formData.jobTitle.trim(),
      startDate: formData.startDate,
      endDate: formData.isCurrent ? '' : formData.endDate,
      isCurrent: formData.isCurrent,
      basicSalary: Number(formData.basicSalary) || 0,
      worksite: formData.worksite?.trim(),
      responsibilities: formData.responsibilities.trim(),
      reasonForLeaving: formData.reasonForLeaving?.trim(),
      notes: formData.notes?.trim(),
    };

    onSaveHistoryItem(record);
    setIsModalOpen(false);
  };

  // Sort chronologically (most recent first)
  const sortedHistory = [...history].sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <div className="space-y-4 pb-20 max-w-5xl mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-amber-500" />
            {t.workHistoryTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.workHistorySubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToCV && (
            <button
              onClick={onNavigateToCV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FileCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.createCV}</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addJobBtn}</span>
          </button>
        </div>
      </div>

      {/* Timeline of Employment */}
      <div className="space-y-3">
        {sortedHistory.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              No previous employment records saved yet.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-3 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 text-slate-950"
            >
              {t.addJobBtn}
            </button>
          </div>
        ) : (
          sortedHistory.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4 hover:border-amber-400 dark:hover:border-amber-600/50 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {item.jobTitle}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    at <strong className="text-slate-800 dark:text-slate-200">{item.companyName}</strong>
                  </span>
                  {item.isCurrent && (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                      Current Job
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.startDate} {item.isCurrent ? '— Present' : `— ${item.endDate}`}</span>
                  </span>
                  {item.basicSalary ? (
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                      <span>Basic: ${item.basicSalary}</span>
                    </span>
                  ) : null}
                  {item.worksite && (
                    <span>Site: <strong>{item.worksite}</strong></span>
                  )}
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                  {item.responsibilities}
                </p>

                {item.reasonForLeaving && (
                  <div className="text-[11px] text-slate-500">
                    Reason for transfer: <em>{item.reasonForLeaving}</em>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0 self-end md:self-start">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title={t.edit}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirmId(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  title={t.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              {t.deleteRecord}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Are you sure you want to delete this company employment record?
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
                  onDeleteHistoryItem(deleteConfirmId);
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

      {/* Add / Edit Employment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-500" />
                {editingId ? t.edit : t.addJobBtn}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.company} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Builders Pte Ltd"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.jobTitle} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Structural Welder & Rigger"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.startDate} (YYYY-MM) *
                  </label>
                  <input
                    type="month"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.endDate}
                  </label>
                  <input
                    type="month"
                    disabled={formData.isCurrent}
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-40"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isCurrent}
                  onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.currentlyWorkingHere}
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monthly Basic Salary (SGD)
                  </label>
                  <input
                    type="number"
                    value={formData.basicSalary || ''}
                    onChange={(e) => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) || 0 })}
                    placeholder="950"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.worksite}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tuas Mega Yard"
                    value={formData.worksite || ''}
                    onChange={(e) => setFormData({ ...formData, worksite: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.jobResponsibilities} *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your day-to-day duties, machines used, and projects handled..."
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.reasonLeaving}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Contract completed, higher overtime opportunity"
                  value={formData.reasonForLeaving || ''}
                  onChange={(e) => setFormData({ ...formData, reasonForLeaving: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-sm"
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
