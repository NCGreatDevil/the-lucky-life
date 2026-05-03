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

// 计算需要的好感度
function getRequiredFavorability(level) {
    if (level <= 0) return 0;
    if (level === 1) return 100;
    if (level === 2) return 300;
    if (level === 3) return 600;
    if (level === 4) return 1000;
    return 1500;
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

    if (context.request.method === 'POST') {
        try {
            const userId = session.user_id;
            const body = await context.request.json();
            const { deityId, action } = body;

            if (!deityId || !action) {
                return new Response(JSON.stringify({ error: '参数不完整' }), {
                    status: 400,
                    headers: corsHeaders(context)
                });
            }

            const now = getNowISO();

            // 获取神明信息
            const deity = await db.prepare('SELECT * FROM deities WHERE id = ?').bind(deityId).first();
            if (!deity) {
                return new Response(JSON.stringify({ error: '神明不存在' }), {
                    status: 404,
                    headers: corsHeaders(context)
                });
            }

            // 获取用户与该神明的关系
            const relation = await db.prepare(
                'SELECT * FROM user_deities WHERE user_id = ? AND deity_id = ?'
            ).bind(userId, deityId).first();

            if (!relation) {
                return new Response(JSON.stringify({ error: '与该神明暂无关系' }), {
                    status: 400,
                    headers: corsHeaders(context)
                });
            }

            if (action === 'accept') {
                // 接受供奉
                // 检查好感度是否达到LV1
                if (relation.favorability < 100) {
                    return new Response(JSON.stringify({ error: '好感度不足，无法供奉' }), {
                        status: 400,
                        headers: corsHeaders(context)
                    });
                }

                // 如果用户已有供奉的神明，先取消
                await db.prepare(
                    'UPDATE user_deities SET is_worshipping = 0 WHERE user_id = ? AND is_worshipping = 1'
                ).bind(userId).run();

                // 设置新的供奉神明
                await db.prepare(
                    'UPDATE user_deities SET is_worshipping = 1, bound_at = ?, updated_at = ? WHERE user_id = ? AND deity_id = ?'
                ).bind(now, now, userId, deityId).run();

                return new Response(JSON.stringify({
                    success: true,
                    message: `已成功供奉${deity.name}`,
                    deity: {
                        id: deity.id,
                        name: deity.name,
                        attributeType: deity.attribute_type
                    }
                }), {
                    status: 200,
                    headers: corsHeaders(context)
                });

            } else if (action === 'reject') {
                // 拒绝供奉，清空好感度
                await db.prepare(
                    'UPDATE user_deities SET favorability = 0, updated_at = ? WHERE user_id = ? AND deity_id = ?'
                ).bind(now, userId, deityId).run();

                return new Response(JSON.stringify({
                    success: true,
                    message: '已拒绝供奉，好感度已清空'
                }), {
                    status: 200,
                    headers: corsHeaders(context)
                });

            } else if (action === 'abandon') {
                // 放弃供奉，回归无信仰状态
                // 检查是否有供奉的神明
                const currentWorshipping = await db.prepare(
                    'SELECT ud.*, d.* FROM user_deities ud JOIN deities d ON ud.deity_id = d.id WHERE ud.user_id = ? AND ud.is_worshipping = 1'
                ).bind(userId).first();

                if (!currentWorshipping) {
                    return new Response(JSON.stringify({ error: '当前没有供奉的神明' }), {
                        status: 400,
                        headers: corsHeaders(context)
                    });
                }

                // 计算属性损失（固定25%）
                const attributeType = currentWorshipping.attribute_type;
                const attrs = await db.prepare('SELECT * FROM user_attributes WHERE user_id = ?').bind(userId).first();
                const currentAttributeValue = attrs[attributeType] || 0;
                const attributeLoss = Math.floor(currentAttributeValue * 0.25);

                // 更新属性
                const newAttributeValue = Math.max(0, currentAttributeValue - attributeLoss);
                await db.prepare(
                    `UPDATE user_attributes SET ${attributeType} = ?, updated_at = ? WHERE user_id = ?`
                ).bind(newAttributeValue, now, userId).run();

                // 取消供奉
                await db.prepare(
                    'UPDATE user_deities SET is_worshipping = 0 WHERE user_id = ? AND is_worshipping = 1'
                ).bind(userId).run();

                return new Response(JSON.stringify({
                    success: true,
                    message: '已放弃供奉，回归无信仰状态',
                    attributeLoss: {
                        attributeType,
                        loss: attributeLoss
                    }
                }), {
                    status: 200,
                    headers: corsHeaders(context)
                });

            } else if (action === 'switch') {
                // 更换神明
                // 检查新神明好感度是否达到LV1
                if (relation.favorability < 100) {
                    return new Response(JSON.stringify({ error: '好感度不足，无法更换' }), {
                        status: 400,
                        headers: corsHeaders(context)
                    });
                }

                // 获取当前供奉的神明
                const currentWorshipping = await db.prepare(
                    'SELECT ud.*, d.* FROM user_deities ud JOIN deities d ON ud.deity_id = d.id WHERE ud.user_id = ? AND ud.is_worshipping = 1'
                ).bind(userId).first();

                let attributeLoss = 0;
                let attributeType = '';

                if (currentWorshipping) {
                    // 计算属性损失（10%-40%）
                    attributeType = currentWorshipping.attribute_type;
                    const attrs = await db.prepare('SELECT * FROM user_attributes WHERE user_id = ?').bind(userId).first();
                    const currentAttributeValue = attrs[attributeType] || 0;
                    const lossPercentage = Math.random() * 0.3 + 0.1; // 10%-40%
                    attributeLoss = Math.floor(currentAttributeValue * lossPercentage);

                    // 更新属性
                    const newAttributeValue = Math.max(0, currentAttributeValue - attributeLoss);
                    await db.prepare(
                        `UPDATE user_attributes SET ${attributeType} = ?, updated_at = ? WHERE user_id = ?`
                    ).bind(newAttributeValue, now, userId).run();

                    // 取消当前供奉
                    await db.prepare(
                        'UPDATE user_deities SET is_worshipping = 0 WHERE user_id = ? AND is_worshipping = 1'
                    ).bind(userId).run();
                }

                // 设置新的供奉神明
                await db.prepare(
                    'UPDATE user_deities SET is_worshipping = 1, bound_at = ?, updated_at = ? WHERE user_id = ? AND deity_id = ?'
                ).bind(now, now, userId, deityId).run();

                return new Response(JSON.stringify({
                    success: true,
                    message: `已更换供奉为${deity.name}`,
                    attributeLoss: attributeLoss > 0 ? {
                        attributeType,
                        loss: attributeLoss
                    } : null,
                    newDeity: {
                        id: deity.id,
                        name: deity.name,
                        attributeType: deity.attribute_type
                    }
                }), {
                    status: 200,
                    headers: corsHeaders(context)
                });
            }

            return new Response(JSON.stringify({ error: '无效的操作' }), {
                status: 400,
                headers: corsHeaders(context)
            });

        } catch (error) {
            console.error('Deity action error:', error);
            return new Response(JSON.stringify({ error: '操作失败，请稍后重试' }), {
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
