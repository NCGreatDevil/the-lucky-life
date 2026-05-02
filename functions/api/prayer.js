import { hashToken, corsHeaders, getNowISO, isISOExpired } from '../_utils.js';

// 根据当前运气值获取运气增加范围
function getLuckGainRange(currentLuck) {
    if (currentLuck >= 0 && currentLuck <= 5) {
        return { min: 5, max: 26 };
    } else if (currentLuck >= 6 && currentLuck <= 25) {
        return { min: 5, max: 51 };
    } else if (currentLuck >= 26 && currentLuck <= 75) {
        return { min: 5, max: 11 };
    } else if (currentLuck >= 76 && currentLuck <= 85) {
        return { min: 5, max: 11 };
    } else if (currentLuck >= 86 && currentLuck <= 95) {
        return { min: 1, max: 5 };
    } else {
        return { min: 1, max: 4 };
    }
}

// 获取运气等级
function getLuckLevel(luckValue) {
    if (luckValue >= 0 && luckValue <= 5) return 1;
    if (luckValue >= 6 && luckValue <= 25) return 2;
    if (luckValue >= 26 && luckValue <= 75) return 3;
    if (luckValue >= 76 && luckValue <= 85) return 4;
    if (luckValue >= 86 && luckValue <= 95) return 5;
    return 6;
}

// 获取运气等级标签
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

// 随机整数（包含min和max）
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

    if (context.request.method === 'POST') {
        try {
            const userId = session.user_id;

            // 获取用户当前属性
            const attrs = await db.prepare('SELECT * FROM user_attributes WHERE user_id = ?').bind(userId).first();
            if (!attrs) {
                return new Response(JSON.stringify({ error: '用户属性不存在' }), {
                    status: 404,
                    headers: corsHeaders(context)
                });
            }

            // 检查活力是否足够
            if (attrs.vitality < 30) {
                return new Response(JSON.stringify({ error: '活力不足，无法祈求' }), {
                    status: 400,
                    headers: corsHeaders(context)
                });
            }

            // 获取用户当前供奉的神明
            const worshippingDeity = await db.prepare(
                'SELECT ud.*, d.* FROM user_deities ud JOIN deities d ON ud.deity_id = d.id WHERE ud.user_id = ? AND ud.is_worshipping = 1'
            ).bind(userId).first();

            // 消耗活力
            const newVitality = attrs.vitality - 30;

            // 计算运气加成
            const currentLuck = attrs.luck;
            const luckRange = getLuckGainRange(currentLuck);
            let luckGain = randomInt(luckRange.min, luckRange.max);

            // 确保运气不超过100
            if (currentLuck + luckGain > 100) {
                luckGain = 100 - currentLuck;
            }

            // 确保运气至少增加1
            if (luckGain < 1) {
                luckGain = 1;
            }

            const newLuck = currentLuck + luckGain;
            const oldLuckLevel = getLuckLevel(currentLuck);
            const newLuckLevel = getLuckLevel(newLuck);
            const luckLevelUp = newLuckLevel > oldLuckLevel;

            // 计算属性加成（如果有信仰）
            let attributeGain = 0;
            let attributeType = '';
            let encounteredDeity = null;
            let encounteredDeityId = '';

            if (worshippingDeity) {
                // 有信仰：获得对应属性加成
                attributeType = worshippingDeity.attribute_type;
                attributeGain = randomInt(worshippingDeity.attribute_min, worshippingDeity.attribute_max);

                // 确保属性至少增加1
                if (attributeGain < 1) {
                    attributeGain = 1;
                }

                // 遇到神明的逻辑
                const encounterRoll = Math.random() * 100;
                if (encounterRoll < 80) {
                    // 80% 遇到供奉的神
                    encounteredDeity = worshippingDeity;
                    encounteredDeityId = worshippingDeity.id;
                } else if (encounterRoll < 95) {
                    // 15% 遇到其他神
                    const otherDeities = await db.prepare(
                        'SELECT * FROM deities WHERE id != ?'
                    ).bind(worshippingDeity.id).all();
                    if (otherDeities.results && otherDeities.results.length > 0) {
                        const randomIndex = Math.floor(Math.random() * otherDeities.results.length);
                        encounteredDeity = otherDeities.results[randomIndex];
                        encounteredDeityId = encounteredDeity.id;
                    }
                }
                // 5% 什么神都没有遇到
            } else {
                // 无信仰：只有1%概率遇到神
                const encounterRoll = Math.random() * 100;
                if (encounterRoll < 1) {
                    const allDeities = await db.prepare('SELECT * FROM deities').all();
                    if (allDeities.results && allDeities.results.length > 0) {
                        const randomIndex = Math.floor(Math.random() * allDeities.results.length);
                        encounteredDeity = allDeities.results[randomIndex];
                        encounteredDeityId = encounteredDeity.id;
                    }
                }
            }

            // 更新用户属性
            const now = getNowISO();
            let updateQuery = 'UPDATE user_attributes SET vitality = ?, luck = ?, updated_at = ? WHERE user_id = ?';
            let updateParams = [newVitality, newLuck, now, userId];

            if (attributeType && attributeGain > 0) {
                updateQuery = `UPDATE user_attributes SET vitality = ?, luck = ?, ${attributeType} = ${attributeType} + ?, updated_at = ? WHERE user_id = ?`;
                updateParams = [newVitality, newLuck, attributeGain, now, userId];
            }

            await db.prepare(updateQuery).bind(...updateParams).run();

            // 处理遇到的神明（增加好感度）
            let favorabilityResult = null;
            if (encounteredDeity) {
                // 随机增加1-50好感度
                const favorabilityGain = randomInt(1, 50);

                // 检查是否已有该神明的记录
                const existingRelation = await db.prepare(
                    'SELECT * FROM user_deities WHERE user_id = ? AND deity_id = ?'
                ).bind(userId, encounteredDeityId).first();

                if (existingRelation) {
                    // 更新好感度
                    const newFavorability = existingRelation.favorability + favorabilityGain;
                    await db.prepare(
                        'UPDATE user_deities SET favorability = ?, updated_at = ? WHERE user_id = ? AND deity_id = ?'
                    ).bind(newFavorability, now, userId, encounteredDeityId).run();

                    favorabilityResult = {
                        deityId: encounteredDeityId,
                        deityName: encounteredDeity.name,
                        favorabilityGain,
                        newFavorability,
                        newLevel: getFavorabilityLevel(newFavorability),
                        oldLevel: getFavorabilityLevel(existingRelation.favorability),
                        levelUp: getFavorabilityLevel(newFavorability) > getFavorabilityLevel(existingRelation.favorability)
                    };
                } else {
                    // 创建新记录
                    const relationId = crypto.randomUUID();
                    await db.prepare(
                        'INSERT INTO user_deities (id, user_id, deity_id, favorability, is_worshipping, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)'
                    ).bind(relationId, userId, encounteredDeityId, favorabilityGain, now, now).run();

                    favorabilityResult = {
                        deityId: encounteredDeityId,
                        deityName: encounteredDeity.name,
                        favorabilityGain,
                        newFavorability: favorabilityGain,
                        newLevel: getFavorabilityLevel(favorabilityGain),
                        oldLevel: 0,
                        levelUp: false
                    };
                }
            }

            // 记录祈求历史
            const recordId = crypto.randomUUID();
            await db.prepare(
                'INSERT INTO prayer_records (id, user_id, deity_id, encountered_deity_id, luck_gained, attribute_type, attribute_gained, vitality_cost, prayed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(
                recordId,
                userId,
                worshippingDeity ? worshippingDeity.id : '',
                encounteredDeityId,
                luckGain,
                attributeType,
                attributeGain,
                30,
                now
            ).run();

            // 返回结果
            return new Response(JSON.stringify({
                success: true,
                luckGain,
                oldLuckLevel,
                newLuckLevel,
                luckLevelUp,
                newLuckLabel: luckLevelUp ? getLuckLabel(newLuckLevel) : null,
                attributeGain: attributeGain > 0 ? attributeGain : null,
                attributeType: attributeType || null,
                encounteredDeity: encounteredDeity ? {
                    id: encounteredDeity.id,
                    name: encounteredDeity.name,
                    imageDescription: encounteredDeity.image_description,
                    imageUrl: encounteredDeity.image_url,
                    attributeType: encounteredDeity.attribute_type
                } : null,
                favorabilityResult,
                newVitality,
                newLuck
            }), {
                status: 200,
                headers: corsHeaders(context)
            });

        } catch (error) {
            console.error('Prayer error:', error);
            return new Response(JSON.stringify({ error: '祈求失败，请稍后重试' }), {
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
