-- =============================================================================
-- Cloudflare D1 数据库表结构
-- 数据库名称：game-db
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 表1：用户表 (users)
-- 存储虚拟角色的基本信息，包括登录凭证和角色属性
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    -- 用户唯一标识符 (UUID格式)，用于数据库内部关联
    id TEXT PRIMARY KEY,

    -- 用户ID (唯一标识，用于前端显示，如：aB3xYz12)
    user_id TEXT UNIQUE NOT NULL,

    -- 用户昵称（登录时使用）
    nickname TEXT NOT NULL,

    -- 出生日期 (格式：YYYY-MM-DD)
    birthday TEXT NOT NULL,

    -- 性别 (male=男, female=女, other=其他)
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),

    -- 工作岗位 (如：教师、医生、工程师等)
    occupation TEXT NOT NULL,

    -- 个人简介 (选填)
    bio TEXT DEFAULT '',

    -- 密码哈希 (SHA-256 100000次迭代后的结果)
    password_hash TEXT NOT NULL,

    -- 密码盐值 (用于密码哈希的随机字符串)
    salt TEXT NOT NULL,

    -- 角色属性：运势值 (0-100)
    luckiness INTEGER DEFAULT 50,

    -- 角色属性：魅力值 (0-100)
    charm INTEGER DEFAULT 50,

    -- 角色属性：智慧值 (0-100)
    wisdom INTEGER DEFAULT 50,

    -- 角色属性：勇气值 (0-100)
    courage INTEGER DEFAULT 50,

    -- 角色属性：财富值 (0-100)
    wealth INTEGER DEFAULT 50,

    -- 角色属性：健康值 (0-100)
    health INTEGER DEFAULT 50,

    -- 角色标签 (JSON数组格式，如：["白羊座","春季","教师"])
    tags TEXT DEFAULT '[]',

    -- 创建时间 (Unix时间戳，单位：秒)
    created_at INTEGER NOT NULL,

    -- 更新时间 (Unix时间戳，单位：秒)
    updated_at INTEGER NOT NULL
);

-- -----------------------------------------------------------------------------
-- 表2：会话表 (sessions)
-- 存储用户的登录会话信息，用于保持登录状态
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    -- 会话唯一标识符 (UUID格式)
    id TEXT PRIMARY KEY,

    -- 关联的用户ID (关联 users 表的 id 字段)
    user_id TEXT NOT NULL,

    -- 会话令牌哈希 (SHA-256哈希后的token，用于验证)
    token_hash TEXT NOT NULL,

    -- 会话过期时间 (Unix时间戳，单位：秒)
    expires_at INTEGER NOT NULL,

    -- 会话创建时间 (Unix时间戳，单位：秒)
    created_at INTEGER NOT NULL,

    -- 用户浏览器信息
    user_agent TEXT,

    -- 用户IP地址
    ip_address TEXT,

    -- 外键约束：删除用户时级联删除其会话
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 表3：登录日志表 (login_logs)
-- 记录用户登录历史，用于安全审计和问题排查
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_logs (
    -- 日志ID (自增主键)
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 关联的用户ID (可为空，记录登录失败时没有用户ID)
    user_id TEXT,

    -- 关联的会话ID (可为空，记录登录失败时没有会话ID)
    session_id TEXT,

    -- 事件类型：
    --   login_success  = 登录成功
    --   login_failed   = 登录失败
    --   logout         = 退出登录
    event_type TEXT NOT NULL CHECK (event_type IN ('login_success', 'login_failed', 'logout')),

    -- 用户IP地址
    ip_address TEXT,

    -- 用户浏览器信息
    user_agent TEXT,

    -- 登录时间 (Unix时间戳，单位：秒)
    created_at INTEGER NOT NULL
);

-- =============================================================================
-- 索引定义 (用于优化查询性能)
-- =============================================================================

-- 用户表索引：按 user_id 查询
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);

-- 会话表索引：按 user_id 查询用户的所有会话
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- 会话表索引：按 token_hash 查询会话 (登录验证时使用)
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);

-- 会话表索引：按 expires_at 查询过期会话 (清理过期会话时使用)
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 登录日志表索引：按 user_id 查询用户的登录历史
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);

-- 登录日志表索引：按创建时间查询登录日志
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON login_logs(created_at);

-- =============================================================================
-- 字段说明汇总
-- =============================================================================
-- | 表名         | 字段名          | 类型   | 说明                                    |
-- |--------------|----------------|--------|----------------------------------------|
-- | users        | id             | TEXT   | 数据库内部唯一标识 (UUID)                |
-- | users        | user_id        | TEXT   | 用户显示ID (如 aB3xYz12)                |
-- | users        | nickname       | TEXT   | 用户昵称                                |
-- | users        | birthday       | TEXT   | 出生日期 YYYY-MM-DD                     |
-- | users        | gender         | TEXT   | 性别 male/female/other                  |
-- | users        | occupation     | TEXT   | 工作岗位                                |
-- | users        | bio            | TEXT   | 个人简介                                |
-- | users        | password_hash  | TEXT   | 密码哈希值                              |
-- | users        | salt           | TEXT   | 密码盐值                                |
-- | users        | luckiness      | INT    | 运势属性 0-100                          |
-- | users        | charm          | INT    | 魅力属性 0-100                          |
-- | users        | wisdom         | INT    | 智慧属性 0-100                          |
-- | users        | courage        | INT    | 勇气属性 0-100                          |
-- | users        | wealth         | INT    | 财富属性 0-100                          |
-- | users        | health         | INT    | 健康属性 0-100                          |
-- | users        | tags           | TEXT   | 角色标签 JSON数组                       |
-- | users        | created_at     | INT    | 创建时间戳                              |
-- | users        | updated_at     | INT    | 更新时间戳                              |
-- |-------------|----------------|--------|----------------------------------------|
-- | sessions     | id             | TEXT   | 会话唯一标识 (UUID)                      |
-- | sessions     | user_id        | TEXT   | 关联的用户ID                            |
-- | sessions     | token_hash     | TEXT   | 会话令牌哈希                            |
-- | sessions     | expires_at     | INT    | 过期时间戳                              |
-- | sessions     | created_at     | INT    | 创建时间戳                              |
-- | sessions     | user_agent     | TEXT   | 浏览器User-Agent                       |
-- | sessions     | ip_address     | TEXT   | 用户IP地址                              |
-- |-------------|----------------|--------|----------------------------------------|
-- | login_logs   | id             | INT    | 日志自增ID                              |
-- | login_logs   | user_id        | TEXT   | 关联的用户ID（可为空）                  |
-- | login_logs   | session_id     | TEXT   | 关联的会话ID（可为空）                  |
-- | login_logs   | event_type     | TEXT   | 事件类型                                |
-- | login_logs   | ip_address     | TEXT   | 用户IP地址                              |
-- | login_logs   | user_agent     | TEXT   | 浏览器User-Agent                       |
-- | login_logs   | created_at     | INT    | 事件发生时间戳                          |
-- =============================================================================
