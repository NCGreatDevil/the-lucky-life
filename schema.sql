-- Cloudflare D1 Database Schema
-- 请在 Cloudflare D1 控制台执行此脚本

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    birthday TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    occupation TEXT NOT NULL,
    bio TEXT DEFAULT '',
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    luckiness INTEGER DEFAULT 50,
    charm INTEGER DEFAULT 50,
    wisdom INTEGER DEFAULT 50,
    courage INTEGER DEFAULT 50,
    wealth INTEGER DEFAULT 50,
    health INTEGER DEFAULT 50,
    tags TEXT DEFAULT '[]',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- 会话表
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 登录日志表
CREATE TABLE IF NOT EXISTS login_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    session_id TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('login_success', 'login_failed', 'logout')),
    ip_address TEXT,
    user_agent TEXT,
    country TEXT,
    city TEXT,
    created_at INTEGER NOT NULL
);

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON login_logs(created_at);
