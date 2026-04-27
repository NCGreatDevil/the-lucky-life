-- =============================================================================
-- Cloudflare D1 数据库表结构 - 用户系统重构版
-- 数据库名称：game-db
-- 重构日期：2026-04-24
-- 说明：将原来的 users 表拆分为基础信息表和属性表，提高扩展性
-- 注意：执行此脚本前，请先在 D1 后台删除旧表中的数据
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 表1：用户基础信息表 (users)
-- 存储用户登录凭证和相对稳定的个人信息
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    -- 数据库内部唯一标识符 (UUID格式)，用于数据库内部关联
    id TEXT PRIMARY KEY,

    -- 用户显示ID (唯一标识，用于前端显示，如：Player_01)
    user_id TEXT UNIQUE NOT NULL,

    -- 用户昵称（登录时使用）
    nickname TEXT NOT NULL,

    -- 出生日期 (格式：YYYY-MM-DD)
    birthday TEXT NOT NULL,

    -- 性别 (male=男, female=女, other=其他)
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),

    -- 职业 (如：教师、医生、工程师等)
    occupation TEXT NOT NULL,

    -- 个人简介 (选填)
    bio TEXT DEFAULT '',

    -- 密码哈希 (SHA-256 100000次迭代后的结果)
    password_hash TEXT NOT NULL,

    -- 密码盐值 (用于密码哈希的随机字符串)
    salt TEXT NOT NULL,

    -- 创建时间 (ISO 8601 格式，如：2026-04-27T14:30:45.123Z)
    created_at TEXT NOT NULL,

    -- 更新时间 (ISO 8601 格式，如：2026-04-27T14:30:45.123Z)
    updated_at TEXT NOT NULL
);

-- -----------------------------------------------------------------------------
-- 表2：用户属性表 (user_attributes)
-- 存储用户的角色属性，支持日常重置和事件触发更新
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_attributes (
    -- 关联的用户ID (关联 users 表的 id 字段)
    user_id TEXT PRIMARY KEY,

    -- ============================================
    -- 日常属性（每天0时自动重置）
    -- ============================================
    -- 能量值：范围 0-100，每天0时重置到80
    energy INTEGER DEFAULT 80 CHECK (energy >= 0 AND energy <= 100),

    -- 活力值：范围 0-100，每天0时重置到60
    vitality INTEGER DEFAULT 60 CHECK (vitality >= 0 AND vitality <= 100),

    -- ============================================
    -- 长期属性（通过事件触发增减，无上下限）
    -- ============================================
    -- 道德值：默认0，无限制
    morality INTEGER DEFAULT 0,

    -- 智力值：默认0，无限制
    intelligence INTEGER DEFAULT 0,

    -- 体质值：默认0，无限制
    constitution INTEGER DEFAULT 0,

    -- 魅力值：默认0，无限制
    charm INTEGER DEFAULT 0,

    -- 意志值：默认0，无限制
    willpower INTEGER DEFAULT 0,

    -- 情绪值：默认0，无限制
    emotion INTEGER DEFAULT 0,

    -- 人缘值：默认0，无限制
    popularity INTEGER DEFAULT 0,

    -- ============================================
    -- 消耗属性（通过事件触发增减）
    -- ============================================
    -- 金钱值：默认0，无上限，下限0
    money INTEGER DEFAULT 0 CHECK (money >= 0),

    -- ============================================
    -- 隐藏属性
    -- ============================================
    -- 运气值：范围 0-100，每天0时随机重置，前端隐藏具体数值
    luck INTEGER DEFAULT 50 CHECK (luck >= 0 AND luck <= 100),

    -- 运气等级：关联 luck_levels 表的 level 字段
    luck_level INTEGER DEFAULT 3 CHECK (luck_level >= 1 AND luck_level <= 6),

    -- 更新时间 (ISO 8601 格式，如：2026-04-27T14:30:45.123Z)
    updated_at TEXT NOT NULL,

    -- 外键约束：删除用户时级联删除属性
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -------------- NOT EXISTS idx_users_nickname ON users(nickname);

-- 属性表索引：按 luck_level 查询
CREATE INDEX IF NOT EXISTS idx_user_attributes_luck_level ON user_attributes(luck_level);

-- 会话表索引：按 user_id 查询用户的所有会话
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- 会话表索引：按 token_hash 查询会话 (登录验证时使用)
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);

-- 会话表索引：按 expires_at 查询过期会话 (清理过期会话时使用)
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 登录日志表索引：按 user_id 查询用户的登录历史
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);

-- 登录日志表索引：按创建时间查询登录日志
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON login_logs(created_at);---------------------------------------------------------------
-- 表3：运气等级字典表 (luck_levels)
-- 运气等级配置表，可单独配置和修改
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS luck_levels (
    -- 运气等级 (1-6)
    level INTEGER PRIMARY KEY,

    -- 等级名称（显示给用户的标签）
    label TEXT NOT NULL,

    -- 判定范围最小值
    min_value INTEGER NOT NULL,

    -- 判定范围最大值
    max_value INTEGER NOT NULL,

    -- 等级描述（可选）
    description TEXT DEFAULT ''
);

-- -----------------------------------------------------------------------------
-- 表4：会话表 (sessions)
-- 存储用户的登录会话信息，用于保持登录状态
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    -- 会话唯一标识符 (UUID格式)
    id TEXT PRIMARY KEY,

    -- 关联的用户ID (关联 users 表的 id 字段)
    user_id TEXT NOT NULL,

    -- 会话令牌哈希 (SHA-256哈希后的token，用于验证)
    token_hash TEXT NOT NULL,

    -- 会话过期时间 (ISO 8601 格式，如：2026-05-04T14:30:45.123Z)
    expires_at TEXT NOT NULL,

    -- 会话创建时间 (ISO 8601 格式，如：2026-04-27T14:30:45.123Z)
    created_at TEXT NOT NULL,

    -- 用户浏览器信息
    user_agent TEXT,

    -- 用户IP地址
    ip_address TEXT,

    -- 外键约束：删除用户时级联删除会话
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 表5：登录日志表 (login_logs)
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

    -- 登录时间 (ISO 8601 格式，如：2026-04-27T14:30:45.123Z)
    created_at TEXT NOT NULL
);

-- =============================================================================
-- 索引定义 (用于优化查询性能)
-- =============================================================================

-- 用户表索引：按 user_id 查询
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);

-- 用户表索引：按 nickname 查询
CREATE INDEX IF

-- -----------------------------------------------------------------------------
-- 表6：用户好友表 (user_friends)
-- 存储用户的好友关系，支持 NPC 和真实用户好友
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_friends (
    -- 记录唯一标识符 (UUID格式)
    id TEXT PRIMARY KEY,

    -- 关联的用户ID (关联 users 表的 id 字段)
    user_id TEXT NOT NULL,

    -- 好友ID：若是NPC则为固定标识（如 'dog_npc'），若是真实用户则为用户ID
    friend_id TEXT NOT NULL,

    -- 是否为NPC好友 (true=NPC, false=真实用户)
    is_npc BOOLEAN DEFAULT false,

    -- 好友名称（存储快照，避免关联查询）
    friend_name TEXT NOT NULL,

    -- 好友头像（存储快照）
    friend_avatar TEXT DEFAULT '👤',

    -- 好友等级
    friend_level INTEGER DEFAULT 1,

    -- 好友称号/头衔
    friend_title TEXT DEFAULT '',

    -- 好友标签（JSON数组格式）
    friend_tags TEXT DEFAULT '[]',

    -- 好友关系创建时间 (ISO 8601 格式)
    created_at TEXT NOT NULL,

    -- 外键约束：删除用户时级联删除好友关系
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 表7：用户记忆表 (user_memories)
-- 存储用户与其他角色（主要是NPC）的交互记忆和行为标签
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_memories (
    -- 记录唯一标识符 (UUID格式)
    id TEXT PRIMARY KEY,

    -- 关联的用户ID (关联 users 表的 id 字段)
    user_id TEXT NOT NULL,

    -- 目标角色ID：若是NPC则为固定标识（如 'dog_npc'），若是真实用户则为用户ID
    target_id TEXT NOT NULL,

    -- 是否嘲讽过目标角色
    has_taunt BOOLEAN DEFAULT false,

    -- 是否对目标角色友好
    is_friendly BOOLEAN DEFAULT false,

    -- 记忆更新时间 (ISO 8601 格式)
    updated_at TEXT NOT NULL,

    -- 外键约束：删除用户时级联删除记忆
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================================
-- 好友表和记忆表索引定义
-- =============================================================================

-- 用户好友表索引：按 user_id 查询用户的所有好友
CREATE INDEX IF NOT EXISTS idx_user_friends_user_id ON user_friends(user_id);

-- 用户好友表索引：按 friend_id 查询
CREATE INDEX IF NOT EXISTS idx_user_friends_friend_id ON user_friends(friend_id);

-- 用户好友表索引：按 is_npc 区分NPC和真实好友
CREATE INDEX IF NOT EXISTS idx_user_friends_is_npc ON user_friends(is_npc);

-- 用户记忆表索引：按 user_id 查询用户的所有记忆
CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON user_memories(user_id);

-- 用户记忆表索引：按 target_id 查询对特定角色的记忆
CREATE INDEX IF NOT EXISTS idx_user_memories_target_id ON user_memories(target_id);

-- =============================================================================
-- 初始化运气等级字典数据
-- =============================================================================

INSERT INTO luck_levels (level, label, min_value, max_value, description) VALUES
(1, '倒霉', 0, 5, '运势极差，诸事不顺'),
(2, '不顺', 6, 25, '运势较差，事事受阻'),
(3, '平常', 26, 75, '运势平稳，普通日常'),
(4, '顺遂', 76, 85, '运势较好，事事顺心'),
(5, '好运', 86, 95, '运势极佳，福星高照'),
(6, '爆棚', 96, 100, '运势爆棚，心想事成');

-- =============================================================================
-- 字段说明汇总
-- =============================================================================
-- | 表名               | 字段名         | 类型    | 说明                                    |
-- |--------------------|----------------|---------|----------------------------------------|
-- | users              | id             | TEXT    | 数据库内部唯一标识 (UUID)                |
-- | users              | user_id        | TEXT    | 用户显示ID (如 Player_01)               |
-- | users              | nickname       | TEXT    | 用户昵称                                |
-- | users              | birthday       | TEXT    | 出生日期 YYYY-MM-DD                     |
-- | users              | gender         | TEXT    | 性别 male/female/other                  |
-- | users              | occupation     | TEXT    | 职业                                    |
-- | users              | bio            | TEXT    | 个人简介                                |
-- | users              | password_hash  | TEXT    | 密码哈希值                              |
-- | users              | salt           | TEXT    | 密码盐值                                |
-- | users              | created_at     | TEXT    | 创建时间 ISO 8601 格式                  |
-- | users              | updated_at     | TEXT    | 更新时间 ISO 8601 格式                  |
-- |--------------------|----------------|---------|----------------------------------------|
-- | user_attributes    | user_id        | TEXT    | 关联的用户ID（主键）                    |
-- | user_attributes    | energy         | INT     | 能量 0-100，默认80，每天重置            |
-- | user_attributes    | vitality       | INT     | 活力 0-100，默认60，每天重置            |
-- | user_attributes    | morality       | INT     | 道德，无限制，默认0                     |
-- | user_attributes    | intelligence   | INT     | 智力，无限制，默认0                     |
-- | user_attributes    | constitution   | INT     | 体质，无限制，默认0                     |
-- | user_attributes    | charm          | INT     | 魅力，无限制，默认0                     |
-- | user_attributes    | willpower      | INT     | 意志，无限制，默认0                     |
-- | user_attributes    | emotion        | INT     | 情绪，无限制，默认0                     |
-- | user_attributes    | popularity     | INT     | 人缘，无限制，默认0                     |
-- | user_attributes    | money          | INT     | 金钱，无上限，默认0                     |
-- | user_attributes    | luck           | INT     | 运气 0-100，隐藏数值                    |
-- | user_attributes    | luck_level     | INT     | 运气等级 1-6，默认3                     |
-- | user_attributes    | updated_at     | TEXT    | 更新时间 ISO 8601 格式                  |
-- |--------------------|----------------|---------|----------------------------------------|
-- | luck_levels        | level          | INT     | 运气等级 (1-6)                         |
-- | luck_levels        | label          | TEXT    | 等级名称                                |
-- | luck_levels        | min_value      | INT     | 判定范围最小值                          |
-- | luck_levels        | max_value      | INT     | 判定范围最大值                          |
-- | luck_levels        | description    | TEXT    | 等级描述                                |
-- |--------------------|----------------|---------|----------------------------------------|
-- | sessions           | id             | TEXT    | 会话唯一标识 (UUID)                     |
-- | sessions           | user_id        | TEXT    | 关联的用户ID                            |
-- | sessions           | token_hash     | TEXT    | 会话令牌哈希                            |
-- | sessions           | expires_at     | TEXT    | 过期时间 ISO 8601 格式                  |
-- | sessions           | created_at     | TEXT    | 创建时间 ISO 8601 格式                  |
-- | sessions           | user_agent     | TEXT    | 浏览器User-Agent                       |
-- | sessions           | ip_address     | TEXT    | 用户IP地址                              |
-- |--------------------|----------------|---------|----------------------------------------|
-- | login_logs         | id             | INT     | 日志自增ID                              |
-- | login_logs         | user_id        | TEXT    | 关联的用户ID（可为空）                  |
-- | login_logs         | session_id     | TEXT    | 关联的会话ID（可为空）                  |
-- | login_logs         | event_type     | TEXT    | 事件类型                                |
-- | login_logs         | ip_address     | TEXT    | 用户IP地址                              |
-- | login_logs         | user_agent     | TEXT    | 浏览器User-Agent                       |
-- | login_logs         | created_at     | TEXT    | 事件发生时间 ISO 8601 格式              |
-- |--------------------|----------------|---------|----------------------------------------|
-- | user_friends       | id             | TEXT    | 记录唯一标识 (UUID)                     |
-- | user_friends       | user_id        | TEXT    | 关联的用户ID                            |
-- | user_friends       | friend_id      | TEXT    | 好友ID（NPC固定标识或用户ID）           |
-- | user_friends       | is_npc         | BOOLEAN | 是否为NPC好友                           |
-- | user_friends       | friend_name    | TEXT    | 好友名称（快照）                        |
-- | user_friends       | friend_avatar  | TEXT    | 好友头像（快照）                        |
-- | user_friends       | friend_level   | INT     | 好友等级                               |
-- | user_friends       | friend_title   | TEXT    | 好友称号                               |
-- | user_friends       | friend_tags    | TEXT    | 好友标签（JSON数组）                    |
-- | user_friends       | created_at     | TEXT    | 创建时间 ISO 8601 格式                  |
-- |--------------------|----------------|---------|----------------------------------------|
-- | user_memories      | id             | TEXT    | 记录唯一标识 (UUID)                     |
-- | user_memories      | user_id        | TEXT    | 关联的用户ID                            |
-- | user_memories      | target_id      | TEXT    | 目标角色ID（NPC固定标识或用户ID）       |
-- | user_memories      | has_taunt      | BOOLEAN | 是否嘲讽过目标角色                      |
-- | user_memories      | is_friendly    | BOOLEAN | 是否对目标角色友好                      |
-- | user_memories      | updated_at     | TEXT    | 更新时间 ISO 8601 格式                  |
-- =============================================================================