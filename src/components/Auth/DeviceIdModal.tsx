import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  LogIn,
  X,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Cloud,
} from 'lucide-react';
import { apiClient, DeviceAuthResponse } from '../../services/apiClient';
import { storageService } from '../../services/storageService';
import { DeviceUser, Language } from '../../types';
import { copyToClipboard } from '../../utils/clipboard';

interface DeviceIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  deviceUser: DeviceUser | null;
  isSynced: boolean;
  sessionError?: string | null;
  onConnected: (res: DeviceAuthResponse) => void;
  onOfflineRandomId: (newId: string) => void;
  onRetryConnect: () => Promise<void>;
  onRefreshSync: () => Promise<void>;
}

function normalizeUserIdInput(raw: string): string {
  return raw
    .trim()
    .replace(/^(?:id\s*:?\s*|#)+/i, '')
    .replace(/[\s-]+/g, '');
}

export const DeviceIdModal: React.FC<DeviceIdModalProps> = ({
  isOpen,
  onClose,
  language,
  deviceUser,
  isSynced,
  sessionError,
  onConnected,
  onOfflineRandomId,
  onRetryConnect,
  onRefreshSync,
}) => {
  const [targetUserId, setTargetUserId] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSuccessMsg(null);
    if (!isSynced) {
      setSyncingNow(true);
      onRetryConnect().finally(() => setSyncingNow(false));
    }
  }, [isOpen, isSynced, onRetryConnect]);

  if (!isOpen) return null;

  const formattedId = deviceUser?.id
    ? deviceUser.id.replace(/(\d{4})(\d+)/, '$1 $2')
    : syncingNow
    ? 'Connecting...'
    : 'Generating...';

  const handleCopyId = async () => {
    if (!deviceUser?.id) return;
    const ok = await copyToClipboard(deviceUser.id);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setError('Could not copy automatically. Please select and copy the ID number manually.');
    }
  };

  const handleSyncOrRetry = async () => {
    setError(null);
    setSuccessMsg(null);
    setSyncingNow(true);
    try {
      if (!isSynced) {
        await onRetryConnect();
      } else {
        await onRefreshSync();
        setSuccessMsg(
          language === 'bn'
            ? 'আপনার সব তথ্য সার্ভার থেকে সিঙ্ক হয়েছে!'
            : 'Synced latest records for this User ID.'
        );
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Sync failed.');
    } finally {
      setSyncingNow(false);
    }
  };

  const handleConnectExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = normalizeUserIdInput(targetUserId);
    if (!/^\d{6,12}$/.test(cleaned)) {
      setError(
        language === 'bn'
          ? 'অনুগ্রহ করে ৬ থেকে ১২ সংখ্যার একটি ইউজার আইডি লিখুন।'
          : 'Please enter a 6–12 digit User ID number.'
      );
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await apiClient.connectDevice(cleaned, true);
      onConnected(res);
      setTargetUserId('');
      const hasRecords =
        res.data.shifts.length > 0 ||
        res.data.documents.length > 0 ||
        res.data.companyHistory.length > 0 ||
        res.data.finance.length > 0;
      setSuccessMsg(
        language === 'bn'
          ? `ইউজার আইডি ${res.user.id} কানেক্ট হয়েছে${hasRecords ? ' এবং সব তথ্য লোড হয়েছে!' : '!'}`
          : hasRecords
          ? `Connected to User ID ${res.user.id} — loaded all saved records!`
          : `Connected to User ID ${res.user.id} (ready to sync across devices).`
      );
    } catch (err: unknown) {
      setError((err as Error).message || 'Could not connect to that User ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNewId = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await apiClient.initDevice('Worker');
      onConnected(res);
      setSuccessMsg(
        language === 'bn'
          ? `নতুন র‍্যান্ডম ইউজার আইডি তৈরি হয়েছে: ${res.user.id}`
          : `New random User ID generated: ${res.user.id}`
      );
    } catch {
      const localRandomId = storageService.generateRandomDeviceId();
      onOfflineRandomId(localRandomId);
      setSuccessMsg(
        language === 'bn'
          ? `নতুন র‍্যান্ডম ইউজার আইডি তৈরি হয়েছে: ${localRandomId}`
          : `New random User ID generated: ${localRandomId}`
      );
    } finally {
      setLoading(false);
    }
  };

  const displayedError = error || (!isSynced ? sessionError : null);

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {language === 'bn' ? 'ডিভাইস ইউজার আইডি ও সিঙ্ক' : 'Device User ID & Sync'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {language === 'bn'
                  ? 'ভেরিফিকেশন ছাড়াই অটো র‍্যান্ডম আইডি ও ক্রস-ডিভাইস সিঙ্ক'
                  : 'Instant random ID · No verification or email needed'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Device User ID Card */}
        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              {language === 'bn' ? 'আপনার ইউজার আইডি নম্বর' : 'Your Active User ID Number'}
            </span>
            <button
              type="button"
              onClick={handleSyncOrRetry}
              disabled={syncingNow}
              className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
                isSynced
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                  : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100'
              }`}
              title="Sync with server"
            >
              {syncingNow ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Cloud className="w-3 h-3" />
              )}
              <span>{syncingNow ? 'Syncing...' : isSynced ? 'Synced · Refresh' : 'Sync Online'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200/70 dark:border-amber-900/40">
            <span className="text-xl sm:text-2xl font-black tracking-widest font-mono text-slate-900 dark:text-white select-all">
              {formattedId}
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              disabled={!deviceUser?.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-bold shrink-0 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy ID'}</span>
            </button>
          </div>

          <p className="text-[11px] text-amber-900 dark:text-amber-200/90 leading-relaxed">
            {language === 'bn'
              ? 'এই নম্বরটি লিখে বা কপি করে রাখুন। নতুন বা অন্য মোবাইল থেকে আপনার টাইম কার্ড, বেতন ও ডকুমেন্ট ফিরে পেতে এই আইডি নম্বর ব্যবহার করুন।'
              : 'Save this random User ID number. Enter it on any other phone or browser to access your shifts, documents, CV, and finances without verification.'}
          </p>
        </div>

        {displayedError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{displayedError}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login with User ID from another device */}
        <form onSubmit={handleConnectExisting} className="space-y-2.5 pt-1">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            {language === 'bn'
              ? 'অন্য ডিভাইসের ইউজার আইডি দিয়ে লগইন করুন'
              : 'Connect with User ID from Another Device'}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter 8-digit User ID (e.g. 48291037)"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={loading || !targetUserId.trim()}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold disabled:opacity-50 hover:opacity-90 transition-opacity shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>{language === 'bn' ? 'কানেক্ট করুন' : 'Switch ID'}</span>
            </button>
          </div>
        </form>

        {/* Generate fresh random ID */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500">
            {language === 'bn' ? 'নতুন র‍্যান্ডম আইডি লাগবে?' : 'Want a fresh random ID?'}
          </span>
          <button
            type="button"
            onClick={handleGenerateNewId}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'নতুন র‍্যান্ডম আইডি' : 'Generate Random ID'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
