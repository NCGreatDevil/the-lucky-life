import { corsHeaders, getNowISO, generateGUID } from '../../_utils.js';
import { verifySession, getFavorabilityLevel } from '../events/_utils.js';

export async function onRequest(context) {
    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders(context) });
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
        const pendingList = await db.prepare(
            `SELECT uf.target_id, uf.target_type, uf.favorability,
                    CASE WHEN uf.target_type = 'npc' THEN n.name ELSE u.nickname END as name,
                    CASE WHEN uf.target_type = 'npc' THEN n.avatar ELSE '👤' END as avatar,
                    CASE WHEN uf.target_type = 'npc' THEN n.title ELSE '' END as title
             FROM user_favorability uf
             LEFT JOIN npcs n ON uf.target_type = 'npc' AND uf.target_id = n.id
             LEFT JOIN users u ON uf.target_type = 'user' AND uf.target_id = u.id
             WHERE uf.user_id = ? AND uf.favorability >= 100
             ORDER BY uf.favorability DESC`
        ).bind(userId).all();

        const results = (pendingList.results || []).map(f => ({
            targetId: f.target_id,
            targetType: f.target_type,
            name: f.name || '未知',
            avatar: f.avatar || '👤',
            title: f.title || '',
            favorability: f.favorability,
            level: getFavorabilityLevel(f.favorability)
        }));

        return new Response(JSON.stringify({
            success: true,
            pending: results
        }), {
            headers: corsHeaders(context)
        });

    } catch (error) {
        console.error('获取待添加列表错误:', error);
        return new Response(JSON.stringify({ error: '服务器内部错误' }), {
            status: 500,
            headers: corsHeaders(context)
        });
    }
}
