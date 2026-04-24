import { generateSalt, hashPassword, generateToken, hashToken, generateGUID, corsHeaders } from '../_utils.js';

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
        const body = await context.request.json();
        const { nickname, password } = body;

        if (!nickname || !password) {
            return new Response(JSON.stringify({ error: '请填写昵称/用户ID和密码' }), {
                status: 400,
                headers: corsHeaders()
            });
        }

        const db = context.env['game-db'];

        const user = await db.prepare('SELECT * FROM users WHERE nickname = ? OR user_id = ?').bind(nickname, nickname).first();

        const ipAddress = context.request.headers.get('CF-Connecting-IP') || 'unknown';
        const userAgent = context.request.headers.get('User-Agent') || 'unknown';
        const now = Math.floor(Date.now() / 1000);

        if (!user) {
            await db.prepare(`
                INSERT INTO login_logs (user_id, session_id, event_type, ip_address, user_agent, created_at)
                VALUES (NULL, NULL, 'login_failed', ?, ?, ?)
            `).bind(ipAddress, userAgent, now).run();

            return new Response(JSON.stringify({ error: '昵称或密码错误' }), {
                status: 401,
                headers: corsHeaders()
            });
        }

        const passwordHash = await hashPassword(password, user.salt);

        if (passwordHash !== user.password_hash) {
            await db.prepare(`
                INSERT INTO login_logs (user_id, session_id, event_type, ip_address, user_agent, created_at)
                VALUES (?, NULL, 'login_failed', ?, ?, ?)
            `).bind(user.id, ipAddress, userAgent, now).run();

            return new Response(JSON.stringify({ error: '昵称或密码错误' }), {
                status: 401,
                headers: corsHeaders()
            });
        }

        const token = generateToken();
        const tokenHash = await hashToken(token);
        const sessionId = generateGUID();
        const expiresAt = now + (7 * 24 * 60 * 60);

        await db.prepare(`
            INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, user_agent, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(sessionId, user.id, tokenHash, expiresAt, now, userAgent, ipAddress).run();

        await db.prepare(`
            INSERT INTO login_logs (user_id, session_id, event_type, ip_address, user_agent, created_at)
            VALUES (?, ?, 'login_success', ?, ?, ?)
        `).bind(user.id, sessionId, ipAddress, userAgent, now).run();

        const { password_hash, salt, ...userWithoutSensitive } = user;

        return new Response(JSON.stringify({
            success: true,
            message: '登录成功',
            token,
            expiresAt,
            user: {
                id: user.user_id,
                nickname: user.nickname,
                birthday: user.birthday,
                gender: user.gender,
                occupation: user.occupation,
                bio: user.bio,
                luckiness: user.luckiness,
                charm: user.charm,
                wisdom: user.wisdom,
                courage: user.courage,
                wealth: user.wealth,
                health: user.health,
                tags: JSON.parse(user.tags || '[]'),
                createdAt: user.created_at
            }
        }), {
            headers: {
                ...corsHeaders(),
                'Set-Cookie': `session_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`
            }
        });

    } catch (error) {
        console.error('登录错误:', error);
        return new Response(JSON.stringify({ error: '服务器内部错误' }), {
            status: 500,
            headers: corsHeaders()
        });
    }
}
