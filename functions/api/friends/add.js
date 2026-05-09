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
        const targetType = targetId.startsWith('dog_') || targetId.startsWith('huangshan_') || targetId.startsWith('xianyu_') ? 'npc' : 'user';

        if (targetType === 'npc') {
            const npc = await db.prepare('SELECT id, name, avatar, title FROM npcs WHERE id = ?').bind(targetId).first();
            if (!npc) {
                return new Response(JSON.stringify({ error: 'NPC不存在' }), {
                    status: 404,
                    headers: corsHeaders(context)
                });
            }

            const existing = await db.prepare(
                'SELECT id FROM user_friends WHERE user_id = ? AND friend_id = ? AND is_npc = 1'
            ).bind(userId, targetId).first();

            if (existing) {
                return new Response(JSON.stringify({ error: '已是好友' }), {
                    status: 400,
                    headers: corsHeaders(context)
                });
            }

            await db.prepare(
                'INSERT INTO user_friends (id, user_id, friend_id, is_npc, friend_name, friend_avatar, friend_title, created_at) VALUES (?, ?, ?, 1, ?, ?, ?, ?)'
            ).bind(generateGUID(), userId, targetId, npc.name, npc.avatar, npc.title, now).run();

            await db.prepare(
                'UPDATE user_favorability SET favorability = 100, updated_at = ? WHERE user_id = ? AND target_id = ? AND target_type = ?'
            ).bind(now, userId, targetId, 'npc').run();

            return new Response(JSON.stringify({
                success: true,
                message: '已添加NPC好友',
                friend: {
                    id: targetId,
                    name: npc.name,
                    avatar: npc.avatar,
                    title: npc.title
                }
            }), {
                headers: corsHeaders(context)
            });

        } else {
            const targetUser = await db.prepare('SELECT id, user_id, nickname FROM users WHERE id = ?').bind(targetId).first();
            if (!targetUser) {
                return new Response(JSON.stringify({ error: '用户不存在' }), {
                    status: 404,
                    headers: corsHeaders(context)
                });
            }

            if (targetUser.id === userId) {
                return new Response(JSON.stringify({ error: '不能添加自己为好友' }), {
                    status: 400,
                    headers: corsHeaders(context)
                });
            }

            const existing = await db.prepare(
                'SELECT id FROM user_friends WHERE user_id = ? AND friend_id = ? AND is_npc = 0'
            ).bind(userId, targetId).first();

            if (existing) {
                return new Response(JSON.stringify({ error: '已是好友' }), {
                    status: 400,
                    headers: corsHeaders(context)
                });
            }

            const existingRequest = await db.prepare(
                'SELECT id FROM user_friend_requests WHERE requester_id = ? AND receiver_id = ? AND status = ?'
            ).bind(userId, targetId, 'pending').first();

            if (existingRequest) {
                return new Response(JSON.stringify({ error: '已发送过好友申请' }), {
                    status: 400,
                    headers: corsHeaders(context)
                });
            }

            await db.prepare(
                'INSERT INTO user_friend_requests (id, requester_id, receiver_id, status, created_at) VALUES (?, ?, ?, ?, ?)'
            ).bind(generateGUID(), userId, targetId, 'pending', now).run();

            return new Response(JSON.stringify({
                success: true,
                message: '好友申请已发送'
            }), {
                headers: corsHeaders(context)
            });
        }

    } catch (error) {
        console.error('添加好友错误:', error);
        return new Response(JSON.stringify({ error: '服务器内部错误' }), {
            status: 500,
            headers: corsHeaders(context)
        });
    }
}
