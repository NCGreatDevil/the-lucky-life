import { corsHeaders } from '../../../../_utils.js';
import { verifySession, getEventOptions } from '../../_utils.js';

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
    const eventId = context.params.eventId;

    try {
        const event = await db.prepare(
            'SELECT id, name, description, category, trigger_type FROM events WHERE id = ?'
        ).bind(eventId).first();

        if (!event) {
            return new Response(JSON.stringify({ error: '事件不存在' }), {
                status: 404,
                headers: corsHeaders(context)
            });
        }

        const options = await getEventOptions(db, event.id);

        const attrs = await db.prepare('SELECT * FROM user_attributes WHERE user_id = ?').bind(userId).first();

        return new Response(JSON.stringify({
            success: true,
            event: {
                id: event.id,
                name: event.name,
                description: event.description,
                category: event.category
            },
            options: options.map(o => ({
                id: o.id,
                order: o.option_order,
                text: o.option_text,
                effects: o.effects
            })),
            currentAttributes: {
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
                luck: attrs.luck
            }
        }), {
            headers: corsHeaders(context)
        });

    } catch (error) {
        console.error('获取事件选项错误:', error);
        return new Response(JSON.stringify({ error: '服务器内部错误', details: error.message }), {
            status: 500,
            headers: corsHeaders(context)
        });
    }
}
