import React, { useState } from 'react';
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
} from 'lucide-react';
import { apiClient, DeviceAuthResponse } from '../../services/apiClient';
import { DeviceUser, Language } from '../../types';

interface DeviceIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  deviceUser: DeviceUser | null;
  onConnected: (res: DeviceAuthResponse) => void;
}

export const DeviceIdModal: React.FC<DeviceIdModalProps> = ({
  isOpen,
  onClose,
  language,
  deviceUser,
  onConnected,
}) => {
  const [targetUserId, setTargetUserId] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const formattedId = deviceUser?.id
    ? deviceUser.id.replace(/(\d{4})(\d+)/, '$1 $2')
    : 'Connecting...';

  const handleCopyId = () => {
    if (!deviceUser?.id) return;
    navigator.clipboard.writeText(deviceUser.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = targetUserId.replace(/\s+/g, '').trim();
    if (!/^\d{6,12}$/.test(cleaned)) {
      setError(
        language === 'bn'
          ? 'অনুগ্রহ করে ৬ থেকে ১২ সংখ্যার সঠিক ইউজার আইডি লিখুন।'
          : 'Please enter a valid 6–12 digit User ID number.'
      );
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await apiClient.connectDevice(cleaned, false);
      onConnected(res);
      setTargetUserId('');
      setSuccessMsg(
        language === 'bn'
          ? `ইউজার আইডি ${res.user.id} থেকে সব তথ্য লোড হয়েছে!`
          : `Connected to User ID ${res.user.id}. All synced records loaded!`
      );
    } catch (err: unknown) {
      setError((err as Error).message || 'Could not find that User ID.');
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
          ? `নতুন ইউজার আইডি তৈরি হয়েছে: ${res.user.id}`
          : `New Device User ID created: ${res.user.id}`
      );
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to generate new User ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'bn' ? 'ডিভাইস ইউজার আইডি ও সিঙ্ক' : 'Device User ID & Sync'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {language === 'bn'
                  ? 'ইমেইল বা পাসওয়ার্ড ছাড়াই অন্য ফোনে লগইন করুন'
                  : 'No email needed · Access your records on any device'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Device User ID Card */}
        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              {language === 'bn' ? 'আপনার ইউজার আইডি নম্বর' : 'Your Active User ID Number'}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Auto-Synced
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200/70 dark:border-amber-900/40">
            <span className="text-xl sm:text-2xl font-black tracking-widest font-mono text-slate-900 dark:text-white">
              {formattedId}
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              disabled={!deviceUser?.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shrink-0 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy ID'}</span>
            </button>
          </div>

          <p className="text-[11px] text-amber-900 dark:text-amber-200/90 leading-relaxed">
            {language === 'bn'
              ? 'এই নম্বরটি লিখে বা কপি করে রাখুন। নতুন বা অন্য মোবাইল থেকে আপনার টাইম কার্ড, বেতন ও ডকুমেন্ট ফিরে পেতে এই আইডি নম্বর ব্যবহার করুন।'
              : 'Save this User ID number. Enter it on any other phone or browser to instantly load all your shifts, documents, CV, and finances.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
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
              : 'Login with User ID from Another Device'}
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

        {/* Generate fresh ID */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">Need a separate blank workspace?</span>
          <button
            type="button"
            onClick={handleGenerateNewId}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New User ID</span>
          </button>
        </div>
      </div>
    </div>
  );
};
