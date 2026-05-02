import { hashToken, corsHeaders, getNowISO, isISOExpired } from '../_utils.js';

export async function onRequestPost(context) {
    try {
        const db = context.env.DB;
        const request = context.request;

        // 验证用户身份
        const cookie = request.headers.get('Cookie') || '';
        const sessionMatch = cookie.match(/session_token=([^;]+)/);
        if (!sessionMatch) {
            return new Response(JSON.stringify({ error: '未登录' }), {
                status: 401,
                headers: corsHeaders(context)
            });
        }

        const sessionToken = sessionMatch[1];
        const session = await db.prepare(
            'SELECT s.*, u.id as user_id FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token_hash = ? AND s.expires_at > ?'
        ).bind(hashToken(sessionToken), getNowISO()).first();

        if (!session) {
            return new Response(JSON.stringify({ error: '会话无效或已过期' }), {
                status: 401,
                headers: corsHeaders(context)
            });
        }

        const userId = session.user_id;

        // 恢复能量和活力到100
        await db.prepare(
            'UPDATE user_attributes SET energy = 100, vitality = 100, updated_at = ? WHERE user_id = ?'
        ).bind(getNowISO(), userId).run();

        return new Response(JSON.stringify({ success: true }), {
            headers: corsHeaders(context)
        });
    } catch (error) {
        console.error('Test restore error:', error);
        return new Response(JSON.stringify({ error: '服务器错误' }), {
            status: 500,
            headers: corsHeaders(context)
        });
    }
}
