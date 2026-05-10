import { corsHeaders, getNowISO, generateGUID } from '../../../_utils.js';
import { verifySession } from '../_utils.js';

export async function onRequest(context) {
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
        const { eventId, isPending } = body;

        if (!eventId) {
            return new Response(JSON.stringify({ error: '缺少事件ID' }), {
                status: 400,
                headers: corsHeaders(context)
            });
        }

        const event = await db.prepare(
            'SELECT id, name, trigger_type FROM events WHERE id = ?'
        ).bind(eventId).first();

        if (!event) {
            return new Response(JSON.stringify({ error: '事件不存在' }), {
                status: 404,
                headers: corsHeaders(context)
            });
        }

        if (isPending) {
            await db.prepare(
                'UPDATE user_passive_events SET status = ? WHERE id = ? AND user_id = ?'
            ).bind('skipped', eventId, userId).run();
        }

        await db.prepare(
            `INSERT INTO user_event_history (id, user_id, event_type, event_title, choice, changes, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            generateGUID(),
            userId,
            event.trigger_type === 'active' ? 'active' : 'passive',
            event.name,
            '跳过',
            JSON.stringify({}),
            now
        ).run();

        const updatedAttrs = await db.prepare('SELECT * FROM user_attributes WHERE user_id = ?').bind(userId).first();

        return new Response(JSON.stringify({
            success: true,
            message: '已跳过事件',
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
        console.error('跳过事件错误:', error);
        return new Response(JSON.stringify({ error: '服务器内部错误', details: error.message }), {
            status: 500,
            headers: corsHeaders(context)
        });
    }
}
