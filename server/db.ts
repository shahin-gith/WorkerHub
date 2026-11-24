import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'workerhub.db');
export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Detect legacy email-account schema (v1) and migrate cleanly to Device User ID schema (v2)
const userCols = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;
const hasLegacyEmailCol = userCols.some((c) => c.name === 'email');

if (hasLegacyEmailCol) {
  db.exec(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS otp_codes;
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS user_shifts;
    DROP TABLE IF EXISTS user_documents;
    DROP TABLE IF EXISTS user_company_history;
    DROP TABLE IF EXISTS user_finance;
    DROP TABLE IF EXISTS user_profiles_json;
    DROP TABLE IF EXISTS company_reviews;
    DROP TABLE IF EXISTS users;
    PRAGMA foreign_keys = ON;
  `);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL DEFAULT 'Worker',
    role TEXT NOT NULL DEFAULT 'worker',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

  CREATE TABLE IF NOT EXISTS user_shifts (
    id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    company_name TEXT NOT NULL,
    worksite_name TEXT NOT NULL DEFAULT '',
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    break_duration_minutes INTEGER NOT NULL DEFAULT 0,
    normal_hours REAL NOT NULL DEFAULT 0,
    ot_hours REAL NOT NULL DEFAULT 0,
    total_working_hours REAL NOT NULL DEFAULT 0,
    work_status TEXT NOT NULL DEFAULT 'normal',
    daily_notes TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_documents (
    id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    issue_date TEXT NOT NULL DEFAULT '',
    expiry_date TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    file_name TEXT NOT NULL DEFAULT '',
    file_data_url TEXT NOT NULL DEFAULT '',
    file_size_kb INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_company_history (
    id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL DEFAULT '',
    is_current INTEGER NOT NULL DEFAULT 0,
    basic_salary REAL NOT NULL DEFAULT 0,
    worksite TEXT NOT NULL DEFAULT '',
    responsibilities TEXT NOT NULL DEFAULT '',
    reason_for_leaving TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_finance (
    id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    account_id TEXT NOT NULL DEFAULT 'acc-cash',
    account_name TEXT NOT NULL DEFAULT 'Cash Wallet',
    amount_sgd REAL NOT NULL,
    amount_foreign REAL,
    foreign_currency TEXT,
    exchange_rate REAL,
    date TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_profiles_json (
    user_id TEXT PRIMARY KEY,
    salary_settings_json TEXT,
    cv_json TEXT,
    savings_goal_json TEXT,
    money_accounts_json TEXT,
    dashboard_config_json TEXT,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS company_reviews (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    industry TEXT NOT NULL,
    rating_work_env INTEGER NOT NULL,
    rating_salary_payment INTEGER NOT NULL,
    rating_accommodation INTEGER NOT NULL,
    rating_management INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    comment TEXT NOT NULL,
    employment_status TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'approved',
    likes_count INTEGER NOT NULL DEFAULT 0,
    google_source_url TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS review_likes (
    review_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (review_id, user_id),
    FOREIGN KEY (review_id) REFERENCES company_reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS help_articles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    author_label TEXT NOT NULL DEFAULT 'Worker Community',
    source_url TEXT NOT NULL DEFAULT '',
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS help_article_likes (
    article_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (article_id, user_id),
    FOREIGN KEY (article_id) REFERENCES help_articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Ensure new columns exist if DB already initialized in v2
const ensureColumn = (table: string, col: string, ddl: string) => {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === col)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl};`);
  }
};

ensureColumn('user_finance', 'account_id', "account_id TEXT NOT NULL DEFAULT 'acc-cash'");
ensureColumn('user_finance', 'account_name', "account_name TEXT NOT NULL DEFAULT 'Cash Wallet'");
ensureColumn('user_profiles_json', 'money_accounts_json', 'money_accounts_json TEXT');
ensureColumn('company_reviews', 'likes_count', 'likes_count INTEGER NOT NULL DEFAULT 0');
ensureColumn('company_reviews', 'google_source_url', "google_source_url TEXT NOT NULL DEFAULT ''");
