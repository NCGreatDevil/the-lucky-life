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

        const pendingEvents = await db.prepare(
            `SELECT upe.id, upe.event_id, upe.status, upe.generated_at, upe.expires_at,
                    e.name, e.description, e.image_url, e.category, e.npc_id
             FROM user_passive_events upe
             JOIN events e ON upe.event_id = e.id
             WHERE upe.user_id = ? AND upe.status = 'pending' AND upe.expires_at > ?
             ORDER BY upe.generated_at DESC`
        ).bind(userId, now).all();

        const events = (pendingEvents.results || []).map(e => ({
            id: e.id,
            eventId: e.event_id,
            name: e.name,
            description: e.description,
            imageUrl: e.image_url,
            category: e.category,
            generatedAt: e.generated_at,
            expiresAt: e.expires_at
        }));

        return new Response(JSON.stringify({
            success: true,
            events,
            count: events.length
        }), {
            headers: corsHeaders(context)
        });

    } catch (error) {
        console.error('获取被动事件错误:', error);
        return new Response(JSON.stringify({ error: '服务器内部错误' }), {
            status: 500,
            headers: corsHeaders(context)
        });
    }
}
