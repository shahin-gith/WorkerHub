import React, { useState } from 'react';
import {
  Download,
  Upload,
  ShieldCheck,
  Database,
  HardDrive,
  Mail,
  RefreshCw,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import {
  CompanyHistoryItem,
  DocumentItem,
  FinanceTransaction,
  Language,
  MoneyAccount,
  SalarySettings,
  SavingsGoal,
  SingaporeCV,
  UserAccount,
  WorkShift,
} from '../../types';
import { getTranslation } from '../../services/i18n';

interface SettingsViewProps {
  language: Language;
  currentUser: UserAccount | null;
  savedAccounts: UserAccount[];
  onOpenAccountModal: () => void;
  onSwitchAccount: (accountId: string) => Promise<void>;
  onDeleteCurrentAccount: () => Promise<void>;
  onClearCurrentWorkspace: () => Promise<void>;
  onImportBackupData: (data: {
    shifts?: WorkShift[];
    salarySettings?: SalarySettings;
    documents?: DocumentItem[];
    companyHistory?: CompanyHistoryItem[];
    cv?: SingaporeCV;
    finance?: FinanceTransaction[];
    moneyAccounts?: MoneyAccount[];
    savings?: SavingsGoal;
  }) => Promise<void>;
  currentAccountData: {
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
  currentUser,
  savedAccounts,
  onOpenAccountModal,
  onSwitchAccount,
  onDeleteCurrentAccount,
  onClearCurrentWorkspace,
  onImportBackupData,
  currentAccountData,
}) => {
  const t = getTranslation(language);

  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteAcctModal, setShowDeleteAcctModal] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleExport = () => {
    storageService.exportCompleteBackup(currentAccountData);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        if (!parsed.data) {
          setImportStatus('Restore error: Invalid backup file structure.');
          return;
        }
        await onImportBackupData(parsed.data);
        setImportStatus(
          currentUser
            ? `Backup restored into ${currentUser.email}.`
            : 'Backup restored into Offline Guest workspace.'
        );
      } catch (err: unknown) {
        setImportStatus(`Restore error: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleClearWorkspace = async () => {
    setBusy(true);
    try {
      await onClearCurrentWorkspace();
      setShowClearModal(false);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setBusy(true);
    try {
      await onDeleteCurrentAccount();
      setShowDeleteAcctModal(false);
    } finally {
      setBusy(false);
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
          Manage your offline Email Accounts, instant account switching, JSON backups, and device privacy.
        </p>
      </div>

      {/* Email Account & Instant Switch Card */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {currentUser ? currentUser.fullName : 'Offline Guest Workspace'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {currentUser ? currentUser.email : 'Not signed in — create or switch email account'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAccountModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{currentUser ? 'Switch / Manage Accounts' : 'Create / Login Email Account'}</span>
          </button>
        </div>

        {/* Saved Accounts Quick Switch List */}
        {savedAccounts.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Saved Accounts on This Device ({savedAccounts.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {savedAccounts.map((acct) => {
                const isActive = currentUser?.id === acct.id;
                return (
                  <div
                    key={acct.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                      isActive
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                        <span>{acct.fullName}</span>
                        {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate font-mono">{acct.email}</div>
                    </div>
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => onSwitchAccount(acct.id)}
                        className="px-3 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shrink-0"
                      >
                        Switch
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
          <HardDrive className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            100% Offline Android Vault: Every email account keeps its own separate Time Cards, Salary settings, Money Accounts, Documents (up to 5MB each), Work History, and CV safely on your device with zero internet or API keys required.
          </span>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="p-4 rounded-3xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm block">Offline Device Privacy</span>
          <p className="leading-relaxed">
            Your work records, salary configurations, private documents, CV data, and family finances are stored directly on your device and never transmitted to external servers.
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
        {currentUser && (
          <div className="bg-red-50/40 dark:bg-red-950/20 p-4 sm:p-5 rounded-3xl border border-red-200 dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-red-900 dark:text-red-200">
                Delete Account ({currentUser.email})
              </h3>
              <p className="text-[11px] text-red-700 dark:text-red-300 mt-0.5">
                Permanently removes this email account and its saved shifts, documents, CV, and financial records from this device.
              </p>
            </div>

            <button
              onClick={() => setShowDeleteAcctModal(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0 transition-colors shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          </div>
        )}

        <div className="bg-red-50/40 dark:bg-red-950/20 p-4 sm:p-5 rounded-3xl border border-red-200 dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-red-900 dark:text-red-200">
              {t.clearAllData}
            </h3>
            <p className="text-[11px] text-red-700 dark:text-red-300 mt-0.5">
              Clears records in the currently active workspace ({currentUser ? currentUser.email : 'Offline Guest'}).
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

      {/* Clear Workspace Confirmation Modal */}
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
                disabled={busy}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleClearWorkspace}
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                {busy ? 'Clearing...' : 'Permanently Erase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteAcctModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Delete Email Account?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              This will permanently remove {currentUser?.email} and all of its stored records on this device. Export a JSON backup first if needed.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDeleteAcctModal(false)}
                disabled={busy}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleConfirmDeleteAccount}
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold"
              >
                {busy ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
