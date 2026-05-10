import { corsHeaders, getNowISO, generateGUID } from '../../_utils.js';
import { verifySession, selectEvent, getEventOptions, updateAttribute, updateFavorability, checkPersonEncounter, matchRealPlayer, getAttributeDisplayName, calculateEffectValue, getFavorabilityLevel } from './_utils.js';

export async function onRequest(context, eventId) {
    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders(context) });
    }

    if (context.request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: corsHeaders(context)
        });
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
        const body = await context.request.json();
        const { optionId, passiveEventId } = body;

        if (!optionId) {
            return new Response(JSON.stringify({ error: '请选择一个选项' }), {
                status: 400,
                headers: corsHeaders(context)
            });
        }

        const option = await db.prepare(
            'SELECT id, event_id, option_text, effects FROM event_options WHERE id = ?'
        ).bind(optionId).first();

        if (!option) {
            return new Response(JSON.stringify({ error: '选项不存在' }), {
                status: 404,
                headers: corsHeaders(context)
            });
        }

        const event = await db.prepare(
            'SELECT id, name, category, trigger_type, npc_id FROM events WHERE id = ?'
        ).bind(option.event_id).first();

        if (!event) {
            return new Response(JSON.stringify({ error: '事件不存在' }), {
                status: 404,
                headers: corsHeaders(context)
            });
        }

        const attrs = await db.prepare('SELECT * FROM user_attributes WHERE user_id = ?').bind(userId).first();
        const luckLevel = attrs.luck_level;

        if (event.trigger_type === 'passive' && passiveEventId) {
            if (attrs.energy < 5) {
                return new Response(JSON.stringify({ error: '能量不足，无法处理此事件' }), {
                    status: 400,
                    headers: corsHeaders(context)
                });
            }

            await db.prepare(
                'UPDATE user_passive_events SET status = ? WHERE id = ? AND user_id = ?'
            ).bind('resolved', passiveEventId, userId).run();

            const newEnergy = Math.max(0, attrs.energy - 5);
            await db.prepare(
                'UPDATE user_attributes SET energy = ?, updated_at = ? WHERE user_id = ?'
            ).bind(newEnergy, now, userId).run();
        }

        const effects = JSON.parse(option.effects || '[]');

        const insufficientAttrs = [];
        for (const effect of effects) {
            const { attr, range } = effect;
            const [minVal, maxVal] = range;
            const worstDelta = minVal;

            if (worstDelta < 0) {
                const attrMap = {
                    energy: 'energy',
                    vitality: 'vitality',
                    morality: 'morality',
                    intelligence: 'intelligence',
                    constitution: 'constitution',
                    charm: 'charm',
                    willpower: 'willpower',
                    emotion: 'emotion',
                    popularity: 'popularity',
                    money: 'money',
                    luck: 'luck'
                };

                const attrName = attrMap[attr];
                if (attrName) {
                    const currentVal = attrs[attrName] || 0;
                    if (currentVal + worstDelta < 0) {
                        insufficientAttrs.push(getAttributeDisplayName(attr));
                    }
                }
            }
        }

        if (insufficientAttrs.length > 0) {
            return new Response(JSON.stringify({
                error: '属性不足',
                message: `${insufficientAttrs.join('、')}不足，无法选择此选项`,
                insufficientAttrs
            }), {
                status: 400,
                headers: corsHeaders(context)
            });
        }

        const changes = {};

        for (const effect of effects) {
            const { attr, range } = effect;
            const value = calculateEffectValue(attr, range, luckLevel);
            const result = await updateAttribute(db, userId, attr, value, luckLevel);
            changes[getAttributeDisplayName(attr)] = value;
        }

        await db.prepare(
            `INSERT INTO user_event_history (id, user_id, event_type, event_title, choice, changes, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            generateGUID(),
            userId,
            event.trigger_type === 'active' ? 'active' : 'passive',
            event.name,
            option.option_text,
            JSON.stringify(changes),
            now
        ).run();

        let encounterInfo = null;
        if (event.category === 'npc' && event.npc_id) {
            const npc = await db.prepare('SELECT id, name, avatar, title FROM npcs WHERE id = ?').bind(event.npc_id).first();
            const fav = await db.prepare(
                'SELECT favorability FROM user_favorability WHERE user_id = ? AND target_id = ? AND target_type = ?'
            ).bind(userId, event.npc_id, 'npc').first();

            encounterInfo = {
                type: 'npc',
                npcId: npc?.id,
                npcName: npc?.name,
                npcAvatar: npc?.avatar,
                npcTitle: npc?.title,
                totalFavorability: fav?.favorability || 0,
                favorabilityLevel: getFavorabilityLevel(fav?.favorability || 0)
            };
        } else if (event.category === 'friend') {
            const fav = await db.prepare(
                'SELECT favorability FROM user_favorability WHERE user_id = ? AND target_type = ?'
            ).bind(userId, 'user').first();

            encounterInfo = {
                type: 'friend',
                totalFavorability: fav?.favorability || 0,
                favorabilityLevel: getFavorabilityLevel(fav?.favorability || 0)
            };
        }

        const updatedAttrs = await db.prepare('SELECT * FROM user_attributes WHERE user_id = ?').bind(userId).first();

        return new Response(JSON.stringify({
            success: true,
            event: {
                name: event.name,
                choice: option.option_text,
                changes,
                encounter: encounterInfo
            },
            attributes: {
                energy: updatedAttrs.energy,
                vitality: updatedAttrs.vitality,
                morality: updatedAttrs.morality,
                intelligence: updatedAttrs.intelligence,
                constitution: updatedAttrs.constitution,
                charm: updatedAttrs.charm,
                willpower: updatedAttrs.willpower,
                emotion: updatedAttrs.emotion,
                popularity: updatedAttrs.popularity,
                money: updatedAttrs.money,
                luck: updatedAttrs.luck,
                luckLevel: updatedAttrs.luck_level
            }
        }), {
            headers: corsHeaders(context)
        });

    } catch (error) {
        console.error('事件选项结算错误:', error);
        return new Response(JSON.stringify({ error: '服务器内部错误' }), {
            status: 500,
            headers: corsHeaders(context)
        });
    }
}
