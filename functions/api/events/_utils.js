import { corsHeaders, hashToken, isISOExpired, getNowISO, generateGUID, calculateLuckLevel } from '../_utils.js';

export async function verifySession(context) {
    const cookieHeader = context.request.headers.get('Cookie') || '';
    const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
            const [key, ...val] = c.trim().split('=');
            return [key, val.join('=')];
        })
    );

    const token = cookies.session_token;
    if (!token) {
        return null;
    }

    const db = context.env['game-db'];
    const tokenHash = await hashToken(token);
    const session = await db.prepare('SELECT * FROM sessions WHERE token_hash = ?').bind(tokenHash).first();

    if (!session || isISOExpired(session.expires_at)) {
        return null;
    }

    return session;
}

export function applyLuckCorrection(min, max, luckLevel) {
    const span = max - min;
    if (span <= 1) return { min, max };

    const p = (luckLevel - 1) / 5;
    const actualMin = Math.round(min + p * (span - 1));
    const actualMax = Math.round(max - (1 - p) * (span - 1));

    return { min: actualMin, max: actualMax };
}

export function randomInRange(min, max) {
    if (min > max) return min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getAttributeDisplayName(attr) {
    const map = {
        energy: '能量',
        vitality: '活力',
        morality: '道德',
        intelligence: '智力',
        constitution: '体质',
        charm: '魅力',
        willpower: '意志',
        emotion: '情绪',
        popularity: '人缘',
        money: '金钱',
        luck: '运气'
    };
    return map[attr] || attr;
}

export const NO_LUCK_CORRECTION_ATTRS = ['money', 'energy', 'vitality'];

export function calculateEffectValue(attr, range, luckLevel) {
    const [min, max] = range;
    let actualMin = min;
    let actualMax = max;

    if (!NO_LUCK_CORRECTION_ATTRS.includes(attr)) {
        const corrected = applyLuckCorrection(min, max, luckLevel);
        actualMin = corrected.min;
        actualMax = corrected.max;
    }

    return randomInRange(actualMin, actualMax);
}

export async function drawEventTier(luckLevel) {
    const roll = Math.random();
    let tier;
    if (roll < 0.5) {
        tier = luckLevel;
    } else if (roll < 0.7) {
        tier = Math.max(1, luckLevel - 1);
    } else {
        tier = Math.min(6, luckLevel + 1);
    }
    return tier;
}

export async function checkPersonEncounter(luckLevel) {
    const probability = (15 + luckLevel) / 100;
    const roll = Math.random();
    if (roll >= probability) {
        return { encounter: false };
    }

    const isNPC = Math.random() < 0.5;
    return { encounter: true, isNPC };
}

export async function selectEvent(db, targetTier, category, userId) {
    const candidates = await db.prepare(
        `SELECT e.id, e.name, e.description, e.image_url, e.category, e.trigger_type, e.npc_id, e.luck_tier
         FROM events e
         WHERE e.luck_tier = ? AND e.category = ? AND e.enabled = 1`
    ).bind(targetTier, category).all();

    if (!candidates.results || candidates.results.length === 0) {
        return null;
    }

    const eventIds = candidates.results.map(e => e.id);
    const placeholders = eventIds.map(() => '?').join(',');

    const triggers = await db.prepare(
        `SELECT event_id, trigger_count FROM user_event_triggers WHERE user_id = ? AND event_id IN (${placeholders})`
    ).bind(userId, ...eventIds).all();

    const triggerMap = {};
    if (triggers.results) {
        triggers.results.forEach(t => {
            triggerMap[t.event_id] = t.trigger_count;
        });
    }

    const untriggered = candidates.results.filter(e => !triggerMap[e.id] || triggerMap[e.id] === 0);

    let pool;
    if (untriggered.length > 0) {
        pool = untriggered;
    } else {
        pool = candidates.results;
    }

    const selected = pool[Math.floor(Math.random() * pool.length)];
    return selected;
}

export async function getEventOptions(db, eventId) {
    const options = await db.prepare(
        `SELECT id, option_order, option_text, effects FROM event_options WHERE event_id = ? ORDER BY option_order`
    ).bind(eventId).all();
    return options.results || [];
}

export async function updateAttribute(db, userId, attr, delta, currentLuckLevel) {
    if (attr === 'luck') {
        const attrs = await db.prepare('SELECT luck FROM user_attributes WHERE user_id = ?').bind(userId).first();
        const newLuck = Math.max(0, Math.min(100, (attrs?.luck || 50) + delta));
        const newLuckLevel = calculateLuckLevel(newLuck);
        await db.prepare(
            'UPDATE user_attributes SET luck = ?, luck_level = ?, updated_at = ? WHERE user_id = ?'
        ).bind(newLuck, newLuckLevel, getNowISO(), userId).run();
        return { attr, delta, newValue: newLuck, newLuckLevel };
    }

    if (attr === 'energy') {
        const attrs = await db.prepare('SELECT energy FROM user_attributes WHERE user_id = ?').bind(userId).first();
        const newEnergy = Math.max(0, Math.min(100, (attrs?.energy || 80) + delta));
        await db.prepare(
            'UPDATE user_attributes SET energy = ?, updated_at = ? WHERE user_id = ?'
        ).bind(newEnergy, getNowISO(), userId).run();
        return { attr, delta, newValue: newEnergy };
    }

    if (attr === 'vitality') {
        const attrs = await db.prepare('SELECT vitality FROM user_attributes WHERE user_id = ?').bind(userId).first();
        const newVitality = Math.max(0, Math.min(100, (attrs?.vitality || 60) + delta));
        await db.prepare(
            'UPDATE user_attributes SET vitality = ?, updated_at = ? WHERE user_id = ?'
        ).bind(newVitality, getNowISO(), userId).run();
        return { attr, delta, newValue: newVitality };
    }

    if (attr === 'money') {
        const attrs = await db.prepare('SELECT money FROM user_attributes WHERE user_id = ?').bind(userId).first();
        const newMoney = Math.max(0, (attrs?.money || 0) + delta);
        await db.prepare(
            'UPDATE user_attributes SET money = ?, updated_at = ? WHERE user_id = ?'
        ).bind(newMoney, getNowISO(), userId).run();
        return { attr, delta, newValue: newMoney };
    }

    const attrMap = {
        morality: 'morality',
        intelligence: 'intelligence',
        constitution: 'constitution',
        charm: 'charm',
        willpower: 'willpower',
        emotion: 'emotion',
        popularity: 'popularity'
    };

    if (attrMap[attr]) {
        const attrs = await db.prepare(`SELECT ${attrMap[attr]} FROM user_attributes WHERE user_id = ?`).bind(userId).first();
        const currentVal = attrs?.[attrMap[attr]] || 0;
        const newVal = currentVal + delta;
        await db.prepare(
            `UPDATE user_attributes SET ${attrMap[attr]} = ?, updated_at = ? WHERE user_id = ?`
        ).bind(newVal, getNowISO(), userId).run();
        return { attr, delta, newValue: newVal };
    }

    return { attr, delta, newValue: 0 };
}

export async function updateFavorability(db, userId, targetId, targetType, delta) {
    const now = getNowISO();
    const existing = await db.prepare(
        'SELECT id, favorability FROM user_favorability WHERE user_id = ? AND target_id = ? AND target_type = ?'
    ).bind(userId, targetId, targetType).first();

    if (existing) {
        const newFav = Math.max(0, existing.favorability + delta);
        await db.prepare(
            'UPDATE user_favorability SET favorability = ?, updated_at = ? WHERE id = ?'
        ).bind(newFav, now, existing.id).run();
        return newFav;
    } else {
        const id = generateGUID();
        await db.prepare(
            'INSERT INTO user_favorability (id, user_id, target_id, target_type, favorability, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, userId, targetId, targetType, delta, now, now).run();
        return delta;
    }
}

export function getFavorabilityLevel(exp) {
    if (exp < 100) return 0;
    let n = 1;
    while (100 * n * (n + 1) / 2 <= exp) n++;
    return n - 1;
}

export async function matchRealPlayer(db, currentUserId, currentUserAttrs) {
    const longTermAttrs = ['morality', 'intelligence', 'constitution', 'charm', 'willpower', 'emotion', 'popularity'];

    const attrValues = longTermAttrs.map(attr => ({
        name: attr,
        value: currentUserAttrs[attr] || 0
    }));

    const allZero = attrValues.every(a => a.value === 0);
    if (allZero) return null;

    attrValues.sort((a, b) => b.value - a.value);
    const top3 = attrValues.slice(0, 3);

    const friends = await db.prepare(
        'SELECT friend_id FROM user_friends WHERE user_id = ? AND is_npc = 0'
    ).bind(currentUserId).all();
    const friendIds = new Set((friends.results || []).map(f => f.friend_id));

    const candidates = await db.prepare(
        'SELECT id FROM users WHERE id != ?'
    ).bind(currentUserId).all();

    if (!candidates.results || candidates.results.length === 0) return null;

    const scored = [];

    for (const candidate of candidates.results) {
        if (friendIds.has(candidate.id)) continue;

        const candAttrs = await db.prepare(
            `SELECT ${longTermAttrs.join(', ')} FROM user_attributes WHERE user_id = ?`
        ).bind(candidate.id).first();

        if (!candAttrs) continue;

        const candAttrValues = longTermAttrs.map(attr => ({
            name: attr,
            value: candAttrs[attr] || 0
        }));
        candAttrValues.sort((a, b) => b.value - a.value);
        const candTop3 = candAttrValues.slice(0, 3);

        const matchCount = top3.filter(a => candTop3.some(c => c.name === a.name)).length;

        if (matchCount < 2) continue;

        const personalityScore = matchCount * 1.2;

        const w = [0.7, 0.2, 0.1];
        let diff = 0;
        let weightSum = 0;

        for (let i = 0; i < 3; i++) {
            const playerAttr = top3[i];
            const matchAttr = candTop3.find(c => c.name === playerAttr.name);
            if (matchAttr) {
                const playerVal = Math.max(playerAttr.value, 1);
                diff += w[i] * Math.abs(matchAttr.value - playerAttr.value) / playerVal;
                weightSum += w[i];
            }
        }

        if (weightSum > 0 && weightSum < 1) {
            diff = diff / weightSum * (w[0] + w[1] + w[2]);
        }

        const compositeScore = personalityScore * (1 - Math.min(diff, 1));
        scored.push({ userId: candidate.id, score: compositeScore });
    }

    if (scored.length === 0) return null;

    scored.sort((a, b) => b.score - a.score);
    const topN = scored.slice(0, 5);
    const selected = topN[Math.floor(Math.random() * topN.length)];

    return selected.userId;
}
