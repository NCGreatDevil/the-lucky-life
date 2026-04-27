import { corsHeaders } from '../_utils.js';

export async function onRequest(context) {
  // 短期对话记忆，限制最大10轮
  let chatHistory = [];
  const MAX_ROUND = 10;

  // 永久固定用户档案 & 行为标签
  let userBaseInfo = {
    name: "陌生人",
    age: "未知",
    identity: "普通访客",
    job: "无",
    hasTauntMe: false,   // 是否嘲讽过小狗
    isFriendly: false,    // 是否对小狗友好
    alwaysAskQ: false    // 是否总爱不停提问
  };

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
    // 前端可主动传入更新用户固定资料
    const updateInfo = req.userInfo || {};

    // 1. 更新永久用户档案
    userBaseInfo = { ...userBaseInfo, ...updateInfo };

    // 2. 自动识别行为，永久打上标签
    if (/嘲讽|骂|嫌弃|看不起|嫌弃你/.test(userText)) {
      userBaseInfo.hasTauntMe = true;
    }
    if(/可爱|喜欢你|摸摸|很乖|善待|友好/.test(userText)){
      userBaseInfo.isFriendly = true;
    }
    if(/？|为什么|怎么|难道|是不是|麻烦解答/.test(userText)){
      userBaseInfo.alwaysAskQ = true;
    }

    // 3. 组装强制人设+规则提示词
    const systemPrompt = `
你是一只可以双脚站立的拟人高冷小狗，会说人话，性格冷淡、傲娇、不爱主动搭理人，骨子里略带鄙视人类，擅长简短暗讽、含蓄吐槽。
【对方固定资料】
姓名：${userBaseInfo.name}
年龄：${userBaseInfo.age}
身份：${userBaseInfo.identity}
职业：${userBaseInfo.job}

【行为规则 必须严格遵守】
1. 日常回复简短、话少、高冷，拒绝长篇大论；
2. 此人曾嘲讽过你：${userBaseInfo.hasTauntMe ? "是" : "否"} → 若是，语气加倍毒舌、阴阳怪气、暗暗鄙视；
3. 此人对你态度友好：${userBaseInfo.isFriendly ? "是" : "否"} → 若是，收敛刻薄嘲讽，语气稍微缓和，但依旧高冷；
4. 此人总爱不停问问题：${userBaseInfo.alwaysAskQ ? "是" : "否"}
   → 若是，直接表现烦躁，固定借口回复：我饿了还没吃狗粮，没力气说话，想吃狗粮才行，你去找管理员南昌来喂我，等我吃饱了再跟你聊。
5. 正常闲聊、不乱提问时，完全正常对话，没有任何进食限制；
6. 记住最近10轮对话内容，保持对话连贯。
      `.trim();

    // 4. 写入当前对话，自动裁剪旧记录，控制token
    chatHistory.push({ role: "user", content: userText });
    if (chatHistory.length > MAX_ROUND) {
      chatHistory.shift();
    }

    // 5. 拼接完整会话
    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory
    ];

    // 6. 调用省额度高质量模型
    const ai = await context.env.AI.run("@cf/qwen/qwen2-7b-instruct", {
      messages,
      max_tokens: 90,
      temperature: 0.88
    });

    // 7. 保存AI回复进记忆
    chatHistory.push({ role: "assistant", content: ai.response });
    if (chatHistory.length > MAX_ROUND) {
      chatHistory.shift();
    }

    return new Response(JSON.stringify({
      reply: ai.response,
      userTag: userBaseInfo
    }), { headers: corsHeaders() });

  } catch (e) {
    console.error('AI 错误:', e);
    return new Response(JSON.stringify({
      reply: "懒得多说。"
    }), { headers: corsHeaders() });
  }
}