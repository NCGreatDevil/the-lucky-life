import { corsHeaders, getNowISO, generateGUID } from '../../_utils.js';
import { verifySession } from '../events/_utils.js';

export async function onRequest(context, targetId) {
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
        await db.prepare(
            'UPDATE user_favorability SET favorability = 99, updated_at = ? WHERE user_id = ? AND target_id = ?'
        ).bind(now, userId, targetId).run();

        return new Response(JSON.stringify({
            success: true,
            message: '已忽略'
        }), {
            headers: corsHeaders(context)
        });

    } catch (error) {
        console.error('忽略错误:', error);
        return new Response(JSON.stringify({ error: '服务器内部错误' }), {
            status: 500,
            headers: corsHeaders(context)
        });
    }
}
