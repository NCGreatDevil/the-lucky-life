import { corsHeaders, getNowISO } from '../../_utils.js';
import { verifySession } from '../events/_utils.js';

export async function onRequest(context, requestId) {
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
        const request = await db.prepare(
            'SELECT id, requester_id, receiver_id, status FROM user_friend_requests WHERE id = ?'
        ).bind(requestId).first();

        if (!request) {
            return new Response(JSON.stringify({ error: '好友申请不存在' }), {
                status: 404,
                headers: corsHeaders(context)
            });
        }

        if (request.receiver_id !== userId) {
            return new Response(JSON.stringify({ error: '无权操作此申请' }), {
                status: 403,
                headers: corsHeaders(context)
            });
        }

        if (request.status !== 'pending') {
            return new Response(JSON.stringify({ error: '该申请已处理' }), {
                status: 400,
                headers: corsHeaders(context)
            });
        }

        await db.prepare(
            'UPDATE user_friend_requests SET status = ?, updated_at = ? WHERE id = ?'
        ).bind('rejected', now, requestId).run();

        await db.prepare(
            'UPDATE user_favorability SET favorability = 99, updated_at = ? WHERE user_id = ? AND target_id = ? AND target_type = ?'
        ).bind(now, request.requester_id, userId, 'user').run();

        return new Response(JSON.stringify({
            success: true,
            message: '已拒绝好友申请'
        }), {
            headers: corsHeaders(context)
        });

    } catch (error) {
        console.error('拒绝好友申请错误:', error);
        return new Response(JSON.stringify({ error: '服务器内部错误' }), {
            status: 500,
            headers: corsHeaders(context)
        });
    }
}
