import { generateSalt, hashPassword, generateGUID, generateUserId, calculateAttributes, calculateTags, corsHeaders } from '../_utils.js';

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
        const { nickname, birthday, gender, occupation, bio, password } = body;

        if (!nickname || !birthday || !gender || !occupation || !password) {
            return new Response(JSON.stringify({ error: '缺少必填字段' }), {
                status: 400,
                headers: corsHeaders()
            });
        }

        if (!['male', 'female', 'other'].includes(gender)) {
            return new Response(JSON.stringify({ error: '性别格式不正确' }), {
                status: 400,
                headers: corsHeaders()
            });
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
            return new Response(JSON.stringify({ error: '出生日期格式不正确，请使用 YYYY-MM-DD 格式' }), {
                status: 400,
                headers: corsHeaders()
            });
        }

        if (password.length < 6) {
            return new Response(JSON.stringify({ error: '密码长度至少为6位' }), {
                status: 400,
                headers: corsHeaders()
            });
        }

        const db = context.env['game-db'];

        const existingUser = await db.prepare('SELECT id FROM users WHERE nickname = ?').bind(nickname).first();
        if (existingUser) {
            return new Response(JSON.stringify({ error: '该昵称已被注册' }), {
                status: 409,
                headers: corsHeaders()
            });
        }

        const userId = generateUserId();
        const salt = generateSalt();
        const passwordHash = await hashPassword(password, salt);
        const id = generateGUID();
        const now = Math.floor(Date.now() / 1000);

        const attributes = calculateAttributes(birthday, gender, occupation);
        const tags = calculateTags(birthday, gender, occupation);

        await db.prepare(`
            INSERT INTO users (id, user_id, nickname, birthday, gender, occupation, bio, password_hash, salt, luckiness, charm, wisdom, courage, wealth, health, tags, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id, userId, nickname, birthday, gender, occupation, bio || '',
            passwordHash, salt,
            attributes.luckiness, attributes.charm, attributes.wisdom,
            attributes.courage, attributes.wealth, attributes.health,
            JSON.stringify(tags), now, now
        ).run();

        return new Response(JSON.stringify({
            success: true,
            message: '注册成功',
            user: {
                id: userId,
                nickname,
                birthday,
                gender,
                occupation
            }
        }), {
            headers: corsHeaders()
        });

    } catch (error) {
        console.error('注册错误:', error);
        return new Response(JSON.stringify({ error: '服务器内部错误' }), {
            status: 500,
            headers: corsHeaders()
        });
    }
}
