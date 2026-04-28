import { generateToken, hashToken, generateGUID, corsHeaders, verifyPassword, getNowISO, addSecondsToISO, isISOExpired } from '../_utils.js';

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

    try {
        const body = await context.request.json();
        const { nickname, password } = body;

        if (!nickname || !password) {
            return new Response(JSON.stringify({ error: '请填写用户ID和密码' }), {
                status: 400,
                headers: corsHeaders(context)
            });
        }

        const db = context.env['game-db'];

        const user = await db.prepare('SELECT * FROM users WHERE nickname = ? OR user_id = ?').bind(nickname, nickname).first();

        const ipAddress = context.request.headers.get('CF-Connecting-IP') || 'unknown';
        const userAgent = context.request.headers.get('User-Agent') || 'unknown';
        const now = getNowISO();

        if (!user) {
            await db.prepare(`
                INSERT INTO login_logs (user_id, session_id, event_type, ip_address, user_agent, created_at)
                VALUES (NULL, NULL, 'login_failed', ?, ?, ?)
            `).bind(ipAddress, userAgent, now).run();

            return new Response(JSON.stringify({ error: '用户ID或密码错误' }), {
                status: 401,
                headers: corsHeaders(context)
            });
        }

        const { password_hash, salt, ...userWithoutSensitive } = user;

        const passwordMatch = await verifyPassword(password, salt, password_hash);

        if (!passwordMatch) {
            await db.prepare(`
                INSERT INTO login_logs (user_id, session_id, event_type, ip_address, user_agent, created_at)
                VALUES (?, NULL, 'login_failed', ?, ?, ?)
            `).bind(user.id, ipAddress, userAgent, now).run();

            return new Response(JSON.stringify({ error: '用户ID或密码错误' }), {
                status: 401,
                headers: corsHeaders(context)
            });
        }

        const token = generateToken();
        const tokenHashArray = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
        const tokenHash = Array.from(new Uint8Array(tokenHashArray), b => b.toString(16).padStart(2, '0')).join('');
        const sessionId = generateGUID();
        const expiresAt = addSecondsToISO(now, 7 * 24 * 60 * 60);

        await db.prepare(`
            INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, user_agent, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(sessionId, user.id, tokenHash, expiresAt, now, userAgent, ipAddress).run();

        await db.prepare(`
            INSERT INTO login_logs (user_id, session_id, event_type, ip_address, user_agent, created_at)
            VALUES (?, ?, 'login_success', ?, ?, ?)
        `).bind(user.id, sessionId, ipAddress, userAgent, now).run();

        return new Response(JSON.stringify({
            success: true,
            message: '登录成功',
            user: {
                id: user.user_id,
                nickname: user.nickname,
                birthday: user.birthday,
                gender: user.gender,
                occupation: user.occupation,
                bio: user.bio,
                createdAt: user.created_at
            }
        }), {
            headers: {
                ...corsHeaders(context),
                'Set-Cookie': `session_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`
            }
        });

    } catch (error) {
        console.error('登录错误:', error);
        return new Response(JSON.stringify({ error: '服务器内部错误' }), {
            status: 500,
            headers: corsHeaders(context)
        });
    }
}