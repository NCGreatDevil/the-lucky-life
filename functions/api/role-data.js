import { corsHeaders, hashToken, isISOExpired, generateGUID, getNowISO } from '../_utils.js';

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

  const session = await verifySession(context);
  if (!session) {
    return new Response(JSON.stringify({ error: '未登录或会话已过期' }), {
      status: 401,
      headers: corsHeaders(context)
    });
  }

  const db = context.env['game-db'];

  if (context.request.method === 'GET') {
    try {
      const roleState = await db.prepare('SELECT * FROM user_role_state WHERE user_id = ?').bind(session.user_id).first();
      
      const attributes = await db.prepare('SELECT * FROM user_role_attributes WHERE user_id = ?').bind(session.user_id).all();
      
      const tags = await db.prepare('SELECT * FROM user_tags WHERE user_id = ?').bind(session.user_id).all();
      
      const fortuneHistory = await db.prepare('SELECT * FROM user_fortune_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50').bind(session.user_id).all();
      
      const eventHistory = await db.prepare('SELECT * FROM user_event_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50').bind(session.user_id).all();
      
      const friends = await db.prepare('SELECT * FROM user_friends WHERE user_id = ?').bind(session.user_id).all();

      return new Response(JSON.stringify({
        success: true,
        data: {
          roleState: roleState || null,
          attributes: attributes.results || [],
          tags: tags.results || [],
          fortuneHistory: fortuneHistory.results || [],
          eventHistory: eventHistory.results || [],
          friends: friends.results || []
        }
      }), { headers: corsHeaders(context) });

    } catch (error) {
      console.error('获取角色数据错误:', error);
      return new Response(JSON.stringify({ error: '服务器内部错误' }), {
        status: 500,
        headers: corsHeaders(context)
      });
    }
  }

  if (context.request.method === 'POST') {
    try {
      const body = await context.request.json();
      const now = getNowISO();

      if (body.roleState) {
        const { roleName, roleLevel, roleTitle, lastDrawDate } = body.roleState;
        await db.prepare(`
          INSERT INTO user_role_state (user_id, role_name, role_level, role_title, last_draw_date, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            role_name = excluded.role_name,
            role_level = excluded.role_level,
            role_title = excluded.role_title,
            last_draw_date = excluded.last_draw_date,
            updated_at = excluded.updated_at
        `).bind(session.user_id, roleName, roleLevel, roleTitle, lastDrawDate, now).run();
      }

      if (body.attributes && body.attributes.length > 0) {
        await db.prepare('DELETE FROM user_role_attributes WHERE user_id = ?').bind(session.user_id).run();
        
        for (const attr of body.attributes) {
          const id = generateGUID();
          await db.prepare(`
            INSERT INTO user_role_attributes (id, user_id, attribute_name, attribute_value, is_visible, is_unlocked, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id,
            session.user_id,
            attr.name,
            attr.value,
            attr.visible ? 1 : 0,
            attr.unlocked ? 1 : 0,
            now
          ).run();
        }
      }

      if (body.tags) {
        await db.prepare('DELETE FROM user_tags WHERE user_id = ?').bind(session.user_id).run();
        
        for (const tag of body.tags) {
          const id = generateGUID();
          await db.prepare(`
            INSERT INTO user_tags (id, user_id, tag_name, created_at)
            VALUES (?, ?, ?, ?)
          `).bind(id, session.user_id, tag, now).run();
        }
      }

      if (body.fortuneHistory) {
        await db.prepare('DELETE FROM user_fortune_history WHERE user_id = ?').bind(session.user_id).run();
        
        for (const record of body.fortuneHistory) {
          const id = generateGUID();
          await db.prepare(`
            INSERT INTO user_fortune_history (id, user_id, fortune_date, result, changes, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            id,
            session.user_id,
            record.date,
            record.result,
            JSON.stringify(record.changes || {}),
            record.timestamp || now
          ).run();
        }
      }

      if (body.eventHistory) {
        await db.prepare('DELETE FROM user_event_history WHERE user_id = ?').bind(session.user_id).run();
        
        for (const event of body.eventHistory) {
          const id = generateGUID();
          await db.prepare(`
            INSERT INTO user_event_history (id, user_id, event_type, event_title, choice, changes, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id,
            session.user_id,
            event.type,
            event.title,
            event.choice || '',
            JSON.stringify(event.changes || {}),
            event.timestamp || now
          ).run();
        }
      }

      if (body.friends) {
        await db.prepare('DELETE FROM user_friends WHERE user_id = ?').bind(session.user_id).run();
        
        for (const friend of body.friends) {
          const id = generateGUID();
          await db.prepare(`
            INSERT INTO user_friends (id, user_id, friend_id, is_npc, friend_name, friend_avatar, friend_level, friend_title, friend_tags, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id,
            session.user_id,
            friend.id || friend.friendId,
            friend.isNpc ? 1 : 0,
            friend.name,
            friend.avatar || '',
            friend.level || 1,
            friend.title || '',
            JSON.stringify(friend.tags || []),
            friend.createdAt || now
          ).run();
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: '保存成功'
      }), { headers: corsHeaders(context) });

    } catch (error) {
      console.error('保存角色数据错误:', error);
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
