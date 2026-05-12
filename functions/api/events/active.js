import { corsHeaders, getNowISO, generateGUID } from '../../_utils.js';
import { verifySession, selectEvent, getEventOptions, updateAttribute, updateFavorability, checkPersonEncounter, matchRealPlayer, getAttributeDisplayName, calculateEffectValue } from './_utils.js';

export async function onRequest(context) {
    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders(context) });
    }

    const session = await verifySession(context);
    if (!session) {
        return new Response(JSON.stringify({ error: '未登录或会话已过期' }), {
            status: 401,
            headers: corsHeaders(context)
        });
    }

    const db = context.env['game-db'];
    const userId = session.user_id;
    const now = getNowISO();

    try {
        const attrs = await db.prepare('SELECT * FROM user_attributes WHERE user_id = ?').bind(userId).first();
        if (!attrs) {
            return new Response(JSON.stringify({ error: '请先初始化角色属性' }), {
                status: 400,
                headers: corsHeaders(context)
            });
        }

        if (attrs.energy < 10) {
            return new Response(JSON.stringify({ error: '能量不足，无法触发事件' }), {
                status: 400,
                headers: corsHeaders(context)
            });
        }

        const luckLevel = attrs.luck_level;

        const tier = await drawEventTier(luckLevel);

        const encounter = await checkPersonEncounter(luckLevel);

        let category = 'normal';
        let npcId = null;
        let matchedUserId = null;

        if (encounter.encounter) {
            if (encounter.isNPC) {
                category = 'npc';
                const npcList = await db.prepare('SELECT id FROM npcs').all();
                if (npcList.results && npcList.results.length > 0) {
                    npcId = npcList.results[Math.floor(Math.random() * npcList.results.length)].id;
                }
            } else {
                category = 'friend';
                matchedUserId = await matchRealPlayer(db, userId, attrs);
                if (!matchedUserId) {
                    category = 'npc';
                    const npcList = await db.prepare('SELECT id FROM npcs').all();
                    if (npcList.results && npcList.results.length > 0) {
                        npcId = npcList.results[Math.floor(Math.random() * npcList.results.length)].id;
                    }
                }
            }
        }

        let event = null;
        if (category === 'npc' && npcId) {
            event = await selectEvent(db, tier, 'npc', userId);
            if (!event) {
                event = await selectEvent(db, tier, 'normal', userId);
            }
        } else if (category === 'friend' && matchedUserId) {
            event = await selectEvent(db, tier, 'friend', userId);
            if (!event) {
                event = await selectEvent(db, tier, 'normal', userId);
            }
        }

        if (!event) {
            event = await selectEvent(db, tier, 'normal', userId);
        }

        if (!event) {
            return new Response(JSON.stringify({ error: '暂无可用事件' }), {
                status: 404,
                headers: corsHeaders(context)
            });
        }

        const options = await getEventOptions(db, event.id);

        const newEnergy = Math.max(0, attrs.energy - 10);
        await db.prepare(
            'UPDATE user_attributes SET energy = ?, updated_at = ? WHERE user_id = ?'
        ).bind(newEnergy, now, userId).run();

        await db.prepare(
            `INSERT INTO user_event_triggers (id, user_id, event_id, trigger_count, last_triggered_at)
             VALUES (?, ?, ?, 1, ?)
             ON CONFLICT(user_id, event_id) DO UPDATE SET
                 trigger_count = trigger_count + 1,
                 last_triggered_at = excluded.last_triggered_at`
        ).bind(generateGUID(), userId, event.id, now).run();

        let encounterInfo = null;
        if (category === 'npc' && npcId) {
            const npc = await db.prepare('SELECT id, name, avatar, title FROM npcs WHERE id = ?').bind(npcId).first();
            const isFirst = await db.prepare(
                'SELECT id FROM user_favorability WHERE user_id = ? AND target_id = ? AND target_type = ?'
            ).bind(userId, npcId, 'npc').first();

            let favDelta = Math.floor(Math.random() * 50) + 1;
            if (!isFirst) favDelta *= 2;

            const newFav = await updateFavorability(db, userId, npcId, 'npc', favDelta);

            encounterInfo = {
                type: 'npc',
                npcId: npc.id,
                npcName: npc.name,
                npcAvatar: npc.avatar ? `https://fortunelife.pages.dev/r2?path=${npc.avatar}` : '',
                npcTitle: npc.title,
                favorabilityGained: favDelta,
                totalFavorability: newFav
            };
        } else if (category === 'friend' && matchedUserId) {
            const matchedUser = await db.prepare('SELECT user_id, nickname FROM users WHERE id = ?').bind(matchedUserId).first();
            const isFirst = await db.prepare(
                'SELECT id FROM user_favorability WHERE user_id = ? AND target_id = ? AND target_type = ?'
            ).bind(userId, matchedUserId, 'user').first();

            let favDelta = Math.floor(Math.random() * 50) + 1;
            if (!isFirst) favDelta *= 2;

            const newFav = await updateFavorability(db, userId, matchedUserId, 'user', favDelta);

            encounterInfo = {
                type: 'friend',
                userId: matchedUser.user_id,
                nickname: matchedUser.nickname,
                favorabilityGained: favDelta,
                totalFavorability: newFav
            };
        }

        return new Response(JSON.stringify({
            success: true,
            event: {
                id: event.id,
                name: event.name,
                description: event.description,
                imageUrl: event.image_url,
                category: event.category,
                options: options.map(o => ({
                    id: o.id,
                    order: o.option_order,
                    text: o.option_text,
                    effects: o.effects
                })),
                energyCost: 10,
                encounter: encounterInfo
            },
            currentEnergy: newEnergy,
            currentAttributes: {
                energy: newEnergy,
                vitality: attrs.vitality,
                morality: attrs.morality,
                intelligence: attrs.intelligence,
                constitution: attrs.constitution,
                charm: attrs.charm,
                willpower: attrs.willpower,
                emotion: attrs.emotion,
                popularity: attrs.popularity,
                money: attrs.money,
                luck: attrs.luck
            }
        }), {
            headers: corsHeaders(context)
        });

    } catch (error) {
        console.error('触发主动事件错误:', error);
        return new Response(JSON.stringify({ error: '服务器内部错误', details: error.message }), {
            status: 500,
            headers: corsHeaders(context)
        });
    }
}

async function drawEventTier(luckLevel) {
    const roll = Math.random();
    if (roll < 0.5) {
        return luckLevel;
    } else if (roll < 0.7) {
        return Math.max(1, luckLevel - 1);
    } else {
        return Math.min(6, luckLevel + 1);
    }
}
