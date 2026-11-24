import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  ShieldCheck,
  X,
  FileCheck2,
  Lock,
  Download,
  AlertCircle,
} from 'lucide-react';
import { DocumentItem, DocumentCategory, Language } from '../../types';
import { getTranslation } from '../../services/i18n';

interface DocumentVaultViewProps {
  language: Language;
  documents: DocumentItem[];
  onSaveDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (id: string) => void;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

export const DocumentVaultView: React.FC<DocumentVaultViewProps> = ({
  language,
  documents,
  onSaveDocument,
  onDeleteDocument,
}) => {
  const t = getTranslation(language);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    category: DocumentCategory;
    issueDate: string;
    expiryDate: string;
    notes: string;
    fileName?: string;
    fileDataUrl?: string;
    fileSizeKb?: number;
  }>({
    name: '',
    category: 'work_permit',
    issueDate: '',
    expiryDate: '',
    notes: '',
  });

  const now = new Date();

  const filteredDocs = useMemo(() => {
    return documents
      .filter((doc) => {
        const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
        const matchesQuery =
          doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (doc.notes && doc.notes.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesQuery;
      })
      .map((doc) => {
        if (!doc.expiryDate) {
          return { ...doc, diffDays: null, status: 'none' as const };
        }
        const exp = new Date(doc.expiryDate);
        const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return { ...doc, diffDays: diff, status: 'expired' as const };
        if (diff <= 30) return { ...doc, diffDays: diff, status: 'expiring_soon' as const };
        return { ...doc, diffDays: diff, status: 'active' as const };
      })
      .sort((a, b) => {
        if (a.diffDays !== null && b.diffDays !== null) return a.diffDays - b.diffDays;
        return 0;
      });
  }, [documents, searchQuery, selectedCategory]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      setUploadError('File exceeds 5MB limit. Please choose a file under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        fileName: file.name,
        fileDataUrl: reader.result as string,
        fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      name: formData.name.trim(),
      category: formData.category,
      issueDate: formData.issueDate,
      expiryDate: formData.expiryDate,
      notes: formData.notes.trim(),
      fileName: formData.fileName,
      fileDataUrl: formData.fileDataUrl,
      fileSizeKb: formData.fileSizeKb,
      createdAt: Date.now(),
    };

    onSaveDocument(newDoc);
    setIsAddModalOpen(false);
    setUploadError(null);
    setFormData({
      name: '',
      category: 'work_permit',
      issueDate: '',
      expiryDate: '',
      notes: '',
    });
  };

  const getCategoryName = (cat: DocumentCategory) => {
    switch (cat) {
      case 'work_permit': return t.catWorkPermit;
      case 'passport': return t.catPassport;
      case 'employment_contract': return t.catContract;
      case 'medical': return t.catMedical;
      case 'payslip': return t.catPayslip;
      case 'certificate': return t.catCertificate;
      default: return t.catOther;
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-5xl mx-auto px-3 sm:px-4 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-500 shrink-0" />
            <span>{t.docVaultTitle}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.docVaultSubtitle}
          </p>
        </div>

        <button
          onClick={() => {
            setUploadError(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addDocBtn}</span>
        </button>
      </div>

      {/* Privacy Notice Card */}
      <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Private Document Storage (Up to 5MB / file):</span>
          {t.docWarning}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'work_permit', label: 'Work Permit' },
            { id: 'passport', label: 'Passport' },
            { id: 'employment_contract', label: 'Contract' },
            { id: 'certificate', label: 'Certificates' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {t.noDocs}
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-3 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 text-slate-900"
            >
              {t.addDocBtn}
            </button>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isPdf = doc.fileDataUrl?.startsWith('data:application/pdf');
            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-amber-400 dark:hover:border-amber-600/50 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2 gap-2">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      {getCategoryName(doc.category)}
                    </span>
                    {doc.status === 'expired' && (
                      <span className="text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded">
                        {t.expired}
                      </span>
                    )}
                    {doc.status === 'expiring_soon' && (
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                        {doc.diffDays} {t.daysRemaining}
                      </span>
                    )}
                    {doc.status === 'active' && (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                        {t.activeDoc} ({doc.diffDays}d)
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 break-words">
                    {doc.name}
                  </h3>

                  <div className="text-xs text-slate-500 space-y-1 mb-2">
                    {doc.issueDate && (
                      <div>
                        <span>{t.issueDate}:</span>{' '}
                        <strong className="text-slate-700 dark:text-slate-300">{doc.issueDate}</strong>
                      </div>
                    )}
                    {doc.expiryDate && (
                      <div>
                        <span>{t.expiryDate}:</span>{' '}
                        <strong className="text-slate-700 dark:text-slate-300">{doc.expiryDate}</strong>
                      </div>
                    )}
                  </div>

                  {doc.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl mb-3 break-words">
                      {doc.notes}
                    </p>
                  )}

                  {doc.fileDataUrl && !isPdf && (
                    <div className="mt-2 mb-3">
                      <img
                        src={doc.fileDataUrl}
                        alt={doc.name}
                        className="w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  )}

                  {doc.fileDataUrl && isPdf && (
                    <div className="mt-2 mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-semibold text-slate-700 dark:text-slate-200">
                        📄 {doc.fileName || 'Document.pdf'}
                      </span>
                      {doc.fileSizeKb && (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {(doc.fileSizeKb / 1024).toFixed(2)} MB
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-[11px] text-slate-400">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {doc.fileDataUrl && (
                      <a
                        href={doc.fileDataUrl}
                        download={doc.fileName || `${doc.name}.file`}
                        className="p-1.5 text-slate-500 hover:text-amber-600 rounded"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => setDeleteConfirmId(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded"
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              {t.deleteRecord}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Are you sure you want to delete this document from your vault?
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
                  onDeleteDocument(deleteConfirmId);
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

      {/* Add Document Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-amber-500" />
                {t.addDocBtn}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.docCategory} *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as DocumentCategory })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="work_permit">{t.catWorkPermit}</option>
                  <option value="passport">{t.catPassport}</option>
                  <option value="employment_contract">{t.catContract}</option>
                  <option value="certificate">{t.catCertificate}</option>
                  <option value="payslip">{t.catPayslip}</option>
                  <option value="medical">{t.catMedical}</option>
                  <option value="other">{t.catOther}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.docName} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MOM Work Permit Card / Passport Copy"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.issueDate}
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.expiryDate} (For Expiry Reminders)
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.attachFile}
                </label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-center">
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                  <label className="cursor-pointer text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
                    <span>Select photo, scan, or PDF</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1">
                    PNG, JPG, WEBP or PDF up to 5MB
                  </p>
                  {uploadError && (
                    <div className="mt-2 text-xs font-semibold text-red-600 flex items-center justify-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                  {formData.fileName && !uploadError && (
                    <div className="mt-2 text-xs font-semibold text-emerald-600">
                      ✓ Attached: {formData.fileName} (
                      {formData.fileSizeKb ? `${(formData.fileSizeKb / 1024).toFixed(2)} MB` : ''})
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Reference Number
                </label>
                <input
                  type="text"
                  placeholder="Optional reference number or notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
