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
    const now = getNowISO();

    try {
        const pendingCount = await db.prepare(
            `SELECT COUNT(*) as count FROM user_passive_events
             WHERE user_id = ? AND status = 'pending' AND expires_at > ?`
        ).bind(userId, now).first();

        return new Response(JSON.stringify({
            success: true,
            count: pendingCount?.count || 0
        }), {
            headers: corsHeaders(context)
        });

    } catch (error) {
        console.error('获取待处理事件数量错误:', error);
        return new Response(JSON.stringify({ error: '服务器内部错误' }), {
            status: 500,
            headers: corsHeaders(context)
        });
    }
}
