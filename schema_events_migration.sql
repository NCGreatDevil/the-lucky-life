-- =============================================================================
-- 随机事件系统 - 数据库迁移脚本
-- 执行此脚本前，请确保已执行 schema_new.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 表1：NPC表（npcs）
-- 存储NPC基础共性信息，个性行为逻辑保留在代码类中
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS npcs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT DEFAULT '👤',
    title TEXT DEFAULT '',
    description TEXT DEFAULT '',
    personality_prompt TEXT DEFAULT '',
    rules_json TEXT DEFAULT '[]',
    greeting_hours_json TEXT DEFAULT '{}',
    conversation_rounds_min INTEGER DEFAULT 15,
    conversation_rounds_max INTEGER DEFAULT 20,
    created_at TEXT NOT NULL
);

-- -----------------------------------------------------------------------------
-- 表2：事件表（events）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    category TEXT NOT NULL CHECK (category IN ('normal', 'npc', 'friend')),
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('active', 'passive')),
    npc_id TEXT DEFAULT NULL,
    luck_tier INTEGER NOT NULL CHECK (luck_tier >= 1 AND luck_tier <= 6),
    enabled INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY (npc_id) REFERENCES npcs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_events_luck_tier ON events(luck_tier);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_trigger_type ON events(trigger_type);
CREATE INDEX IF NOT EXISTS idx_events_enabled ON events(enabled);

-- -----------------------------------------------------------------------------
-- 表3：事件选项表（event_options）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_options (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    option_order INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    effects TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_event_options_event_id ON event_options(event_id);

-- -----------------------------------------------------------------------------
-- 表4：用户事件触发记录表（user_event_triggers）
-- 记录每个用户对每个事件的触发次数
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_event_triggers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    trigger_count INTEGER DEFAULT 0,
    last_triggered_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE(user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_user_event_triggers_user_event ON user_event_triggers(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_user_event_triggers_user_id ON user_event_triggers(user_id);

-- -----------------------------------------------------------------------------
-- 表5：用户好感度表（user_favorability）
-- 记录用户对NPC或真人的好感度
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_favorability (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('npc', 'user')),
    favorability INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_favorability_user_id ON user_favorability(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorability_user_target ON user_favorability(user_id, target_id);

-- -----------------------------------------------------------------------------
-- 表6：用户每日状态表（user_daily_state）
-- 追踪被动事件生成和登录次数
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_daily_state (
    user_id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    login_attempt_count INTEGER DEFAULT 0,
    passive_event_count INTEGER DEFAULT 0,
    last_passive_event_id_0h TEXT DEFAULT NULL,
    last_passive_event_id_8h TEXT DEFAULT NULL,
    last_passive_event_id_16h TEXT DEFAULT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_daily_state_date ON user_daily_state(date);

-- -----------------------------------------------------------------------------
-- 表7：被动事件分配表（user_passive_events）
-- 记录分配给每个用户的被动事件
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_passive_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'resolved', 'expired')),
    generated_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    resolved_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_passive_events_user_id ON user_passive_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_passive_events_status ON user_passive_events(status);
CREATE INDEX IF NOT EXISTS idx_user_passive_events_expires_at ON user_passive_events(expires_at);

-- -----------------------------------------------------------------------------
-- 表8：好友申请表（user_friend_requests）
-- 记录真人好友申请
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_friend_requests (
    id TEXT PRIMARY KEY,
    requester_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_friend_requests_receiver ON user_friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_user_friend_requests_requester ON user_friend_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_user_friend_requests_status ON user_friend_requests(status);

-- =============================================================================
-- 初始化NPC数据（从现有代码类迁移）
-- =============================================================================

INSERT INTO npcs (id, name, avatar, title, description, conversation_rounds_min, conversation_rounds_max, created_at) VALUES
('dog_npc', '太宰', '🐶', '高冷酷狗', '一只会说人话的小狗。性格孤僻冷淡，非常不爱搭理人类。', 8, 10, datetime('now')),
('huangshan_npc', '黄山', '', '猫界少帅', '一只爱装逼的大橘猫，自认为是猫界少帅，喜欢吹嘘自己过往的成功经历。', 15, 20, datetime('now')),
('xianyu_npc', '咸鱼', '🐟', '佛系咸鱼', '一条无欲无求的咸鱼，淡泊名利，对很多事情都不上心，爱喝水。', 10, 20, datetime('now'));
