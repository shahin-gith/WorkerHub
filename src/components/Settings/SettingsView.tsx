import React, { useState } from 'react';
import {
  Download,
  Upload,
  ShieldCheck,
  Database,
  Cloud,
  Smartphone,
  Copy,
  Check,
  LogIn,
  Trash2,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import {
  CompanyHistoryItem,
  DeviceUser,
  DocumentItem,
  FinanceTransaction,
  Language,
  MoneyAccount,
  SalarySettings,
  SavingsGoal,
  SingaporeCV,
  WorkShift,
} from '../../types';
import { getTranslation } from '../../services/i18n';

interface SettingsViewProps {
  language: Language;
  deviceUser: DeviceUser | null;
  onOpenDeviceIdModal: () => void;
  onDeleteDeviceData: () => Promise<void>;
  onRefreshAllData: () => void;
  onImportBackupData?: (data: {
    shifts?: WorkShift[];
    salarySettings?: SalarySettings;
    documents?: DocumentItem[];
    companyHistory?: CompanyHistoryItem[];
    cv?: SingaporeCV;
    finance?: FinanceTransaction[];
    moneyAccounts?: MoneyAccount[];
    savings?: SavingsGoal;
  }) => Promise<void>;
  currentAccountData?: {
    shifts: WorkShift[];
    salarySettings: SalarySettings;
    documents: DocumentItem[];
    companyHistory: CompanyHistoryItem[];
    cv: SingaporeCV;
    finance: FinanceTransaction[];
    moneyAccounts?: MoneyAccount[];
    savings: SavingsGoal;
  };
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  deviceUser,
  onOpenDeviceIdModal,
  onDeleteDeviceData,
  onRefreshAllData,
  onImportBackupData,
  currentAccountData,
}) => {
  const t = getTranslation(language);

  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteServerModal, setShowDeleteServerModal] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    if (!deviceUser?.id) return;
    navigator.clipboard.writeText(deviceUser.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleExport = () => {
    storageService.exportCompleteBackup(deviceUser ? currentAccountData : undefined);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (deviceUser && onImportBackupData) {
        try {
          const parsed = JSON.parse(content);
          if (!parsed.data) {
            setImportStatus('Restore error: Invalid backup file structure.');
            return;
          }
          await onImportBackupData(parsed.data);
          setImportStatus(`Backup imported and saved to Device ID #${deviceUser.id}.`);
        } catch (err: unknown) {
          setImportStatus(`Restore error: ${(err as Error).message}`);
        }
        return;
      }

      const res = storageService.importBackup(content);
      if (res.success) {
        setImportStatus('Backup restored to local storage successfully.');
        onRefreshAllData();
      } else {
        setImportStatus(`Restore error: ${res.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    storageService.clearAllData();
    setShowClearModal(false);
    onRefreshAllData();
  };

  const handleConfirmDeleteServerData = async () => {
    setDeleting(true);
    try {
      await onDeleteDeviceData();
      setShowDeleteServerModal(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-5xl mx-auto px-3 sm:px-4 pt-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-6 h-6 text-amber-500" />
          {t.settingsTitle}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your Device User ID, cross-device sync, data backups, and privacy controls.
        </p>
      </div>

      {/* Device User ID & Cross-Device Sync Card */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {deviceUser ? `Device User ID: ${deviceUser.id}` : 'Device User ID Sync'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No email or password needed. Use this User ID on another device to access your data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {deviceUser && (
              <button
                onClick={handleCopyId}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
              </button>
            )}
            <button
              onClick={onOpenDeviceIdModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login with Another ID</span>
            </button>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
          <Cloud className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <span>
            {deviceUser
              ? `All shifts, salary settings, money accounts, documents, work history, and CV records are saved automatically under User ID #${deviceUser.id}.`
              : 'Working in offline local storage mode until connected.'}
          </span>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="p-4 rounded-3xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm block">Privacy & Ownership Protection</span>
          <p className="leading-relaxed">
            Your work records, salary configurations, private documents, CV data, and family remittances belong solely to your User ID and are never shared publicly or with employers without your explicit export.
          </p>
        </div>
      </div>

      {/* Backup and Restore Actions */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Data Export & Backup
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold text-xs shadow-sm transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>{t.exportBackup}</span>
          </button>

          <label className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer transition-all">
            <Upload className="w-4 h-4 text-amber-500" />
            <span>{t.importBackup}</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>

        {importStatus && (
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
            {importStatus}
          </div>
        )}
      </div>

      {/* Destructive Erase Data Area */}
      <div className="space-y-3">
        {deviceUser && (
          <div className="bg-red-50/40 dark:bg-red-950/20 p-4 sm:p-5 rounded-3xl border border-red-200 dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-red-900 dark:text-red-200">
                Delete Saved Cloud Data for User ID #{deviceUser.id}
              </h3>
              <p className="text-[11px] text-red-700 dark:text-red-300 mt-0.5">
                Permanently deletes all server-saved shifts, documents, CV, and financial records for this User ID and assigns a fresh ID.
              </p>
            </div>

            <button
              onClick={() => setShowDeleteServerModal(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0 transition-colors shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ID Data</span>
            </button>
          </div>
        )}

        <div className="bg-red-50/40 dark:bg-red-950/20 p-4 sm:p-5 rounded-3xl border border-red-200 dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-red-900 dark:text-red-200">
              {t.clearAllData}
            </h3>
            <p className="text-[11px] text-red-700 dark:text-red-300 mt-0.5">
              Clears offline local browser cache from this device.
            </p>
          </div>

          <button
            onClick={() => setShowClearModal(true)}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0 transition-colors shadow-sm"
          >
            {t.clearAllData}
          </button>
        </div>
      </div>

      {/* Clear Local Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              {t.clearAllData}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              {t.clearConfirm}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Permanently Erase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Server Data Confirmation Modal */}
      {showDeleteServerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Delete Cloud Records Permanently?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              This will permanently remove all cloud-saved shifts, documents, CV, and financial records under User ID #{deviceUser?.id}. Please export a JSON backup first if needed.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDeleteServerModal(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleConfirmDeleteServerData}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold"
              >
                {deleting ? 'Deleting...' : 'Delete Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
