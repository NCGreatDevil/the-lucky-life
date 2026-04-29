import { corsHeaders, hashToken, isISOExpired, getNowISO } from '../_utils.js';

async function verifySession(context) {
  const cookieHeader = context.request.headers.get('Cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...val] = c.trim().split('=');
      return [key, val.join('=')];
    })
  );

  const token = cookies.session_token;
  if (!token) {
    return null;
  }

  const db = context.env['game-db'];
  const tokenHash = await hashToken(token);
  const session = await db.prepare('SELECT * FROM sessions WHERE token_hash = ?').bind(tokenHash).first();
  
  if (!session || isISOExpired(session.expires_at)) {
    return null;
  }

  return session;
}

export async function onRequest(context) {
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

  try {
    const db = context.env['game-db'];
    const now = getNowISO();

    const existingAttrs = await db.prepare('SELECT user_id FROM user_attributes WHERE user_id = ?').bind(session.user_id).first();

    if (existingAttrs) {
      return new Response(JSON.stringify({
        success: true,
        message: '属性已存在，无需初始化',
        created: false
      }), { headers: corsHeaders(context) });
    }

    const luck = Math.floor(Math.random() * 101);
    const luckLevel = calculateLuckLevel(luck);

    await db.prepare(`
      INSERT INTO user_attributes (
        user_id, energy, vitality, morality, intelligence, 
        constitution, charm, willpower, emotion, popularity, 
        money, luck, luck_level, updated_at
      ) VALUES (?, 80, 60, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?, ?)
    `).bind(session.user_id, luck, luckLevel, now).run();

    return new Response(JSON.stringify({
      success: true,
      message: '属性初始化成功',
      created: true,
      attributes: {
        energy: 80,
        vitality: 60,
        morality: 0,
        intelligence: 0,
        constitution: 0,
        charm: 0,
        willpower: 0,
        emotion: 0,
        popularity: 0,
        money: 0,
        luck: luck,
        luckLevel: luckLevel
      }
    }), { headers: corsHeaders(context) });

  } catch (error) {
    console.error('初始化属性错误:', error);
    return new Response(JSON.stringify({ error: '服务器内部错误' }), {
      status: 500,
      headers: corsHeaders(context)
    });
  }
}

function calculateLuckLevel(luck) {
  if (luck >= 96) return 6;
  if (luck >= 86) return 5;
  if (luck >= 76) return 4;
  if (luck >= 26) return 3;
  if (luck >= 6) return 2;
  return 1;
}
