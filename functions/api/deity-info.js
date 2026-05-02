import { hashToken, corsHeaders, getNowISO, isISOExpired } from '../_utils.js';

// 计算好感度等级
function getFavorabilityLevel(favorability) {
    if (favorability < 100) return 0;
    if (favorability < 300) return 1;
    if (favorability < 600) return 2;
    if (favorability < 1000) return 3;
    if (favorability < 1500) return 4;
    return 5;
}

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
            const userId = session.user_id;

            // 获取用户当前供奉的神明
            const worshippingDeity = await db.prepare(
                'SELECT ud.*, d.* FROM user_deities ud JOIN deities d ON ud.deity_id = d.id WHERE ud.user_id = ? AND ud.is_worshipping = 1'
            ).bind(userId).first();

            // 获取用户与所有神明的关系
            const deityRelations = await db.prepare(
                'SELECT ud.*, d.name, d.attribute_type, d.image_description, d.image_url, d.power_description, d.token, d.personality FROM user_deities ud JOIN deities d ON ud.deity_id = d.id WHERE ud.user_id = ?'
            ).bind(userId).all();

            // 格式化关系数据
            const relations = (deityRelations.results || []).map(r => ({
                deityId: r.deity_id,
                deityName: r.name,
                attributeType: r.attribute_type,
                imageDescription: r.image_description,
                imageUrl: r.image_url,
                powerDescription: r.power_description,
                token: r.token,
                personality: JSON.parse(r.personality || '[]'),
                favorability: r.favorability,
                level: getFavorabilityLevel(r.favorability),
                isWorshipping: r.is_worshipping === 1
            }));

            return new Response(JSON.stringify({
                success: true,
                worshippingDeity: worshippingDeity ? {
                    id: worshippingDeity.id,
                    name: worshippingDeity.name,
                    attributeType: worshippingDeity.attribute_type,
                    imageDescription: worshippingDeity.image_description,
                    imageUrl: worshippingDeity.image_url,
                    powerDescription: worshippingDeity.power_description,
                    token: worshippingDeity.token,
                    personality: JSON.parse(worshippingDeity.personality || '[]'),
                    favorability: worshippingDeity.favorability,
                    level: getFavorabilityLevel(worshippingDeity.favorability)
                } : null,
                deityRelations: relations
            }), {
                status: 200,
                headers: corsHeaders(context)
            });

        } catch (error) {
            console.error('Deity info error:', error);
            return new Response(JSON.stringify({ error: '获取神明信息失败，请稍后重试' }), {
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
