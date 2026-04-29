import { corsHeaders, hashToken, isISOExpired } from '../_utils.js';
import { getNPC } from '../npc/index.js';

const MAX_HISTORY = 20;
const MAX_REPLY_LENGTH = 30;

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
  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(context) });
  }

  if (context.request.method !== "POST") {
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
    const req = await context.request.json();
    const userText = req.content?.trim() || "";
    const chatHistoryFromFront = req.chatHistory || [];
    const userState = req.userTag || {};
    const npcId = req.npcId || 'dog_npc';

    const db = context.env['game-db'];
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: '用户不存在' }), {
        status: 404,
        headers: corsHeaders(context)
      });
    }

    const userInfo = {
      name: userState.name || user.nickname,
      age: userState.age || "未知",
      job: userState.job || user.occupation,
      bio: userState.bio || user.bio || "",
      hasTauntMe: userState.hasTauntMe || false,
      isFriendly: userState.isFriendly || false,
      alwaysAskQ: userState.alwaysAskQ || false,
      askCount: userState.askCount || 0
    };

    if (req.userInfo) {
      Object.assign(userInfo, req.userInfo);
    }

    const npc = getNPC(npcId);

    if (userText) {
      const newState = npc.processUserInput(userText, userInfo);
      Object.assign(userInfo, newState);
    }

    const hour = req.hour !== undefined ? req.hour : new Date().getHours();
    
    let chatHistory = [...chatHistoryFromFront];
    
    if (userText) {
      chatHistory.push({ role: "user", content: userText });
    }
    
    if (chatHistory.length > MAX_HISTORY) {
      chatHistory = chatHistory.slice(-MAX_HISTORY);
    }

    if (npc.shouldRefuseReply(userInfo)) {
      const refusal = npc.getRefusalMessage();
      chatHistory.push({ role: "assistant", content: refusal });
      
      return new Response(JSON.stringify({
        reply: refusal,
        userTag: userInfo,
        chatHistory: chatHistory
      }), { headers: corsHeaders(context) });
    }

    const systemPrompt = npc.getSystemPrompt(userInfo, chatHistory);

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory
    ];

    let aiReply = await callDeepSeek(messages, context.env.DEEPSEEK_API_KEY);
    aiReply = npc.validateReply(aiReply);

    if (aiReply.length > MAX_REPLY_LENGTH) {
      aiReply = aiReply.substring(0, MAX_REPLY_LENGTH) + '...';
    }

    chatHistory.push({ role: "assistant", content: aiReply });

    return new Response(JSON.stringify({
      reply: aiReply,
      userTag: userInfo,
      chatHistory: chatHistory
    }), { headers: corsHeaders(context) });

  } catch (e) {
    console.error('AI 错误:', e);
    return new Response(JSON.stringify({
      error: 'AI 服务异常，请稍后重试'
    }), { 
      status: 500,
      headers: corsHeaders(context) 
    });
  }
}

async function callDeepSeek(messages, apiKey) {
  if (!apiKey) {
    throw new Error('未配置 DEEPSEEK_API_KEY');
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      max_tokens: 150,
      temperature: 0.7,
      top_p: 0.8,
      frequency_penalty: 0.3,
      presence_penalty: 0.3
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('DeepSeek API 错误:', error);
    throw new Error('DeepSeek API 调用失败');
  }

  const data = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    console.error('DeepSeek 返回空响应:', JSON.stringify(data));
    throw new Error('AI 返回空响应');
  }

  const content = data.choices[0].message?.content;
  if (!content || content.trim().length === 0) {
    console.error('DeepSeek 返回空内容:', JSON.stringify(data));
    return '...';
  }

  return content.trim();
}
