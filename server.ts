import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { db } from './server/db.ts';
import { getEmailConfigStatus, sendOtpEmail } from './server/email.ts';

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'worker' | 'admin';
  emailVerified: boolean;
}

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  sessionTokenHash?: string;
}

const PORT = 3000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_COOLDOWN_MS = 45 * 1000; // 45 seconds between resends
const MAX_OTP_ATTEMPTS = 5;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ALLOWED_MIME_PREFIXES = [
  'data:image/png;base64,',
  'data:image/jpeg;base64,',
  'data:image/jpg;base64,',
  'data:image/webp;base64,',
  'data:application/pdf;base64,',
];

function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function hashSecret(value: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(value, salt, 64).toString('hex');
  return { hash: derived, salt };
}

function verifySecret(value: string, storedHash: string, salt: string): boolean {
  const { hash } = hashSecret(value, salt);
  const bufA = Buffer.from(hash, 'hex');
  const bufB = Buffer.from(storedHash, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function resolveUserRole(email: string): 'worker' | 'admin' {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
  if (adminEmail && email === adminEmail) {
    return 'admin';
  }
  return 'worker';
}

function createSessionForUser(userId: string): { token: string; expiresAt: number } {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = sha256(token);
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;

  db.prepare(
    'INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).run(tokenHash, userId, expiresAt, now);

  return { token, expiresAt };
}

function issueOtpForEmail(
  email: string,
  purpose: 'verify_account' | 'login' | 'reset_password'
): { otpCode: string } | { error: string; retryAfterSec?: number } {
  const now = Date.now();
  const recent = db
    .prepare(
      'SELECT created_at FROM otp_codes WHERE email = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1'
    )
    .get(email, purpose) as { created_at: number } | undefined;

  if (recent && now - recent.created_at < OTP_COOLDOWN_MS) {
    const retryAfterSec = Math.ceil((OTP_COOLDOWN_MS - (now - recent.created_at)) / 1000);
    return {
      error: `Please wait ${retryAfterSec} seconds before requesting another verification code.`,
      retryAfterSec,
    };
  }

  // Clear older OTPs for the same email & purpose
  db.prepare('DELETE FROM otp_codes WHERE email = ? AND purpose = ?').run(email, purpose);

  const otpCode = String(crypto.randomInt(100000, 1000000));
  const { hash, salt } = hashSecret(otpCode);

  db.prepare(
    `INSERT INTO otp_codes (id, email, purpose, otp_hash, otp_salt, attempts, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`
  ).run(crypto.randomUUID(), email, purpose, hash, salt, now + OTP_TTL_MS, now);

  return { otpCode };
}

function verifyOtpRecord(
  email: string,
  purpose: 'verify_account' | 'login' | 'reset_password',
  otpInput: string
): { valid: true } | { valid: false; error: string } {
  const cleanOtp = typeof otpInput === 'string' ? otpInput.trim() : '';
  if (!/^\d{6}$/.test(cleanOtp)) {
    return { valid: false, error: 'Please enter the 6-digit numeric verification code.' };
  }

  const record = db
    .prepare(
      'SELECT id, otp_hash, otp_salt, attempts, expires_at FROM otp_codes WHERE email = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1'
    )
    .get(email, purpose) as
    | {
        id: string;
        otp_hash: string;
        otp_salt: string;
        attempts: number;
        expires_at: number;
      }
    | undefined;

  if (!record) {
    return { valid: false, error: 'No active verification code found. Please request a new code.' };
  }

  if (Date.now() > record.expires_at) {
    db.prepare('DELETE FROM otp_codes WHERE id = ?').run(record.id);
    return { valid: false, error: 'Verification code has expired. Please request a new code.' };
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    db.prepare('DELETE FROM otp_codes WHERE id = ?').run(record.id);
    return { valid: false, error: 'Too many invalid attempts. Please request a new verification code.' };
  }

  const matches = verifySecret(cleanOtp, record.otp_hash, record.otp_salt);
  if (!matches) {
    db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?').run(record.id);
    const remaining = MAX_OTP_ATTEMPTS - (record.attempts + 1);
    return {
      valid: false,
      error:
        remaining > 0
          ? `Incorrect verification code. ${remaining} attempts remaining.`
          : 'Too many invalid attempts. Please request a new verification code.',
    };
  }

  db.prepare('DELETE FROM otp_codes WHERE id = ?').run(record.id);
  return { valid: true };
}

function extractBearerUser(req: AuthenticatedRequest): AuthUser | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  if (!token) return null;

  const tokenHash = sha256(token);
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.full_name, u.role, u.email_verified, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .get(tokenHash) as
    | {
        id: string;
        email: string;
        full_name: string;
        role: 'worker' | 'admin';
        email_verified: number;
        expires_at: number;
      }
    | undefined;

  if (!row) return null;
  if (Date.now() > row.expires_at) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
    return null;
  }

  req.sessionTokenHash = tokenHash;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    emailVerified: row.email_verified === 1,
  };
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = extractBearerUser(req);
  if (!user || !user.emailVerified) {
    res.status(401).json({ error: 'Authentication required. Please sign in with your verified email.' });
    return;
  }
  req.user = user;
  next();
}

function loadUserDataBundle(userId: string) {
  const shifts = db
    .prepare(
      `SELECT id, date, company_name AS companyName, worksite_name AS worksiteName,
              start_time AS startTime, end_time AS endTime,
              break_duration_minutes AS breakDurationMinutes,
              normal_hours AS normalHours, ot_hours AS otHours,
              total_working_hours AS totalWorkingHours, work_status AS workStatus,
              daily_notes AS dailyNotes, created_at AS createdAt, updated_at AS updatedAt
       FROM user_shifts WHERE user_id = ? ORDER BY date DESC`
    )
    .all(userId);

  const documents = db
    .prepare(
      `SELECT id, name, category, issue_date AS issueDate, expiry_date AS expiryDate,
              notes, file_name AS fileName, file_data_url AS fileDataUrl,
              file_size_kb AS fileSizeKb, created_at AS createdAt
       FROM user_documents WHERE user_id = ? ORDER BY created_at DESC`
    )
    .all(userId);

  const historyRows = db
    .prepare(
      `SELECT id, company_name AS companyName, job_title AS jobTitle,
              start_date AS startDate, end_date AS endDate, is_current AS isCurrent,
              basic_salary AS basicSalary, worksite, responsibilities,
              reason_for_leaving AS reasonForLeaving, notes
       FROM user_company_history WHERE user_id = ? ORDER BY start_date DESC`
    )
    .all(userId) as Array<Record<string, unknown>>;

  const companyHistory = historyRows.map((h) => ({
    ...h,
    isCurrent: h.isCurrent === 1,
  }));

  const finance = db
    .prepare(
      `SELECT id, type, category, amount_sgd AS amountSgd, amount_foreign AS amountForeign,
              foreign_currency AS foreignCurrency, exchange_rate AS exchangeRate,
              date, notes, created_at AS createdAt
       FROM user_finance WHERE user_id = ? ORDER BY date DESC`
    )
    .all(userId);

  const profileRow = db
    .prepare(
      `SELECT salary_settings_json, cv_json, savings_goal_json, dashboard_config_json
       FROM user_profiles_json WHERE user_id = ?`
    )
    .get(userId) as
    | {
        salary_settings_json: string | null;
        cv_json: string | null;
        savings_goal_json: string | null;
        dashboard_config_json: string | null;
      }
    | undefined;

  const parseJson = (raw: string | null | undefined) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  return {
    shifts,
    documents,
    companyHistory,
    finance,
    salarySettings: parseJson(profileRow?.salary_settings_json),
    cv: parseJson(profileRow?.cv_json),
    savingsGoal: parseJson(profileRow?.savings_goal_json),
    dashboardConfig: parseJson(profileRow?.dashboard_config_json),
  };
}

function upsertProfileField(
  userId: string,
  column: 'salary_settings_json' | 'cv_json' | 'savings_goal_json' | 'dashboard_config_json',
  payload: unknown
) {
  const now = Date.now();
  const serialized = JSON.stringify(payload);
  db.prepare(
    `INSERT INTO user_profiles_json (user_id, ${column}, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET ${column} = excluded.${column}, updated_at = excluded.updated_at`
  ).run(userId, serialized, now);
}

function validateFileDataUrl(fileDataUrl: unknown): string {
  if (typeof fileDataUrl !== 'string' || !fileDataUrl) return '';
  if (fileDataUrl.length > 3 * 1024 * 1024) {
    throw new Error('Attached file exceeds maximum allowed size (2MB).');
  }
  const hasAllowedMime = ALLOWED_MIME_PREFIXES.some((prefix) => fileDataUrl.startsWith(prefix));
  if (!hasAllowedMime) {
    throw new Error('Only PNG, JPEG, WEBP images or PDF files are allowed.');
  }
  return fileDataUrl;
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '6mb' }));

  // ==========================================
  // 1. AUTH & EMAIL OTP ENDPOINTS
  // ==========================================

  app.get('/api/auth/status', (_req, res) => {
    res.json(getEmailConfigStatus());
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  // Open an account (Step 1: register details & send 6-digit OTP to email)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const email = normalizeEmail(req.body?.email);
      const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (!EMAIL_REGEX.test(email)) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }
      if (fullName.length < 2 || fullName.length > 80) {
        res.status(400).json({ error: 'Please enter your full name (2–80 characters).' });
        return;
      }
      if (password.length < 8 || password.length > 128) {
        res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        return;
      }

      const emailConfig = getEmailConfigStatus();
      if (!emailConfig.emailConfigured) {
        res.status(503).json({
          error:
            'Email service is not configured yet. Set SMTP_USER and SMTP_PASS (or RESEND_API_KEY) in Secrets to send OTP verification emails.',
        });
        return;
      }

      const existing = db
        .prepare('SELECT id, email_verified FROM users WHERE email = ?')
        .get(email) as { id: string; email_verified: number } | undefined;

      if (existing && existing.email_verified === 1) {
        res.status(409).json({
          error: 'An account with this email already exists. Please sign in instead.',
        });
        return;
      }

      const otpResult = issueOtpForEmail(email, 'verify_account');
      if ('error' in otpResult) {
        res.status(429).json({ error: otpResult.error });
        return;
      }

      const { hash, salt } = hashSecret(password);
      const now = Date.now();

      if (existing) {
        db.prepare(
          'UPDATE users SET full_name = ?, password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?'
        ).run(fullName, hash, salt, now, existing.id);
      } else {
        db.prepare(
          `INSERT INTO users (id, email, full_name, password_hash, password_salt, email_verified, role, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 0, 'worker', ?, ?)`
        ).run(crypto.randomUUID(), email, fullName, hash, salt, now, now);
      }

      await sendOtpEmail({
        toEmail: email,
        recipientName: fullName,
        otpCode: otpResult.otpCode,
        purpose: 'verify_account',
      });

      res.json({
        sent: true,
        message: `A 6-digit verification code has been sent to ${email}.`,
      });
    } catch (err: unknown) {
      res.status(500).json({
        error: (err as Error).message || 'Failed to send verification code.',
      });
    }
  });

  // Verify account opening OTP (Step 2: verify OTP -> activate account & issue Bearer session)
  app.post('/api/auth/verify-registration', (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const otp = req.body?.otp;

    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: 'Invalid email address.' });
      return;
    }

    const user = db
      .prepare('SELECT id, email, full_name, email_verified FROM users WHERE email = ?')
      .get(email) as
      | { id: string; email: string; full_name: string; email_verified: number }
      | undefined;

    if (!user) {
      res.status(404).json({ error: 'Registration record not found. Please open an account again.' });
      return;
    }

    const verification = verifyOtpRecord(email, 'verify_account', otp);
    if (!verification.valid) {
      res.status(400).json({ error: verification.error });
      return;
    }

    const role = resolveUserRole(email);
    db.prepare('UPDATE users SET email_verified = 1, role = ?, updated_at = ? WHERE id = ?').run(
      role,
      Date.now(),
      user.id
    );

    const session = createSessionForUser(user.id);
    const data = loadUserDataBundle(user.id);

    res.json({
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role,
        emailVerified: true,
      },
      data,
    });
  });

  // Resend registration or login OTP
  app.post('/api/auth/send-otp', async (req, res) => {
    try {
      const email = normalizeEmail(req.body?.email);
      const purpose =
        req.body?.purpose === 'verify_account' || req.body?.purpose === 'reset_password'
          ? req.body.purpose
          : 'login';

      if (!EMAIL_REGEX.test(email)) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }

      const emailConfig = getEmailConfigStatus();
      if (!emailConfig.emailConfigured) {
        res.status(503).json({
          error:
            'Email service is not configured yet. Set SMTP_USER and SMTP_PASS (or RESEND_API_KEY) in Secrets to send OTP verification emails.',
        });
        return;
      }

      const user = db
        .prepare('SELECT id, full_name, email_verified FROM users WHERE email = ?')
        .get(email) as { id: string; full_name: string; email_verified: number } | undefined;

      if (!user) {
        res.status(404).json({ error: 'No account found with this email. Please open an account first.' });
        return;
      }

      if ((purpose === 'login' || purpose === 'reset_password') && user.email_verified !== 1) {
        res.status(403).json({
          error: 'This email is not verified yet. Please complete account verification first.',
        });
        return;
      }

      const otpResult = issueOtpForEmail(email, purpose);
      if ('error' in otpResult) {
        res.status(429).json({ error: otpResult.error });
        return;
      }

      await sendOtpEmail({
        toEmail: email,
        recipientName: user.full_name,
        otpCode: otpResult.otpCode,
        purpose,
      });

      res.json({
        sent: true,
        message: `Verification code sent to ${email}.`,
      });
    } catch (err: unknown) {
      res.status(500).json({
        error: (err as Error).message || 'Failed to send verification email.',
      });
    }
  });

  // Sign in with Email + Password
  app.post('/api/auth/login', (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!EMAIL_REGEX.test(email) || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = db
      .prepare(
        'SELECT id, email, full_name, password_hash, password_salt, email_verified, role FROM users WHERE email = ?'
      )
      .get(email) as
      | {
          id: string;
          email: string;
          full_name: string;
          password_hash: string;
          password_salt: string;
          email_verified: number;
          role: 'worker' | 'admin';
        }
      | undefined;

    if (!user || !verifySecret(password, user.password_hash, user.password_salt)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.email_verified !== 1) {
      res.status(403).json({
        error: 'Your email has not been verified yet. Please verify your OTP code first.',
        needsVerification: true,
      });
      return;
    }

    const role = resolveUserRole(email);
    if (role !== user.role) {
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, user.id);
    }

    const session = createSessionForUser(user.id);
    const data = loadUserDataBundle(user.id);

    res.json({
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role,
        emailVerified: true,
      },
      data,
    });
  });

  // Sign in with Email + OTP (passwordless login)
  app.post('/api/auth/login-otp', (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const otp = req.body?.otp;

    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: 'Invalid email address.' });
      return;
    }

    const user = db
      .prepare('SELECT id, email, full_name, email_verified, role FROM users WHERE email = ?')
      .get(email) as
      | { id: string; email: string; full_name: string; email_verified: number; role: 'worker' | 'admin' }
      | undefined;

    if (!user || user.email_verified !== 1) {
      res.status(404).json({ error: 'Verified account not found for this email.' });
      return;
    }

    const verification = verifyOtpRecord(email, 'login', otp);
    if (!verification.valid) {
      res.status(400).json({ error: verification.error });
      return;
    }

    const role = resolveUserRole(email);
    if (role !== user.role) {
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, user.id);
    }

    const session = createSessionForUser(user.id);
    const data = loadUserDataBundle(user.id);

    res.json({
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role,
        emailVerified: true,
      },
      data,
    });
  });

  // Reset Password using Email OTP
  app.post('/api/auth/reset-password', (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const otp = req.body?.otp;
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: 'Invalid email address.' });
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      return;
    }

    const user = db
      .prepare('SELECT id, email_verified FROM users WHERE email = ?')
      .get(email) as { id: string; email_verified: number } | undefined;

    if (!user || user.email_verified !== 1) {
      res.status(404).json({ error: 'Verified account not found.' });
      return;
    }

    const verification = verifyOtpRecord(email, 'reset_password', otp);
    if (!verification.valid) {
      res.status(400).json({ error: verification.error });
      return;
    }

    const { hash, salt } = hashSecret(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?').run(
      hash,
      salt,
      Date.now(),
      user.id
    );
    // Invalidate existing sessions on password reset
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);

    res.json({ success: true, message: 'Password updated successfully. Please sign in.' });
  });

  // Sign out
  app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.sessionTokenHash) {
      db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(req.sessionTokenHash);
    }
    res.json({ success: true });
  });

  // Delete account and all cloud records
  app.delete('/api/auth/account', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    res.json({ success: true });
  });

  // ==========================================
  // 2. USER ACCOUNT DATA SYNC ENDPOINTS
  // ==========================================

  app.get('/api/account/data', requireAuth, (req: AuthenticatedRequest, res) => {
    const data = loadUserDataBundle(req.user!.id);
    res.json({ data });
  });

  // Explicit user-approved import of local records into account
  app.post('/api/account/import-local', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const body = req.body || {};

      if (Array.isArray(body.shifts)) {
        const stmt = db.prepare(
          `INSERT INTO user_shifts (
             id, user_id, date, company_name, worksite_name, start_time, end_time,
             break_duration_minutes, normal_hours, ot_hours, total_working_hours,
             work_status, daily_notes, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id, id) DO UPDATE SET
             date = excluded.date, company_name = excluded.company_name,
             worksite_name = excluded.worksite_name, start_time = excluded.start_time,
             end_time = excluded.end_time, break_duration_minutes = excluded.break_duration_minutes,
             normal_hours = excluded.normal_hours, ot_hours = excluded.ot_hours,
             total_working_hours = excluded.total_working_hours, work_status = excluded.work_status,
             daily_notes = excluded.daily_notes, updated_at = excluded.updated_at`
        );
        for (const s of body.shifts.slice(0, 1000)) {
          if (!s?.id || !s?.date) continue;
          stmt.run(
            String(s.id),
            userId,
            String(s.date),
            String(s.companyName || ''),
            String(s.worksiteName || ''),
            String(s.startTime || ''),
            String(s.endTime || ''),
            Number(s.breakDurationMinutes) || 0,
            Number(s.normalHours) || 0,
            Number(s.otHours) || 0,
            Number(s.totalWorkingHours) || 0,
            String(s.workStatus || 'normal'),
            String(s.dailyNotes || ''),
            Number(s.createdAt) || Date.now(),
            Number(s.updatedAt) || Date.now()
          );
        }
      }

      if (Array.isArray(body.documents)) {
        const stmt = db.prepare(
          `INSERT INTO user_documents (
             id, user_id, name, category, issue_date, expiry_date, notes,
             file_name, file_data_url, file_size_kb, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id, id) DO UPDATE SET
             name = excluded.name, category = excluded.category,
             issue_date = excluded.issue_date, expiry_date = excluded.expiry_date,
             notes = excluded.notes, file_name = excluded.file_name,
             file_data_url = excluded.file_data_url, file_size_kb = excluded.file_size_kb`
        );
        for (const d of body.documents.slice(0, 100)) {
          if (!d?.id || !d?.name) continue;
          const safeDataUrl = validateFileDataUrl(d.fileDataUrl);
          stmt.run(
            String(d.id),
            userId,
            String(d.name),
            String(d.category || 'other'),
            String(d.issueDate || ''),
            String(d.expiryDate || ''),
            String(d.notes || ''),
            String(d.fileName || ''),
            safeDataUrl,
            Number(d.fileSizeKb) || 0,
            Number(d.createdAt) || Date.now()
          );
        }
      }

      if (Array.isArray(body.companyHistory)) {
        const stmt = db.prepare(
          `INSERT INTO user_company_history (
             id, user_id, company_name, job_title, start_date, end_date,
             is_current, basic_salary, worksite, responsibilities, reason_for_leaving, notes
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id, id) DO UPDATE SET
             company_name = excluded.company_name, job_title = excluded.job_title,
             start_date = excluded.start_date, end_date = excluded.end_date,
             is_current = excluded.is_current, basic_salary = excluded.basic_salary,
             worksite = excluded.worksite, responsibilities = excluded.responsibilities,
             reason_for_leaving = excluded.reason_for_leaving, notes = excluded.notes`
        );
        for (const h of body.companyHistory.slice(0, 100)) {
          if (!h?.id || !h?.companyName) continue;
          stmt.run(
            String(h.id),
            userId,
            String(h.companyName),
            String(h.jobTitle || ''),
            String(h.startDate || ''),
            String(h.endDate || ''),
            h.isCurrent ? 1 : 0,
            Number(h.basicSalary) || 0,
            String(h.worksite || ''),
            String(h.responsibilities || ''),
            String(h.reasonForLeaving || ''),
            String(h.notes || '')
          );
        }
      }

      if (Array.isArray(body.finance)) {
        const stmt = db.prepare(
          `INSERT INTO user_finance (
             id, user_id, type, category, amount_sgd, amount_foreign,
             foreign_currency, exchange_rate, date, notes, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id, id) DO UPDATE SET
             type = excluded.type, category = excluded.category,
             amount_sgd = excluded.amount_sgd, amount_foreign = excluded.amount_foreign,
             foreign_currency = excluded.foreign_currency, exchange_rate = excluded.exchange_rate,
             date = excluded.date, notes = excluded.notes`
        );
        for (const f of body.finance.slice(0, 1000)) {
          if (!f?.id || !f?.date) continue;
          stmt.run(
            String(f.id),
            userId,
            String(f.type || 'expense'),
            String(f.category || 'other'),
            Number(f.amountSgd) || 0,
            f.amountForeign != null ? Number(f.amountForeign) : null,
            f.foreignCurrency ? String(f.foreignCurrency) : null,
            f.exchangeRate != null ? Number(f.exchangeRate) : null,
            String(f.date),
            String(f.notes || ''),
            Number(f.createdAt) || Date.now()
          );
        }
      }

      if (body.salarySettings) {
        upsertProfileField(userId, 'salary_settings_json', body.salarySettings);
      }
      if (body.cv) {
        upsertProfileField(userId, 'cv_json', body.cv);
      }
      if (body.savingsGoal) {
        upsertProfileField(userId, 'savings_goal_json', body.savingsGoal);
      }
      if (body.dashboardConfig) {
        upsertProfileField(userId, 'dashboard_config_json', body.dashboardConfig);
      }

      res.json({ data: loadUserDataBundle(userId) });
    } catch (err: unknown) {
      res.status(400).json({ error: (err as Error).message || 'Failed to import local records.' });
    }
  });

  // Shifts CRUD
  app.post('/api/account/shifts', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const s = req.body;
    if (!s?.id || !s?.date) {
      res.status(400).json({ error: 'Shift id and date are required.' });
      return;
    }

    db.prepare(
      `INSERT INTO user_shifts (
         id, user_id, date, company_name, worksite_name, start_time, end_time,
         break_duration_minutes, normal_hours, ot_hours, total_working_hours,
         work_status, daily_notes, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, id) DO UPDATE SET
         date = excluded.date, company_name = excluded.company_name,
         worksite_name = excluded.worksite_name, start_time = excluded.start_time,
         end_time = excluded.end_time, break_duration_minutes = excluded.break_duration_minutes,
         normal_hours = excluded.normal_hours, ot_hours = excluded.ot_hours,
         total_working_hours = excluded.total_working_hours, work_status = excluded.work_status,
         daily_notes = excluded.daily_notes, updated_at = excluded.updated_at`
    ).run(
      String(s.id),
      userId,
      String(s.date),
      String(s.companyName || ''),
      String(s.worksiteName || ''),
      String(s.startTime || ''),
      String(s.endTime || ''),
      Number(s.breakDurationMinutes) || 0,
      Number(s.normalHours) || 0,
      Number(s.otHours) || 0,
      Number(s.totalWorkingHours) || 0,
      String(s.workStatus || 'normal'),
      String(s.dailyNotes || ''),
      Number(s.createdAt) || Date.now(),
      Date.now()
    );
    res.json({ success: true });
  });

  app.delete('/api/account/shifts/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    db.prepare('DELETE FROM user_shifts WHERE user_id = ? AND id = ?').run(
      req.user!.id,
      req.params.id
    );
    res.json({ success: true });
  });

  // Documents CRUD
  app.post('/api/account/documents', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const d = req.body;
      if (!d?.id || !d?.name) {
        res.status(400).json({ error: 'Document id and name are required.' });
        return;
      }

      const safeDataUrl = validateFileDataUrl(d.fileDataUrl);

      db.prepare(
        `INSERT INTO user_documents (
           id, user_id, name, category, issue_date, expiry_date, notes,
           file_name, file_data_url, file_size_kb, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, id) DO UPDATE SET
           name = excluded.name, category = excluded.category,
           issue_date = excluded.issue_date, expiry_date = excluded.expiry_date,
           notes = excluded.notes, file_name = excluded.file_name,
           file_data_url = excluded.file_data_url, file_size_kb = excluded.file_size_kb`
      ).run(
        String(d.id),
        userId,
        String(d.name),
        String(d.category || 'other'),
        String(d.issueDate || ''),
        String(d.expiryDate || ''),
        String(d.notes || ''),
        String(d.fileName || ''),
        safeDataUrl,
        Number(d.fileSizeKb) || 0,
        Number(d.createdAt) || Date.now()
      );
      res.json({ success: true });
    } catch (err: unknown) {
      res.status(400).json({ error: (err as Error).message || 'Invalid document payload.' });
    }
  });

  app.delete('/api/account/documents/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    db.prepare('DELETE FROM user_documents WHERE user_id = ? AND id = ?').run(
      req.user!.id,
      req.params.id
    );
    res.json({ success: true });
  });

  // Company History CRUD
  app.post('/api/account/history', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const h = req.body;
    if (!h?.id || !h?.companyName) {
      res.status(400).json({ error: 'History id and company name are required.' });
      return;
    }

    db.prepare(
      `INSERT INTO user_company_history (
         id, user_id, company_name, job_title, start_date, end_date,
         is_current, basic_salary, worksite, responsibilities, reason_for_leaving, notes
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, id) DO UPDATE SET
         company_name = excluded.company_name, job_title = excluded.job_title,
         start_date = excluded.start_date, end_date = excluded.end_date,
         is_current = excluded.is_current, basic_salary = excluded.basic_salary,
         worksite = excluded.worksite, responsibilities = excluded.responsibilities,
         reason_for_leaving = excluded.reason_for_leaving, notes = excluded.notes`
    ).run(
      String(h.id),
      userId,
      String(h.companyName),
      String(h.jobTitle || ''),
      String(h.startDate || ''),
      String(h.endDate || ''),
      h.isCurrent ? 1 : 0,
      Number(h.basicSalary) || 0,
      String(h.worksite || ''),
      String(h.responsibilities || ''),
      String(h.reasonForLeaving || ''),
      String(h.notes || '')
    );
    res.json({ success: true });
  });

  app.delete('/api/account/history/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    db.prepare('DELETE FROM user_company_history WHERE user_id = ? AND id = ?').run(
      req.user!.id,
      req.params.id
    );
    res.json({ success: true });
  });

  // Finance CRUD
  app.post('/api/account/finance', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const f = req.body;
    if (!f?.id || !f?.date) {
      res.status(400).json({ error: 'Transaction id and date are required.' });
      return;
    }

    db.prepare(
      `INSERT INTO user_finance (
         id, user_id, type, category, amount_sgd, amount_foreign,
         foreign_currency, exchange_rate, date, notes, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, id) DO UPDATE SET
         type = excluded.type, category = excluded.category,
         amount_sgd = excluded.amount_sgd, amount_foreign = excluded.amount_foreign,
         foreign_currency = excluded.foreign_currency, exchange_rate = excluded.exchange_rate,
         date = excluded.date, notes = excluded.notes`
    ).run(
      String(f.id),
      userId,
      String(f.type || 'expense'),
      String(f.category || 'other'),
      Number(f.amountSgd) || 0,
      f.amountForeign != null ? Number(f.amountForeign) : null,
      f.foreignCurrency ? String(f.foreignCurrency) : null,
      f.exchangeRate != null ? Number(f.exchangeRate) : null,
      String(f.date),
      String(f.notes || ''),
      Number(f.createdAt) || Date.now()
    );
    res.json({ success: true });
  });

  app.delete('/api/account/finance/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    db.prepare('DELETE FROM user_finance WHERE user_id = ? AND id = ?').run(
      req.user!.id,
      req.params.id
    );
    res.json({ success: true });
  });

  // JSON Profile Settings (Salary settings, CV, Savings goal, Dashboard config)
  app.put('/api/account/salary-settings', requireAuth, (req: AuthenticatedRequest, res) => {
    upsertProfileField(req.user!.id, 'salary_settings_json', req.body);
    res.json({ success: true });
  });

  app.put('/api/account/cv', requireAuth, (req: AuthenticatedRequest, res) => {
    upsertProfileField(req.user!.id, 'cv_json', req.body);
    res.json({ success: true });
  });

  app.put('/api/account/savings', requireAuth, (req: AuthenticatedRequest, res) => {
    upsertProfileField(req.user!.id, 'savings_goal_json', req.body);
    res.json({ success: true });
  });

  app.put('/api/account/dashboard-config', requireAuth, (req: AuthenticatedRequest, res) => {
    upsertProfileField(req.user!.id, 'dashboard_config_json', req.body);
    res.json({ success: true });
  });

  // ==========================================
  // 3. MODERATED COMPANY REVIEWS ENDPOINTS
  // ==========================================

  app.get('/api/reviews', (req: AuthenticatedRequest, res) => {
    const user = extractBearerUser(req);
    const isAdmin = user?.role === 'admin';

    const rows = isAdmin
      ? db
          .prepare(
            `SELECT id, company_name AS companyName, industry,
                    rating_work_env AS ratingWorkEnv, rating_salary_payment AS ratingSalaryPayment,
                    rating_accommodation AS ratingAccommodation, rating_management AS ratingManagement,
                    title, comment, employment_status AS employmentStatus,
                    status, created_at AS createdAt
             FROM company_reviews ORDER BY created_at DESC`
          )
          .all()
      : db
          .prepare(
            `SELECT id, company_name AS companyName, industry,
                    rating_work_env AS ratingWorkEnv, rating_salary_payment AS ratingSalaryPayment,
                    rating_accommodation AS ratingAccommodation, rating_management AS ratingManagement,
                    title, comment, employment_status AS employmentStatus,
                    status, created_at AS createdAt
             FROM company_reviews WHERE status = 'approved' ORDER BY created_at DESC`
          )
          .all();

    res.json({ reviews: rows, isAdmin });
  });

  app.post('/api/reviews', requireAuth, (req: AuthenticatedRequest, res) => {
    const r = req.body;
    const companyName = typeof r?.companyName === 'string' ? r.companyName.trim() : '';
    const comment = typeof r?.comment === 'string' ? r.comment.trim() : '';

    if (!companyName || !comment) {
      res.status(400).json({ error: 'Company name and experience comment are required.' });
      return;
    }

    const id = crypto.randomUUID();
    const now = Date.now();

    // Always force 'pending' status — never auto-publish
    db.prepare(
      `INSERT INTO company_reviews (
         id, user_id, company_name, industry, rating_work_env, rating_salary_payment,
         rating_accommodation, rating_management, title, comment, employment_status,
         status, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
    ).run(
      id,
      req.user!.id,
      companyName.slice(0, 120),
      String(r.industry || 'Other').slice(0, 60),
      Math.min(5, Math.max(1, Number(r.ratingWorkEnv) || 4)),
      Math.min(5, Math.max(1, Number(r.ratingSalaryPayment) || 4)),
      Math.min(5, Math.max(1, Number(r.ratingAccommodation) || 4)),
      Math.min(5, Math.max(1, Number(r.ratingManagement) || 4)),
      String(r.title || '').trim().slice(0, 140),
      comment.slice(0, 1500),
      r.employmentStatus === 'Former Worker' ? 'Former Worker' : 'Current Worker',
      now
    );

    res.json({ success: true, id });
  });

  app.post('/api/reviews/:id/report', requireAuth, (req: AuthenticatedRequest, res) => {
    db.prepare("UPDATE company_reviews SET status = 'flagged' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.patch('/api/reviews/:id/moderate', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Administrator permission required to moderate reviews.' });
      return;
    }
    const status = req.body?.status === 'approved' ? 'approved' : 'flagged';
    db.prepare('UPDATE company_reviews SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/reviews/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.user?.role === 'admin') {
      db.prepare('DELETE FROM company_reviews WHERE id = ?').run(req.params.id);
    } else {
      db.prepare('DELETE FROM company_reviews WHERE id = ? AND user_id = ?').run(
        req.params.id,
        req.user!.id
      );
    }
    res.json({ success: true });
  });

  // ==========================================
  // 4. VITE DEV MIDDLEWARE OR PRODUCTION STATIC
  // ==========================================
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WorkerHub server listening on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start WorkerHub server:', err);
  process.exit(1);
});
