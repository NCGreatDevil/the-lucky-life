import { hashToken, corsHeaders, getNowISO, isISOExpired } from '../_utils.js';

export async function onRequest(context) {
    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders(context) });
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

    if (context.request.method === 'GET') {
        try {
            const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first();

            if (!user) {
                return new Response(JSON.stringify({ error: '用户不存在' }), {
                    status: 404,
                    headers: corsHeaders(context)
                });
            }

            const attrs = await db.prepare('SELECT * FROM user_attributes WHERE user_id = ?').bind(session.user_id).first();

            return new Response(JSON.stringify({
                success: true,
                user: {
                    id: user.user_id,
                    nickname: user.nickname,
                    birthday: user.birthday,
                    gender: user.gender,
                    occupation: user.occupation,
                    bio: user.bio,
                    createdAt: user.created_at,
                    updatedAt: user.updated_at,
                    attributes: attrs ? {
                        energy: attrs.energy,
                        vitality: attrs.vitality,
                        morality: attrs.morality,
                        intelligence: attrs.intelligence,
                        constitution: attrs.constitution,
                        charm: attrs.charm,
                        willpower: attrs.willpower,
                        emotion: attrs.emotion,
                        popularity: attrs.popularity,
                        money: attrs.money,
                        luckLevel: attrs.luck_level,
                        luckLabel: getLuckLabel(attrs.luck_level),
                        updatedAt: attrs.updated_at
                    } : null
                }
            }), {
                headers: corsHeaders(context)
            });

        } catch (error) {
            console.error('获取用户信息错误:', error);
            return new Response(JSON.stringify({ error: '服务器内部错误' }), {
                status: 500,
                headers: corsHeaders(context)
            });
        }
    }

    if (context.request.method === 'PUT') {
        try {
            const body = await context.request.json();
            const { nickname, birthday, gender, occupation, bio } = body;

            const now = getNowISO();
            const updates = [];
            const bindings = [];

            if (nickname) {
                const existingUser = await db.prepare('SELECT id FROM users WHERE nickname = ? AND id != ?').bind(nickname, session.user_id).first();
                if (existingUser) {
                    return new Response(JSON.stringify({ error: '该昵称已被使用' }), {
                        status: 409,
                        headers: corsHeaders(context)
                    });
                }
                updates.push('nickname = ?');
                bindings.push(nickname);
            }

            if (birthday) {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
                    return new Response(JSON.stringify({ error: '出生日期格式不正确' }), {
                        status: 400,
                        headers: corsHeaders(context)
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

            if (updates.length > 0) {
                updates.push('updated_at = ?');
                bindings.push(now);
                bindings.push(session.user_id);

                await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();
            }

            const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first();
            const attrs = await db.prepare('SELECT * FROM user_attributes WHERE user_id = ?').bind(session.user_id).first();

            return new Response(JSON.stringify({
                success: true,
                message: '更新成功',
                user: {
                    id: user.user_id,
                    nickname: user.nickname,
                    birthday: user.birthday,
                    gender: user.gender,
                    occupation: user.occupation,
                    bio: user.bio,
                    createdAt: user.created_at,
                    updatedAt: user.updated_at,
                    attributes: attrs ? {
                        energy: attrs.energy,
                        vitality: attrs.vitality,
                        morality: attrs.morality,
                        intelligence: attrs.intelligence,
                        constitution: attrs.constitution,
                        charm: attrs.charm,
                        willpower: attrs.willpower,
                        emotion: attrs.emotion,
                        popularity: attrs.popularity,
                        money: attrs.money,
                        luckLevel: attrs.luck_level,
                        luckLabel: getLuckLabel(attrs.luck_level),
                        updatedAt: attrs.updated_at
                    } : null
                }
            }), {
                headers: corsHeaders(context)
            });

        } catch (error) {
            console.error('更新用户信息错误:', error);
            return new Response(JSON.stringify({ error: '服务器内部错误' }), {
                status: 500,
                headers: corsHeaders(context)
            });
        }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: corsHeaders(context)
    });
}

function getLuckLabel(level) {
    const labels = {
        1: '倒霉',
        2: '不顺',
        3: '平常',
        4: '顺遂',
        5: '好运',
        6: '爆棚'
    };
    return labels[level] || '平常';
}