import { hashToken, corsHeaders } from '../_utils.js';

export async function onRequest(context) {
    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders() });
    }

    if (context.request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: corsHeaders()
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
                headers: corsHeaders()
            });
        }

        const db = context.env.DB;
        const tokenHash = await hashToken(token);

        const session = await db.prepare('SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?').bind(tokenHash, Math.floor(Date.now() / 1000)).first();

        if (session) {
            await db.prepare('DELETE FROM sessions WHERE id = ?').bind(session.id).run();
        }

        return new Response(JSON.stringify({ success: true, message: '已退出登录' }), {
            headers: {
                ...corsHeaders(),
                'Set-Cookie': 'session_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
            }
        });

    } catch (error) {
        console.error('退出登录错误:', error);
        return new Response(JSON.stringify({ error: '服务器内部错误' }), {
            status: 500,
            headers: corsHeaders()
        });
    }
}
