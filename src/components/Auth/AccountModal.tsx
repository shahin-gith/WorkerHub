import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  UserPlus,
  LogIn,
  RefreshCw,
  CheckCircle2,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { Language, UserAccount } from '../../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentUser: UserAccount | null;
  savedAccounts: UserAccount[];
  hasGuestRecords: boolean;
  onCreateAccount: (params: {
    email: string;
    fullName: string;
    password: string;
    copyGuestData: boolean;
  }) => Promise<void>;
  onLoginAccount: (params: { email: string; password: string }) => Promise<void>;
  onSwitchAccount: (accountId: string) => Promise<void>;
  onSwitchToGuest: () => Promise<void>;
}

type ModalTab = 'switch' | 'login' | 'register';

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  language,
  currentUser,
  savedAccounts,
  hasGuestRecords,
  onCreateAccount,
  onLoginAccount,
  onSwitchAccount,
  onSwitchToGuest,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>(
    savedAccounts.length > 0 ? 'switch' : 'register'
  );

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [copyGuestData, setCopyGuestData] = useState(true);
  const [showRegPass, setShowRegPass] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSuccessMsg(null);
    setActiveTab(savedAccounts.length > 0 ? 'switch' : 'register');
  }, [isOpen, savedAccounts.length]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setBusy(true);
    try {
      await onLoginAccount({ email: loginEmail, password: loginPassword });
      setLoginPassword('');
      setSuccessMsg(
        language === 'bn'
          ? 'অ্যাকাউন্টে সফলভাবে লগইন হয়েছে!'
          : 'Signed in and loaded your offline workspace!'
      );
      setTimeout(() => onClose(), 600);
    } catch (err: unknown) {
      setError((err as Error).message || 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (regPassword !== regConfirm) {
      setError(
        language === 'bn'
          ? 'পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।'
          : 'Passwords do not match.'
      );
      return;
    }

    setBusy(true);
    try {
      await onCreateAccount({
        email: regEmail,
        fullName: regName,
        password: regPassword,
        copyGuestData,
      });
      setRegPassword('');
      setRegConfirm('');
      setSuccessMsg(
        language === 'bn'
          ? 'নতুন ইমেইল অ্যাকাউন্ট তৈরি এবং সক্রিয় হয়েছে!'
          : 'Email account created and activated offline!'
      );
      setTimeout(() => onClose(), 600);
    } catch (err: unknown) {
      setError((err as Error).message || 'Could not create account.');
    } finally {
      setBusy(false);
    }
  };

  const handleQuickSwitch = async (account: UserAccount) => {
    setError(null);
    setSuccessMsg(null);
    setBusy(true);
    try {
      await onSwitchAccount(account.id);
      setSuccessMsg(
        language === 'bn'
          ? `${account.email} অ্যাকাউন্টে পরিবর্তন সম্পন্ন!`
          : `Switched to ${account.email}`
      );
      setTimeout(() => onClose(), 450);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to switch account.');
    } finally {
      setBusy(false);
    }
  };

  const handleGuestSwitch = async () => {
    setError(null);
    setSuccessMsg(null);
    setBusy(true);
    try {
      await onSwitchToGuest();
      setSuccessMsg(
        language === 'bn'
          ? 'অফলাইন গেস্ট মোডে পরিবর্তন হয়েছে।'
          : 'Switched to Offline Guest workspace.'
      );
      setTimeout(() => onClose(), 450);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to switch to guest mode.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {language === 'bn' ? 'ইমেইল অ্যাকাউন্ট ও সুইচ' : 'Email Accounts & Switcher'}
              </h2>
              <p className="text-[11px] text-slate-500 truncate">
                {currentUser
                  ? `${currentUser.fullName} · ${currentUser.email}`
                  : language === 'bn'
                  ? 'বর্তমান অবস্থা: অফলাইন গেস্ট'
                  : 'Currently using Offline Guest workspace'}
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

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setActiveTab('switch');
            }}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'switch'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span>{language === 'bn' ? 'সুইচ' : `Switch (${savedAccounts.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setActiveTab('login');
            }}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            <span>{language === 'bn' ? 'লগইন' : 'Sign In'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setActiveTab('register');
            }}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'register'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span>{language === 'bn' ? 'নতুন তৈরি' : 'Create'}</span>
          </button>
        </div>

        {/* Alerts */}
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

        {/* TAB 1: SWITCH ACCOUNT */}
        {activeTab === 'switch' && (
          <div className="space-y-3">
            {savedAccounts.length === 0 ? (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-2.5">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'bn'
                    ? 'এই ফোনে এখনো কোনো ইমেইল অ্যাকাউন্ট তৈরি করা হয়নি।'
                    : 'No email accounts saved on this device yet.'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold"
                >
                  {language === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create Email Account'}
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                {savedAccounts.map((acc) => {
                  const isActive = currentUser?.id === acc.id;
                  return (
                    <div
                      key={acc.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-2 transition-colors ${
                        isActive
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {acc.fullName}
                          </span>
                          {isActive && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                          {acc.email}
                        </div>
                      </div>

                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => handleQuickSwitch(acc)}
                          disabled={busy}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shrink-0 disabled:opacity-50"
                        >
                          {language === 'bn' ? 'সুইচ' : 'Switch'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {currentUser && (
              <button
                type="button"
                onClick={handleGuestSwitch}
                disabled={busy}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>
                  {language === 'bn' ? 'লগআউট (গেস্ট মোডে যান)' : 'Sign Out to Offline Guest Mode'}
                </span>
              </button>
            )}
          </div>
        )}

        {/* TAB 2: SIGN IN WITH EMAIL & PASSWORD */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="worker@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showLoginPass ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPass(!showLoginPass)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password"
                >
                  {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm disabled:opacity-50"
            >
              {busy
                ? 'Signing in...'
                : language === 'bn'
                ? 'লগইন করুন'
                : 'Sign In Offline'}
            </button>
          </form>
        )}

        {/* TAB 3: CREATE EMAIL ACCOUNT */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'bn' ? 'আপনার পূর্ণ নাম' : 'Full Name'} *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. MD. Karim Hossain"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'} *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="worker@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'পাসওয়ার্ড (৬+ অক্ষর)' : 'Password (6+ chars)'} *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass(!showRegPass)}
                    className="absolute right-2 top-2 text-slate-400"
                    aria-label="Toggle password"
                  >
                    {showRegPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'নিশ্চিত করুন' : 'Confirm Password'} *
                </label>
                <input
                  type={showRegPass ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {!currentUser && hasGuestRecords && (
              <label className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-900 dark:text-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyGuestData}
                  onChange={(e) => setCopyGuestData(e.target.checked)}
                  className="mt-0.5 accent-amber-500"
                />
                <span>
                  {language === 'bn'
                    ? 'বর্তমান অফলাইন গেস্ট রেকর্ডগুলো এই নতুন অ্যাকাউন্টে সংরক্ষণ করুন'
                    : 'Copy my existing offline guest records into this new account'}
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm disabled:opacity-50"
            >
              {busy
                ? 'Creating Account...'
                : language === 'bn'
                ? 'অফলাইন ইমেইল অ্যাকাউন্ট তৈরি করুন'
                : 'Create Offline Account'}
            </button>
          </form>
        )}

        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed pt-1 border-t border-slate-100 dark:border-slate-800">
          {language === 'bn'
            ? 'সব অ্যাকাউন্ট ও তথ্য ইন্টারনেট ছাড়াই আপনার ফোনে এনক্রিপ্টেড ভল্টে সংরক্ষিত থাকে।'
            : 'All accounts and records stay encrypted locally on your Android device — works 100% offline with zero OTP or internet needed.'}
        </p>
      </div>
    </div>
  );
};
