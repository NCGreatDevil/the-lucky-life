import { calculateLuckLevel, generateGUID, getNowISO } from './_utils.js';

export async function scheduled(event, env, ctx) {
    console.log('定时任务开始执行:', new Date().toISOString());

    const db = env['game-db'];
    const now = new Date();
    const hour = now.getUTCHours();
    const today = now.toISOString().split('T')[0];
    const nowISO = now.toISOString();

    try {
        if (hour === 0) {
            await handleMidnightReset(db, today, nowISO);
        }

        await handleTimerEventGeneration(db, hour, today, nowISO);

        console.log(`定时任务执行完成: ${hour}点任务`);

    } catch (error) {
        console.error('定时任务执行失败:', error);
        throw error;
    }
}

async function handleMidnightReset(db, today, nowISO) {
    console.log('执行每日0点重置...');

    const users = await db.prepare('SELECT id FROM users').all();

    if (!users.results || users.results.length === 0) {
        console.log('没有用户需要重置');
        return;
    }

    console.log(`找到 ${users.results.length} 个用户，开始重置属性`);

    let successCount = 0;
    let failCount = 0;

    for (const user of users.results) {
        try {
            const randomLuck = Math.floor(Math.random() * 101);
            const luckLevel = calculateLuckLevel(randomLuck);

            await db.prepare(
                'UPDATE user_attributes SET energy = 80, vitality = 60, luck = ?, luck_level = ?, updated_at = ? WHERE user_id = ?'
            ).bind(randomLuck, luckLevel, nowISO, user.id).run();

            const existingState = await db.prepare(
                'SELECT user_id FROM user_daily_state WHERE user_id = ?'
            ).bind(user.id).first();

            if (existingState) {
                await db.prepare(
                    'UPDATE user_daily_state SET date = ?, login_attempt_count = 0, passive_event_count = 0, last_passive_event_id_0h = NULL, last_passive_event_id_8h = NULL, last_passive_event_id_16h = NULL, updated_at = ? WHERE user_id = ?'
                ).bind(today, nowISO, user.id).run();
            } else {
                await db.prepare(
                    'INSERT INTO user_daily_state (user_id, date, login_attempt_count, passive_event_count, updated_at) VALUES (?, ?, 0, 0, ?)'
                ).bind(user.id, today, nowISO).run();
            }

            successCount++;
        } catch (error) {
            console.error(`重置用户 ${user.id} 属性失败:`, error);
            failCount++;
        }
    }

    console.log(`每日重置完成: 成功 ${successCount} 个，失败 ${failCount} 个`);
}

async function handleTimerEventGeneration(db, hour, today, nowISO) {
    const users = await db.prepare('SELECT id FROM users').all();

    if (!users.results || users.results.length === 0) return;

    for (const user of users.results) {
        try {
            const dailyState = await db.prepare(
                'SELECT * FROM user_daily_state WHERE user_id = ? AND date = ?'
            ).bind(user.id, today).first();

            if (!dailyState) {
                await db.prepare(
                    'INSERT INTO user_daily_state (user_id, date, login_attempt_count, passive_event_count, updated_at) VALUES (?, ?, 0, 0, ?)'
                ).bind(user.id, today, nowISO).run();
            }

            const timerEventId = await generatePassiveEventForUser(db, user.id, nowISO);

            if (timerEventId) {
                const fieldMap = { 0: 'last_passive_event_id_0h', 8: 'last_passive_event_id_8h', 16: 'last_passive_event_id_16h' };
                const field = fieldMap[hour];
                if (field) {
                    await db.prepare(
                        `UPDATE user_daily_state SET ${field} = ?, passive_event_count = passive_event_count + 1, updated_at = ? WHERE user_id = ?`
                    ).bind(timerEventId, nowISO, user.id).run();
                }
            }

            const hasActiveSession = await db.prepare(
                'SELECT id FROM sessions WHERE user_id = ? AND expires_at > ?'
            ).bind(user.id, nowISO).first();

            if (hasActiveSession) {
                const updatedState = await db.prepare(
                    'SELECT login_attempt_count FROM user_daily_state WHERE user_id = ? AND date = ?'
                ).bind(user.id, today).first();

                if (updatedState) {
                    const loginCount = updatedState.login_attempt_count + 1;
                    await db.prepare(
                        'UPDATE user_daily_state SET login_attempt_count = ?, updated_at = ? WHERE user_id = ?'
                    ).bind(loginCount, nowISO, user.id).run();

                    const loginTriggerProbability = 1 / Math.pow(2, loginCount - 1);

                    if (Math.random() < loginTriggerProbability) {
                        const attrs = await db.prepare('SELECT energy FROM user_attributes WHERE user_id = ?').bind(user.id).first();
                        if (attrs && attrs.energy >= 5) {
                            const loginEventId = await generatePassiveEventForUser(db, user.id, nowISO);
                            if (loginEventId) {
                                await db.prepare(
                                    'UPDATE user_daily_state SET passive_event_count = passive_event_count + 1, updated_at = ? WHERE user_id = ?'
                                ).bind(nowISO, user.id).run();
                            }
                        }
                    }
                }
            }

        } catch (error) {
            console.error(`处理用户 ${user.id} 定时任务失败:`, error);
        }
    }
}

async function generatePassiveEventForUser(db, userId, nowISO) {
    const attrs = await db.prepare('SELECT luck_level FROM user_attributes WHERE user_id = ?').bind(userId).first();
    if (!attrs) return null;

    const luckLevel = attrs.luck_level;
    const roll = Math.random();
    let tier;
    if (roll < 0.5) {
        tier = luckLevel;
    } else if (roll < 0.7) {
        tier = Math.max(1, luckLevel - 1);
    } else {
        tier = Math.min(6, luckLevel + 1);
    }

    const event = await db.prepare(
        `SELECT e.id FROM events e
         WHERE e.trigger_type = 'passive' AND e.luck_tier = ? AND e.enabled = 1
         ORDER BY RANDOM() LIMIT 1`
    ).bind(tier).first();

    if (!event) return null;

    const expiresAt = new Date(new Date(nowISO).getTime() + 16 * 60 * 60 * 1000).toISOString();
    const eventId = generateGUID();

    await db.prepare(
        `INSERT INTO user_passive_events (id, user_id, event_id, status, generated_at, expires_at)
         VALUES (?, ?, ?, 'pending', ?, ?)`
    ).bind(eventId, userId, event.id, nowISO, expiresAt).run();

    return eventId;
}
