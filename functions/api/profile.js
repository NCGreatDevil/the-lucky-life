import { hashToken, corsHeaders } from '../../_utils.js';

function getUserPublicData(user) {
    return {
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
        createdAt: user.created_at,
        updatedAt: user.updated_at
    };
}

export async function onRequest(context) {
    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders() });
    }

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

    if (!session) {
        return new Response(JSON.stringify({ error: '会话已过期，请重新登录' }), {
            status: 401,
            headers: corsHeaders()
        });
    }

    if (context.request.method === 'GET') {
        try {
            const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first();

            if (!user) {
                return new Response(JSON.stringify({ error: '用户不存在' }), {
                    status: 404,
                    headers: corsHeaders()
                });
            }

            return new Response(JSON.stringify({
                success: true,
                user: getUserPublicData(user)
            }), {
                headers: corsHeaders()
            });

        } catch (error) {
            console.error('获取用户信息错误:', error);
            return new Response(JSON.stringify({ error: '服务器内部错误' }), {
                status: 500,
                headers: corsHeaders()
            });
        }
    }

    if (context.request.method === 'PUT') {
        try {
            const body = await context.request.json();
            const { nickname, birthday, gender, occupation, bio } = body;

            const now = Math.floor(Date.now() / 1000);
            const updates = [];
            const bindings = [];

            if (nickname) {
                const existingUser = await db.prepare('SELECT id FROM users WHERE nickname = ? AND id != ?').bind(nickname, session.user_id).first();
                if (existingUser) {
                    return new Response(JSON.stringify({ error: '该昵称已被使用' }), {
                        status: 409,
                        headers: corsHeaders()
                    });
                }
                updates.push('nickname = ?');
                bindings.push(nickname);
            }

            if (birthday) {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
                    return new Response(JSON.stringify({ error: '出生日期格式不正确' }), {
                        status: 400,
                        headers: corsHeaders()
                    });
                }
                updates.push('birthday = ?');
                bindings.push(birthday);
            }

            if (gender && ['male', 'female', 'other'].includes(gender)) {
                updates.push('gender = ?');
                bindings.push(gender);
            }

            if (occupation) {
                updates.push('occupation = ?');
                bindings.push(occupation);
            }

            if (bio !== undefined) {
                updates.push('bio = ?');
                bindings.push(bio);
            }

            if (updates.length === 0) {
                return new Response(JSON.stringify({ error: '没有要更新的字段' }), {
                    status: 400,
                    headers: corsHeaders()
                });
            }

            updates.push('updated_at = ?');
            bindings.push(now);
            bindings.push(session.user_id);

            await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();

            const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first();

            return new Response(JSON.stringify({
                success: true,
                message: '更新成功',
                user: getUserPublicData(user)
            }), {
                headers: corsHeaders()
            });

        } catch (error) {
            console.error('更新用户信息错误:', error);
            return new Response(JSON.stringify({ error: '服务器内部错误' }), {
                status: 500,
                headers: corsHeaders()
            });
        }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: corsHeaders()
    });
}
