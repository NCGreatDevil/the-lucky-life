import { corsHeaders, hashToken, isISOExpired } from '../_utils.js';

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
    const lastUserTag = req.userTag || {};

    const db = context.env['game-db'];
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: '用户不存在' }), {
        status: 404,
        headers: corsHeaders(context)
      });
    }

    let userBaseInfo = {
      name: lastUserTag.name || user.nickname,
      age: lastUserTag.age || "未知",
      job: lastUserTag.job || user.occupation,
      bio: lastUserTag.bio || user.bio || "",
      hasTauntMe: lastUserTag.hasTauntMe || false,
      isFriendly: lastUserTag.isFriendly || false,
      alwaysAskQ: lastUserTag.alwaysAskQ || false
    };

    if (req.userInfo) {
      userBaseInfo = { ...userBaseInfo, ...req.userInfo };
    }

    if (/嘲讽|骂|嫌弃|看不起|嫌弃你/.test(userText)) {
      userBaseInfo.hasTauntMe = true;
    }
    if (/可爱|喜欢你|摸摸|很乖|善待|友好/.test(userText)) {
      userBaseInfo.isFriendly = true;
    }

    const hour = req.hour !== undefined ? req.hour : new Date().getHours();
    const userMessage = userText || `（当前时间${hour}点，生成符合太宰性格的开场问候）`;

    const MAX_ROUND = 10;
    let chatHistory = [...chatHistoryFromFront];
    chatHistory.push({ role: "user", content: userMessage });
    if (chatHistory.length > MAX_ROUND * 2) {
      chatHistory = chatHistory.slice(-MAX_ROUND * 2);
    }

    const systemPrompt = `
【角色】太宰，性格冷淡傲娇，话少简短，偶尔暗讽，绝不自称小狗或提及物种。
【对方】姓名${userBaseInfo.name}，年龄${userBaseInfo.age}，职业${userBaseInfo.job}，简介${userBaseInfo.bio || '暂无'}。
【对方态度】曾嘲讽你：${userBaseInfo.hasTauntMe ? "是（加倍毒舌）" : "否"}；对你友好：${userBaseInfo.isFriendly ? "是（稍微缓和）" : "否"}；爱提问：${userBaseInfo.alwaysAskQ ? "是（表现烦躁）" : "否"}。
【规则】
1. 回复必须简短，不超过30字；
2. 首次问候可加【动作】，之后禁用动作表情；
3. 用中文简体，可加简单emoji；
4. 记住前面的对话内容，保持连贯；
5. 如果对方爱提问，回复：我饿了，没力气了，你把管理员喊来，让他给我找点吃的，吃饱了再跟你聊。
`.trim();

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory
    ];

    const aiReply = await callDeepSeek(messages, context.env.DEEPSEEK_API_KEY);

    chatHistory.push({ role: "assistant", content: aiReply });

    return new Response(JSON.stringify({
      reply: aiReply,
      userTag: userBaseInfo,
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
      max_tokens: 200,
      temperature: 0.5,
      top_p: 0.9
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('DeepSeek API 错误:', error);
    throw new Error('DeepSeek API 调用失败');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '...';
}

function parseAIResponse(ai) {
  if (!ai) return '';
  
  if (typeof ai === 'string') {
    return ai;
  }
  
  if (ai.response && typeof ai.response === 'string') {
    return ai.response;
  }
  
  if (typeof ai.result === 'string') {
    return ai.result;
  }
  
  const messageObj = ai.choices?.[0]?.message 
    || ai.result?.choices?.[0]?.message 
    || ai.message;
  
  if (messageObj) {
    return messageObj.content || messageObj.reasoning || '';
  }
  
  if (ai.content) {
    return ai.content;
  }
  
  console.warn('Unknown AI response format:', JSON.stringify(ai));
  return '';
}
