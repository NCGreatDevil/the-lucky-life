import { corsHeaders, getNowISO } from '../../_utils.js';
import { verifySession } from './_utils.js';

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

    try {
        const history = await db.prepare(
            `SELECT id, event_type, event_title, choice, changes, timestamp
             FROM user_event_history
             WHERE user_id = ?
             ORDER BY timestamp DESC
             LIMIT 50`
        ).bind(userId).all();

        return new Response(JSON.stringify({
            success: true,
            history: history.results || []
        }), {
            headers: corsHeaders(context)
        });

    } catch (error) {
        console.error('获取事件历史错误:', error);
        return new Response(JSON.stringify({ error: '服务器内部错误' }), {
            status: 500,
            headers: corsHeaders(context)
        });
    }
}
