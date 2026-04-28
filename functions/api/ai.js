import { corsHeaders } from '../_utils.js';

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  if (context.request.method !== "POST") {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders()
    });
  }

  try {
    const req = await context.request.json();
    const userText = req.content?.trim() || "";
    const chatHistoryFromFront = req.chatHistory || [];
    const lastUserTag = req.userTag || {};

    // 1. 恢复用户标签（从上一轮继承，只做增量更新）
    let userBaseInfo = {
      name: lastUserTag.name || "陌生人",
      age: lastUserTag.age || "未知",
      job: lastUserTag.job || "无",
      bio: lastUserTag.bio || "",
      hasTauntMe: lastUserTag.hasTauntMe || false,
      isFriendly: lastUserTag.isFriendly || false,
      alwaysAskQ: lastUserTag.alwaysAskQ || false
    };

    // 前端传的新信息覆盖
    if (req.userInfo) {
      userBaseInfo = { ...userBaseInfo, ...req.userInfo };
    }

    // 2. 自动识别行为并打标签
    if (/嘲讽|骂|嫌弃|看不起|嫌弃你/.test(userText)) {
      userBaseInfo.hasTauntMe = true;
    }
    if (/可爱|喜欢你|摸摸|很乖|善待|友好/.test(userText)) {
      userBaseInfo.isFriendly = true;
    }

    // 3. 处理时间和首次问候
    const hour = req.hour !== undefined ? req.hour : new Date().getHours();
    const userMessage = userText || `（当前时间${hour}点，生成符合太宰性格的开场问候）`;

    // 4. 管理聊天历史（保留最近10轮）
    const MAX_ROUND = 10;
    let chatHistory = [...chatHistoryFromFront];
    chatHistory.push({ role: "user", content: userMessage });
    // 截断历史，每轮是user+assistant，所以*2
    if (chatHistory.length > MAX_ROUND * 2) {
      chatHistory = chatHistory.slice(-MAX_ROUND * 2);
    }

    // 5. 简化System Prompt
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

    // 6. 拼接完整会话
    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory
    ];

    // 7. 调用AI模型
    const ai = await context.env.AI.run("@cf/qwen/qwen3-30b-a3b-fp8", {
      messages,
      max_tokens: 200,
      temperature: 0.5,
      top_p: 0.9
    });

    // 8. 解析AI返回
    let aiReply = '';
    if (ai && typeof ai.response === 'string') {
      aiReply = ai.response;
    } else if (ai && ai.choices && ai.choices[0] && ai.choices[0].message) {
      const msg = ai.choices[0].message;
      aiReply = msg.content || msg.reasoning || '';
    } else if (ai && ai.result && ai.result.choices && ai.result.choices[0] && ai.result.choices[0].message) {
      const msg = ai.result.choices[0].message;
      aiReply = msg.content || msg.reasoning || '';
    } else if (ai && typeof ai.result === 'string') {
      aiReply = ai.result;
    }
    aiReply = aiReply.trim() || '...';

    // 9. 把AI回复加入历史，返回给前端保存
    chatHistory.push({ role: "assistant", content: aiReply });

    return new Response(JSON.stringify({
      reply: aiReply,
      userTag: userBaseInfo,
      chatHistory: chatHistory
    }), { headers: corsHeaders() });

  } catch (e) {
    console.error('AI 错误:', e);
    return new Response(JSON.stringify({
      reply: "有异常，找管理员问问",
      error: e.message
    }), { headers: corsHeaders() });
  }
}
