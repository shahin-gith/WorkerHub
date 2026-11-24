import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { apiClient, AuthResponse } from '../../services/apiClient';
import { Language } from '../../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  initialMode?: 'register' | 'login';
  onAuthSuccess: (res: AuthResponse) => void;
}

type AuthScreen =
  | 'register'
  | 'verify_registration'
  | 'login_password'
  | 'login_otp_request'
  | 'login_otp_verify'
  | 'forgot_request'
  | 'forgot_verify';

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  language,
  initialMode = 'register',
  onAuthSuccess,
}) => {
  const [screen, setScreen] = useState<AuthScreen>(
    initialMode === 'login' ? 'login_password' : 'register'
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [emailConfigured, setEmailConfigured] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setScreen(initialMode === 'login' ? 'login_password' : 'register');
      setError(null);
      setInfoMessage(null);
      setOtp('');
      apiClient
        .getEmailStatus()
        .then((res) => setEmailConfigured(res.emailConfigured))
        .catch(() => setEmailConfigured(false));
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      const res = await apiClient.register(fullName.trim(), email.trim(), password);
      setInfoMessage(res.message);
      setOtp('');
      setScreen('verify_registration');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.verifyRegistration(email.trim(), otp.trim());
      onAuthSuccess(res);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      const res = await apiClient.loginWithPassword(email.trim(), password);
      onAuthSuccess(res);
      onClose();
    } catch (err: unknown) {
      const typed = err as Error & { needsVerification?: boolean };
      setError(typed.message);
      if (typed.needsVerification) {
        setScreen('verify_registration');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      const res = await apiClient.sendOtp(email.trim(), 'login');
      setInfoMessage(res.message);
      setOtp('');
      setScreen('login_otp_verify');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.loginWithOtp(email.trim(), otp.trim());
      onAuthSuccess(res);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      const res = await apiClient.sendOtp(email.trim(), 'reset_password');
      setInfoMessage(res.message);
      setOtp('');
      setScreen('forgot_verify');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.resetPassword(email.trim(), otp.trim(), newPassword);
      setInfoMessage(res.message);
      setPassword('');
      setNewPassword('');
      setOtp('');
      setScreen('login_password');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (purpose: 'verify_account' | 'login' | 'reset_password') => {
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      const res = await apiClient.sendOtp(email.trim(), purpose);
      setInfoMessage(res.message);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {language === 'bn' ? 'ওয়ার্কারহাব অ্যাকাউন্ট' : 'WorkerHub Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switch Tabs for Register vs Sign In */}
        {(screen === 'register' || screen === 'login_password' || screen === 'login_otp_request') && (
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => {
                setScreen('register');
                setError(null);
                setInfoMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                screen === 'register'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {language === 'bn' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Open Account'}
            </button>
            <button
              type="button"
              onClick={() => {
                setScreen('login_password');
                setError(null);
                setInfoMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                screen === 'login_password' || screen === 'login_otp_request'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {language === 'bn' ? 'লগইন করুন' : 'Sign In'}
            </button>
          </div>
        )}

        {/* SMTP not configured warning */}
        {!emailConfigured && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Email OTP setup required:</strong> Configure <code className="font-mono">SMTP_USER</code> and <code className="font-mono">SMTP_PASS</code> (or <code className="font-mono">RESEND_API_KEY</code>) in AI Studio Secrets to deliver verification OTP emails.
            </div>
          </div>
        )}

        {/* Error & Info Banners */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* SCREEN 1: Register / Open Account */}
        {screen === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'bn'
                ? 'আপনার ইমেইল দিয়ে অ্যাকাউন্ট খুলুন। আমরা আপনার ইমেইলে ৬ সংখ্যার OTP কোড পাঠাব।'
                : 'Open a free WorkerHub account with your email. All time cards, salary settings, CV, documents, and finances save securely under your verified account.'}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'} *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  minLength={2}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'bn' ? 'পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)' : 'Password (min 8 characters)'} *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{language === 'bn' ? 'ইমেইলে OTP পাঠান' : 'Send Verification OTP to Email'}</span>
            </button>
          </form>
        )}

        {/* SCREEN 2: Verify Registration OTP */}
        {screen === 'verify_registration' && (
          <form onSubmit={handleVerifyRegistration} className="space-y-4">
            <button
              type="button"
              onClick={() => setScreen('register')}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'bn' ? 'OTP কোড যাচাই করুন' : 'Enter Email Verification OTP'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                We sent a 6-digit verification code to <strong>{email}</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                6-Digit OTP Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full pl-9 pr-3 py-2 text-sm font-mono tracking-widest rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{language === 'bn' ? 'যাচাই ও অ্যাকাউন্ট সক্রিয় করুন' : 'Verify & Activate Account'}</span>
            </button>

            <div className="text-center">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleResendOtp('verify_account')}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                Resend OTP Code
              </button>
            </div>
          </form>
        )}

        {/* SCREEN 3: Sign In with Password */}
        {screen === 'login_password' && (
          <form onSubmit={handleLoginPassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setScreen('forgot_request');
                    setError(null);
                    setInfoMessage(null);
                  }}
                  className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Sign In</span>
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setScreen('login_otp_request');
                  setError(null);
                  setInfoMessage(null);
                }}
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400"
              >
                Or Sign In with Email OTP Code →
              </button>
            </div>
          </form>
        )}

        {/* SCREEN 4: Request Login OTP */}
        {screen === 'login_otp_request' && (
          <form onSubmit={handleRequestLoginOtp} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your verified email address to receive a one-time login code.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Send Login OTP</span>
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setScreen('login_password')}
                className="text-xs font-semibold text-slate-500 hover:underline"
              >
                Sign In with Password instead
              </button>
            </div>
          </form>
        )}

        {/* SCREEN 5: Verify Login OTP */}
        {screen === 'login_otp_verify' && (
          <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
            <button
              type="button"
              onClick={() => setScreen('login_otp_request')}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <p className="text-xs text-slate-500">
              Enter the 6-digit login code sent to <strong>{email}</strong>.
            </p>

            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full px-3 py-2 text-sm font-mono tracking-widest text-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Verify & Sign In</span>
            </button>
          </form>
        )}

        {/* SCREEN 6: Forgot Password Request */}
        {screen === 'forgot_request' && (
          <form onSubmit={handleRequestResetOtp} className="space-y-4">
            <button
              type="button"
              onClick={() => setScreen('login_password')}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reset Password</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your verified email to receive a password reset OTP.
              </p>
            </div>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Send Reset OTP</span>
            </button>
          </form>
        )}

        {/* SCREEN 7: Verify Reset Password OTP */}
        {screen === 'forgot_verify' && (
          <form onSubmit={handleConfirmReset} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full px-3 py-2 text-sm font-mono tracking-widest rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password (min 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Update Password</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
