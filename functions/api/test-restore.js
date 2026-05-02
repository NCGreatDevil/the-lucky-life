import { corsHeaders, getNowISO, isISOExpired } from '../_utils.js';

export async function onRequestPost(context) {
    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders(context) });
    }

    if (context.request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: corsHeaders(context)
        });
    }

    try {
        const cookieHeader = context.request.headers.get('Cookie') || '';
        const cookies = Object.fromEntries(
            cookieHeader.split(';').map(c => {
                const [key, ...val] = c.trim().split('=');
                return [key, val.join('=')];
            })
        );

        const token = cookies.session_token;

        if (!token) {
            return new Response(JSON.stringify({ error: '未登录' }), {
                status: 401,
                headers: corsHeaders(context)
            });
        }

        const db = context.env['game-db'];
        const tokenHashArray = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
        const tokenHash = Array.from(new Uint8Array(tokenHashArray), b => b.toString(16).padStart(2, '0')).join('');

        const session = await db.prepare('SELECT * FROM sessions WHERE token_hash = ?').bind(tokenHash).first();
        if (!session || isISOExpired(session.expires_at)) {
            return new Response(JSON.stringify({ error: '会话已过期，请重新登录' }), {
                status: 401,
                headers: corsHeaders(context)
            });
        }

        const userId = session.user_id;

        // 恢复能量和活力到100
        const now = getNowISO();
        await db.prepare(
            'UPDATE user_attributes SET energy = 100, vitality = 100, updated_at = ? WHERE user_id = ?'
        ).bind(now, userId).run();

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
