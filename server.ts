import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { db } from './server/db.ts';
import { searchSingaporeCompanies, searchWorkerHelpArticles } from './server/gemini.ts';

interface DeviceUser {
  id: string;
  displayName: string;
  role: 'worker' | 'admin';
  createdAt: number;
}

interface AuthenticatedRequest extends Request {
  user?: DeviceUser;
  sessionTokenHash?: string;
}

const PORT = 3000;
const SESSION_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
const MAX_DOC_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_PREFIXES = [
  'data:image/png;base64,',
  'data:image/jpeg;base64,',
  'data:image/jpg;base64,',
  'data:image/webp;base64,',
  'data:application/pdf;base64,',
];

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function generateUniqueUserId(): string {
  for (let i = 0; i < 20; i++) {
    const candidate = String(crypto.randomInt(10000000, 100000000));
    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(candidate);
    if (!existing) return candidate;
  }
  return String(Date.now()).slice(-8);
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

function extractBearerUser(req: AuthenticatedRequest): DeviceUser | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  if (!token) return null;

  const tokenHash = sha256(token);
  const row = db
    .prepare(
      `SELECT u.id, u.display_name, u.role, u.created_at, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .get(tokenHash) as
    | {
        id: string;
        display_name: string;
        role: 'worker' | 'admin';
        created_at: number;
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
    displayName: row.display_name,
    role: row.role,
    createdAt: row.created_at,
  };
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = extractBearerUser(req);
  if (!user) {
    res.status(401).json({ error: 'Device session expired. Reconnecting with your User ID.' });
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
      `SELECT id, type, category, account_id AS accountId, account_name AS accountName,
              amount_sgd AS amountSgd, amount_foreign AS amountForeign,
              foreign_currency AS foreignCurrency, exchange_rate AS exchangeRate,
              date, notes, created_at AS createdAt
       FROM user_finance WHERE user_id = ? ORDER BY date DESC`
    )
    .all(userId);

  const profileRow = db
    .prepare(
      `SELECT salary_settings_json, cv_json, savings_goal_json, money_accounts_json, dashboard_config_json
       FROM user_profiles_json WHERE user_id = ?`
    )
    .get(userId) as
    | {
        salary_settings_json: string | null;
        cv_json: string | null;
        savings_goal_json: string | null;
        money_accounts_json: string | null;
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
    moneyAccounts: parseJson(profileRow?.money_accounts_json),
    dashboardConfig: parseJson(profileRow?.dashboard_config_json),
  };
}

function upsertProfileField(
  userId: string,
  column:
    | 'salary_settings_json'
    | 'cv_json'
    | 'savings_goal_json'
    | 'money_accounts_json'
    | 'dashboard_config_json',
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
  const prefix = ALLOWED_MIME_PREFIXES.find((p) => fileDataUrl.startsWith(p));
  if (!prefix) {
    throw new Error('Only PNG, JPEG, WEBP images or PDF files are allowed.');
  }
  const base64Body = fileDataUrl.slice(prefix.length);
  const estimatedBytes = Math.ceil((base64Body.length * 3) / 4);
  if (estimatedBytes > MAX_DOC_BYTES + 1024) {
    throw new Error('Attached file exceeds maximum allowed size (5MB).');
  }
  return fileDataUrl;
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // ==========================================
  // 1. DEVICE USER ID & CROSS-DEVICE SYNC AUTH
  // ==========================================

  // Auto-generate a unique 8-digit User ID for this device
  app.post('/api/device/init', (req, res) => {
    const requestedName =
      typeof req.body?.displayName === 'string' && req.body.displayName.trim()
        ? req.body.displayName.trim().slice(0, 60)
        : 'Worker';

    const userId = generateUniqueUserId();
    const now = Date.now();

    db.prepare(
      `INSERT INTO users (id, display_name, role, created_at, updated_at)
       VALUES (?, ?, 'worker', ?, ?)`
    ).run(userId, requestedName, now, now);

    const session = createSessionForUser(userId);
    const data = loadUserDataBundle(userId);

    res.json({
      token: session.token,
      user: {
        id: userId,
        displayName: requestedName,
        role: 'worker' as const,
        createdAt: now,
      },
      data,
    });
  });

  // Connect current device to an existing User ID (or auto-restore on reload)
  app.post('/api/device/connect', (req, res) => {
    const rawInput = req.body?.userId != null ? String(req.body.userId) : '';
    const rawId = rawInput
      .trim()
      .replace(/^(?:id\s*:?\s*|#)+/i, '')
      .replace(/[\s-]+/g, '');
    const autoCreateIfMissing = Boolean(req.body?.autoCreateIfMissing);

    if (!/^\d{6,12}$/.test(rawId)) {
      res.status(400).json({ error: 'Please enter a valid numeric User ID (6–12 digits).' });
      return;
    }

    let userRow = db
      .prepare('SELECT id, display_name, role, created_at FROM users WHERE id = ?')
      .get(rawId) as
      | { id: string; display_name: string; role: 'worker' | 'admin'; created_at: number }
      | undefined;

    if (!userRow) {
      if (!autoCreateIfMissing) {
        res.status(404).json({
          error: `User ID "${rawId}" was not found. Please check the number from your other device.`,
        });
        return;
      }
      const now = Date.now();
      db.prepare(
        `INSERT INTO users (id, display_name, role, created_at, updated_at)
         VALUES (?, 'Worker', 'worker', ?, ?)`
      ).run(rawId, now, now);
      userRow = { id: rawId, display_name: 'Worker', role: 'worker', created_at: now };
    }

    const session = createSessionForUser(userRow.id);
    const data = loadUserDataBundle(userRow.id);

    res.json({
      token: session.token,
      user: {
        id: userRow.id,
        displayName: userRow.display_name,
        role: userRow.role,
        createdAt: userRow.created_at,
      },
      data,
    });
  });

  app.get('/api/device/me', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  app.patch('/api/device/profile', requireAuth, (req: AuthenticatedRequest, res) => {
    const displayName =
      typeof req.body?.displayName === 'string' ? req.body.displayName.trim().slice(0, 60) : '';
    if (displayName.length < 2) {
      res.status(400).json({ error: 'Name must be at least 2 characters.' });
      return;
    }
    db.prepare('UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?').run(
      displayName,
      Date.now(),
      req.user!.id
    );
    res.json({
      user: {
        ...req.user!,
        displayName,
      },
    });
  });

  app.delete('/api/device/account', requireAuth, (req: AuthenticatedRequest, res) => {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.user!.id);
    res.json({ success: true });
  });

  // ==========================================
  // 2. USER WORKSPACE DATA SYNC ENDPOINTS
  // ==========================================

  app.get('/api/account/data', requireAuth, (req: AuthenticatedRequest, res) => {
    const data = loadUserDataBundle(req.user!.id);
    res.json({ data });
  });

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
             id, user_id, type, category, account_id, account_name,
             amount_sgd, amount_foreign, foreign_currency, exchange_rate,
             date, notes, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id, id) DO UPDATE SET
             type = excluded.type, category = excluded.category,
             account_id = excluded.account_id, account_name = excluded.account_name,
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
            String(f.accountId || 'acc-cash'),
            String(f.accountName || 'Cash Wallet'),
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
      if (Array.isArray(body.moneyAccounts)) {
        upsertProfileField(userId, 'money_accounts_json', body.moneyAccounts);
      }
      if (body.dashboardConfig) {
        upsertProfileField(userId, 'dashboard_config_json', body.dashboardConfig);
      }

      res.json({ data: loadUserDataBundle(userId) });
    } catch (err: unknown) {
      res.status(400).json({ error: (err as Error).message || 'Failed to import records.' });
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

  // Documents CRUD (up to 5MB)
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

  // Finance CRUD (with money source accountId & accountName)
  app.post('/api/account/finance', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const f = req.body;
    if (!f?.id || !f?.date) {
      res.status(400).json({ error: 'Transaction id and date are required.' });
      return;
    }

    db.prepare(
      `INSERT INTO user_finance (
         id, user_id, type, category, account_id, account_name,
         amount_sgd, amount_foreign, foreign_currency, exchange_rate,
         date, notes, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, id) DO UPDATE SET
         type = excluded.type, category = excluded.category,
         account_id = excluded.account_id, account_name = excluded.account_name,
         amount_sgd = excluded.amount_sgd, amount_foreign = excluded.amount_foreign,
         foreign_currency = excluded.foreign_currency, exchange_rate = excluded.exchange_rate,
         date = excluded.date, notes = excluded.notes`
    ).run(
      String(f.id),
      userId,
      String(f.type || 'expense'),
      String(f.category || 'other'),
      String(f.accountId || 'acc-cash'),
      String(f.accountName || 'Cash Wallet'),
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

  // JSON Profile Settings (Salary, CV, Savings, Money Accounts, Dashboard config)
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

  app.put('/api/account/money-accounts', requireAuth, (req: AuthenticatedRequest, res) => {
    if (!Array.isArray(req.body)) {
      res.status(400).json({ error: 'Money accounts list must be an array.' });
      return;
    }
    upsertProfileField(req.user!.id, 'money_accounts_json', req.body);
    res.json({ success: true });
  });

  app.put('/api/account/dashboard-config', requireAuth, (req: AuthenticatedRequest, res) => {
    upsertProfileField(req.user!.id, 'dashboard_config_json', req.body);
    res.json({ success: true });
  });

  // ==========================================
  // 3. GOOGLE LIVE COMPANY SEARCH & REVIEWS
  // ==========================================

  app.get('/api/companies/search', async (req, res) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      if (q.length < 2) {
        res.status(400).json({ error: 'Enter at least 2 characters to search companies.' });
        return;
      }
      const result = await searchSingaporeCompanies(q.slice(0, 100));
      res.json(result);
    } catch (err: unknown) {
      res.status(502).json({
        error: (err as Error).message || 'Live Google company search failed.',
      });
    }
  });

  app.get('/api/reviews', (req: AuthenticatedRequest, res) => {
    const user = extractBearerUser(req);
    const currentUserId = user?.id || '';

    const rows = db
      .prepare(
        `SELECT r.id, r.user_id AS userId, r.company_name AS companyName, r.industry,
                r.rating_work_env AS ratingWorkEnv, r.rating_salary_payment AS ratingSalaryPayment,
                r.rating_accommodation AS ratingAccommodation, r.rating_management AS ratingManagement,
                r.title, r.comment, r.employment_status AS employmentStatus,
                r.status, r.likes_count AS likesCount, r.google_source_url AS googleSourceUrl,
                r.created_at AS createdAt,
                CASE WHEN rl.user_id IS NOT NULL THEN 1 ELSE 0 END AS likedByMe
         FROM company_reviews r
         LEFT JOIN review_likes rl ON rl.review_id = r.id AND rl.user_id = ?
         WHERE r.status = 'approved'
         ORDER BY r.created_at DESC`
      )
      .all(currentUserId) as Array<Record<string, unknown>>;

    const reviews = rows.map((row) => ({
      ...row,
      likedByMe: row.likedByMe === 1,
    }));

    res.json({ reviews });
  });

  app.post('/api/reviews', requireAuth, (req: AuthenticatedRequest, res) => {
    const r = req.body;
    const companyName = typeof r?.companyName === 'string' ? r.companyName.trim() : '';
    const comment = typeof r?.comment === 'string' ? r.comment.trim() : '';
    const googleSourceUrl =
      typeof r?.googleSourceUrl === 'string' &&
      (r.googleSourceUrl.startsWith('https://') || r.googleSourceUrl.startsWith('http://'))
        ? r.googleSourceUrl.trim().slice(0, 500)
        : '';

    if (!companyName || !comment) {
      res.status(400).json({ error: 'Company name and experience review text are required.' });
      return;
    }

    const id = crypto.randomUUID();
    const now = Date.now();

    db.prepare(
      `INSERT INTO company_reviews (
         id, user_id, company_name, industry, rating_work_env, rating_salary_payment,
         rating_accommodation, rating_management, title, comment, employment_status,
         status, likes_count, google_source_url, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 0, ?, ?)`
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
      googleSourceUrl,
      now
    );

    res.json({ success: true, id });
  });

  app.post('/api/reviews/:id/like', requireAuth, (req: AuthenticatedRequest, res) => {
    const reviewId = req.params.id;
    const userId = req.user!.id;

    const exists = db.prepare('SELECT id FROM company_reviews WHERE id = ?').get(reviewId);
    if (!exists) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }

    const existingLike = db
      .prepare('SELECT 1 FROM review_likes WHERE review_id = ? AND user_id = ?')
      .get(reviewId, userId);

    if (existingLike) {
      db.prepare('DELETE FROM review_likes WHERE review_id = ? AND user_id = ?').run(
        reviewId,
        userId
      );
      db.prepare(
        'UPDATE company_reviews SET likes_count = MAX(0, likes_count - 1) WHERE id = ?'
      ).run(reviewId);
    } else {
      db.prepare(
        'INSERT INTO review_likes (review_id, user_id, created_at) VALUES (?, ?, ?)'
      ).run(reviewId, userId, Date.now());
      db.prepare('UPDATE company_reviews SET likes_count = likes_count + 1 WHERE id = ?').run(
        reviewId
      );
    }

    const updated = db
      .prepare('SELECT likes_count AS likesCount FROM company_reviews WHERE id = ?')
      .get(reviewId) as { likesCount: number };

    res.json({
      likedByMe: !existingLike,
      likesCount: updated?.likesCount ?? 0,
    });
  });

  app.post('/api/reviews/:id/report', requireAuth, (req: AuthenticatedRequest, res) => {
    db.prepare("UPDATE company_reviews SET status = 'flagged' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/reviews/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    db.prepare('DELETE FROM company_reviews WHERE id = ? AND user_id = ?').run(
      req.params.id,
      req.user!.id
    );
    res.json({ success: true });
  });

  // ==========================================
  // 4. WORKER HELP ARTICLES & GOOGLE ARTICLE SEARCH
  // ==========================================

  app.get('/api/help/search', async (req, res) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const lang = req.query.lang === 'bn' ? 'bn' : 'en';
      if (q.length < 2) {
        res.status(400).json({ error: 'Enter at least 2 characters to search articles.' });
        return;
      }
      const result = await searchWorkerHelpArticles(q.slice(0, 120), lang);
      res.json(result);
    } catch (err: unknown) {
      res.status(502).json({
        error: (err as Error).message || 'Live article search failed.',
      });
    }
  });

  app.get('/api/help/articles', (req: AuthenticatedRequest, res) => {
    const user = extractBearerUser(req);
    const currentUserId = user?.id || '';

    const rows = db
      .prepare(
        `SELECT a.id, a.user_id AS userId, a.title, a.category, a.summary, a.content,
                a.language, a.author_label AS authorLabel, a.source_url AS sourceUrl,
                a.likes_count AS likesCount, a.created_at AS createdAt,
                CASE WHEN al.user_id IS NOT NULL THEN 1 ELSE 0 END AS likedByMe
         FROM help_articles a
         LEFT JOIN help_article_likes al ON al.article_id = a.id AND al.user_id = ?
         ORDER BY a.created_at DESC`
      )
      .all(currentUserId) as Array<Record<string, unknown>>;

    const articles = rows.map((row) => ({
      ...row,
      likedByMe: row.likedByMe === 1,
      isOwner: Boolean(currentUserId && row.userId === currentUserId),
    }));

    res.json({ articles });
  });

  app.post('/api/help/articles', requireAuth, (req: AuthenticatedRequest, res) => {
    const body = req.body || {};
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const summary =
      typeof body.summary === 'string' && body.summary.trim()
        ? body.summary.trim()
        : content.slice(0, 180);

    if (title.length < 3 || content.length < 10) {
      res.status(400).json({ error: 'Please provide an article title and detailed content.' });
      return;
    }

    const validCats = new Set(['salary', 'safety', 'medical', 'housing', 'remittance', 'general']);
    const category = validCats.has(body.category) ? body.category : 'general';
    const language = body.language === 'bn' ? 'bn' : 'en';
    const sourceUrl =
      typeof body.sourceUrl === 'string' &&
      (body.sourceUrl.startsWith('https://') || body.sourceUrl.startsWith('http://'))
        ? body.sourceUrl.trim().slice(0, 500)
        : '';
    const authorLabel =
      typeof body.authorLabel === 'string' && body.authorLabel.trim()
        ? body.authorLabel.trim().slice(0, 50)
        : `Worker #${req.user!.id.slice(-4)}`;

    const id = crypto.randomUUID();
    const now = Date.now();

    db.prepare(
      `INSERT INTO help_articles (
         id, user_id, title, category, summary, content, language,
         author_label, source_url, likes_count, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
    ).run(
      id,
      req.user!.id,
      title.slice(0, 160),
      category,
      summary.slice(0, 300),
      content.slice(0, 4000),
      language,
      authorLabel,
      sourceUrl,
      now
    );

    res.json({ success: true, id });
  });

  app.post('/api/help/articles/:id/like', requireAuth, (req: AuthenticatedRequest, res) => {
    const articleId = req.params.id;
    const userId = req.user!.id;

    const exists = db.prepare('SELECT id FROM help_articles WHERE id = ?').get(articleId);
    if (!exists) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }

    const existing = db
      .prepare('SELECT 1 FROM help_article_likes WHERE article_id = ? AND user_id = ?')
      .get(articleId, userId);

    if (existing) {
      db.prepare('DELETE FROM help_article_likes WHERE article_id = ? AND user_id = ?').run(
        articleId,
        userId
      );
      db.prepare(
        'UPDATE help_articles SET likes_count = MAX(0, likes_count - 1) WHERE id = ?'
      ).run(articleId);
    } else {
      db.prepare(
        'INSERT INTO help_article_likes (article_id, user_id, created_at) VALUES (?, ?, ?)'
      ).run(articleId, userId, Date.now());
      db.prepare('UPDATE help_articles SET likes_count = likes_count + 1 WHERE id = ?').run(
        articleId
      );
    }

    const updated = db
      .prepare('SELECT likes_count AS likesCount FROM help_articles WHERE id = ?')
      .get(articleId) as { likesCount: number };

    res.json({
      likedByMe: !existing,
      likesCount: updated?.likesCount ?? 0,
    });
  });

  app.delete('/api/help/articles/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    db.prepare('DELETE FROM help_articles WHERE id = ? AND user_id = ?').run(
      req.params.id,
      req.user!.id
    );
    res.json({ success: true });
  });

  // ==========================================
  // 5. VITE DEV MIDDLEWARE OR PRODUCTION STATIC
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
