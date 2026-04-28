import { corsHeaders } from '../_utils.js';

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

  try {
    const db = context.env['game-db'];

    const result = await db.prepare("DELETE FROM users WHERE nickname = 'admin' OR user_id = 'admin'").run();

    return new Response(JSON.stringify({
      success: true,
      message: '已删除 admin 用户',
      changes: result.meta?.changes || 0
    }), { headers: corsHeaders(context) });

  } catch (error) {
    console.error('删除错误:', error);
    return new Response(JSON.stringify({ error: '服务器内部错误' }), {
      status: 500,
      headers: corsHeaders(context)
    });
  }
}
