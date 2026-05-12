-- -----------------------------------------------------------------------------
-- 随机事件数据初始化样例
-- 包含主动事件和被动事件，涵盖普通、NPC、好友三种类型
-- -----------------------------------------------------------------------------

-- =============================================================================
-- 事件0：倒霉的一天（主动事件 - 普通类型 - 运气等级1）
-- =============================================================================
INSERT INTO events (id, name, description, image_url, category, trigger_type, npc_id, luck_tier, enabled, created_at)
VALUES ('evt_bad_luck', '倒霉的一天', '今天似乎什么都不顺，出门就踩到水坑，手机还差点掉了。', '', 'normal', 'active', NULL, 1, 1, datetime('now'));

INSERT INTO event_options (id, event_id, option_order, option_text, effects, created_at) VALUES
('opt_bad_luck_1', 'evt_bad_luck', 1, '深呼吸，调整心态', '[{"attr":"willpower","range":[3,5]},{"attr":"emotion","range":[2,4]}]', datetime('now')),
('opt_bad_luck_2', 'evt_bad_luck', 2, '抱怨几句继续走', '[{"attr":"emotion","range":[-3,-1]},{"attr":"popularity","range":[-2,-1]}]', datetime('now'));

-- =============================================================================
-- 事件1：路边的小猫（主动事件 - 普通类型 - 运气等级3）
-- =============================================================================
INSERT INTO events (id, name, description, image_url, category, trigger_type, npc_id, luck_tier, enabled, created_at)
VALUES ('evt_stray_cat', '路边的小猫', '回家的路上，你发现一只小猫蜷缩在墙角，看起来又冷又饿。', '', 'normal', 'active', NULL, 3, 1, datetime('now'));

INSERT INTO event_options (id, event_id, option_order, option_text, effects, created_at) VALUES
('opt_stray_cat_1', 'evt_stray_cat', 1, '买猫粮喂它', '[{"attr":"emotion","range":[5,10]},{"attr":"money","range":[-10,-5]}]', datetime('now')),
('opt_stray_cat_2', 'evt_stray_cat', 2, '摸摸它然后离开', '[{"attr":"emotion","range":[2,5]}]', datetime('now')),
('opt_stray_cat_3', 'evt_stray_cat', 3, '直接走开', '[{"attr":"willpower","range":[1,3]},{"attr":"emotion","range":[-3,-1]}]', datetime('now'));

-- =============================================================================
-- 事件2：意外的红包（主动事件 - 普通类型 - 运气等级4）
-- =============================================================================
INSERT INTO events (id, name, description, image_url, category, trigger_type, npc_id, luck_tier, enabled, created_at)
VALUES ('evt_red_packet', '意外的红包', '你在路边捡到一个红包，里面有不少钱。', '', 'normal', 'active', NULL, 4, 1, datetime('now'));

INSERT INTO event_options (id, event_id, option_order, option_text, effects, created_at) VALUES
('opt_red_packet_1', 'evt_red_packet', 1, '交给警察', '[{"attr":"morality","range":[10,15]},{"attr":"money","range":[-50,-30]}]', datetime('now')),
('opt_red_packet_2', 'evt_red_packet', 2, '原地等待失主', '[{"attr":"morality","range":[5,8]},{"attr":"energy","range":[-10,-5]}]', datetime('now')),
('opt_red_packet_3', 'evt_red_packet', 3, '自己留着', '[{"attr":"money","range":[50,100]},{"attr":"morality","range":[-10,-5]}]', datetime('now'));

-- =============================================================================
-- 事件3：深夜的短信（被动事件 - 普通类型 - 运气等级2）
-- =============================================================================
INSERT INTO events (id, name, description, image_url, category, trigger_type, npc_id, luck_tier, enabled, created_at)
VALUES ('evt_late_sms', '深夜的短信', '凌晨两点，你收到一条陌生号码发来的短信："你还好吗？"', '', 'normal', 'passive', NULL, 2, 1, datetime('now'));

INSERT INTO event_options (id, event_id, option_order, option_text, effects, created_at) VALUES
('opt_late_sms_1', 'evt_late_sms', 1, '回复"我很好"', '[{"attr":"emotion","range":[3,5]},{"attr":"popularity","range":[1,3]}]', datetime('now')),
('opt_late_sms_2', 'evt_late_sms', 2, '不理会，继续睡', '[{"attr":"willpower","range":[2,4]},{"attr":"energy","range":[5,10]}]', datetime('now'));

-- =============================================================================
-- 事件4：太宰的求助（主动事件 - NPC类型 - 关联太宰 - 运气等级3）
-- =============================================================================
INSERT INTO events (id, name, description, image_url, category, trigger_type, npc_id, luck_tier, enabled, created_at)
VALUES ('evt_taizai_help', '太宰的求助', '太宰难得主动找你，说它饿了，想让你帮忙找点吃的。', '', 'npc', 'active', 'taizai_npc', 3, 1, datetime('now'));

INSERT INTO event_options (id, event_id, option_order, option_text, effects, created_at) VALUES
('opt_taizai_help_1', 'evt_taizai_help', 1, '给它买好吃的', '[{"attr":"emotion","range":[5,8]},{"attr":"money","range":[-15,-10]}]', datetime('now')),
('opt_taizai_help_2', 'evt_taizai_help', 2, '让它自己找', '[{"attr":"willpower","range":[3,5]}]', datetime('now'));

-- =============================================================================
-- 事件5：黄山的炫耀（被动事件 - NPC类型 - 关联黄山 - 运气等级4）
-- =============================================================================
INSERT INTO events (id, name, description, image_url, category, trigger_type, npc_id, luck_tier, enabled, created_at)
VALUES ('evt_huangshan_show', '黄山的炫耀', '黄山又来找你吹嘘它过去的"光辉事迹"，这次说的是它如何统领猫界。', '', 'npc', 'passive', 'huangshan_npc', 4, 1, datetime('now'));

INSERT INTO event_options (id, event_id, option_order, option_text, effects, created_at) VALUES
('opt_huangshan_show_1', 'evt_huangshan_show', 1, '认真听它吹嘘', '[{"attr":"emotion","range":[3,5]},{"attr":"popularity","range":[2,4]}]', datetime('now')),
('opt_huangshan_show_2', 'evt_huangshan_show', 2, '敷衍地应付', '[{"attr":"willpower","range":[2,3]},{"attr":"emotion","range":[-2,-1]}]', datetime('now')),
('opt_huangshan_show_3', 'evt_huangshan_show', 3, '直接质疑它', '[{"attr":"willpower","range":[5,8]},{"attr":"popularity","range":[-3,-1]}]', datetime('now'));

-- =============================================================================
-- 事件6：咸鱼的哲学（被动事件 - NPC类型 - 关联咸鱼 - 运气等级2）
-- =============================================================================
INSERT INTO events (id, name, description, image_url, category, trigger_type, npc_id, luck_tier, enabled, created_at)
VALUES ('evt_xianyu_philosophy', '咸鱼的哲学', '咸鱼突然跟你聊起了人生哲学："喝水，就是喝水本身。"', '', 'npc', 'passive', 'xianyu_npc', 2, 1, datetime('now'));

INSERT INTO event_options (id, event_id, option_order, option_text, effects, created_at) VALUES
('opt_xianyu_philosophy_1', 'evt_xianyu_philosophy', 1, '跟它一起喝水', '[{"attr":"emotion","range":[5,8]},{"attr":"constitution","range":[2,4]}]', datetime('now')),
('opt_xianyu_philosophy_2', 'evt_xianyu_philosophy', 2, '表示不理解', '[{"attr":"intelligence","range":[2,4]},{"attr":"emotion","range":[-1,1]}]', datetime('now'));

-- =============================================================================
-- 事件7：老同学的邀请（主动事件 - 好友类型 - 运气等级5）
-- =============================================================================
INSERT INTO events (id, name, description, image_url, category, trigger_type, npc_id, luck_tier, enabled, created_at)
VALUES ('evt_classmate_invite', '老同学的邀请', '多年未见的老同学突然联系你，邀请你参加同学聚会。', '', 'friend', 'active', NULL, 5, 1, datetime('now'));

INSERT INTO event_options (id, event_id, option_order, option_text, effects, created_at) VALUES
('opt_classmate_invite_1', 'evt_classmate_invite', 1, '欣然赴约', '[{"attr":"popularity","range":[8,12]},{"attr":"emotion","range":[5,8]},{"attr":"money","range":[-30,-20]}]', datetime('now')),
('opt_classmate_invite_2', 'evt_classmate_invite', 2, '委婉拒绝', '[{"attr":"willpower","range":[3,5]},{"attr":"emotion","range":[-2,-1]}]', datetime('now'));

-- =============================================================================
-- 事件8：彩票中奖（主动事件 - 普通类型 - 运气等级6）
-- =============================================================================
INSERT INTO events (id, name, description, image_url, category, trigger_type, npc_id, luck_tier, enabled, created_at)
VALUES ('evt_lottery_win', '彩票中奖', '你随手买的彩票居然中了小奖！', '', 'normal', 'active', NULL, 6, 1, datetime('now'));

INSERT INTO event_options (id, event_id, option_order, option_text, effects, created_at) VALUES
('opt_lottery_win_1', 'evt_lottery_win', 1, '继续买更多', '[{"attr":"money","range":[20,50]},{"attr":"luck","range":[5,10]}]', datetime('now')),
('opt_lottery_win_2', 'evt_lottery_win', 2, '见好就收', '[{"attr":"money","range":[50,100]},{"attr":"willpower","range":[5,8]}]', datetime('now'));

-- =============================================================================
-- 事件9：暴雨中的抉择（被动事件 - 普通类型 - 运气等级3）
-- =============================================================================
INSERT INTO events (id, name, description, image_url, category, trigger_type, npc_id, luck_tier, enabled, created_at)
VALUES ('evt_rain_choice', '暴雨中的抉择', '突然下起暴雨，你没带伞。路边有个人愿意和你共用一把伞，但方向相反。', '', 'normal', 'passive', NULL, 3, 1, datetime('now'));

INSERT INTO event_options (id, event_id, option_order, option_text, effects, created_at) VALUES
('opt_rain_choice_1', 'evt_rain_choice', 1, '和他一起走', '[{"attr":"popularity","range":[5,8]},{"attr":"emotion","range":[3,5]}]', datetime('now')),
('opt_rain_choice_2', 'evt_rain_choice', 2, '自己淋雨跑回去', '[{"attr":"constitution","range":[3,5]},{"attr":"energy","range":[-10,-5]},{"attr":"willpower","range":[5,8]}]', datetime('now'));

-- =============================================================================
-- 事件10：神秘的书（被动事件 - 普通类型 - 运气等级5）
-- =============================================================================
INSERT INTO events (id, name, description, image_url, category, trigger_type, npc_id, luck_tier, enabled, created_at)
VALUES ('evt_mystery_book', '神秘的书', '你在旧书摊发现一本奇怪的书，翻开第一页就深深吸引了你。', '', 'normal', 'passive', NULL, 5, 1, datetime('now'));

INSERT INTO event_options (id, event_id, option_order, option_text, effects, created_at) VALUES
('opt_mystery_book_1', 'evt_mystery_book', 1, '买下来仔细阅读', '[{"attr":"intelligence","range":[10,15]},{"attr":"money","range":[-20,-10]},{"attr":"energy","range":[-10,-5]}]', datetime('now')),
('opt_mystery_book_2', 'evt_mystery_book', 2, '翻翻就放下', '[{"attr":"intelligence","range":[2,4]}]', datetime('now'));
