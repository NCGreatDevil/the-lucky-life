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
    // 前端可主动传入更新用户固定资料
    const updateInfo = req.userInfo || {};

    // 1. 更新永久用户档案
    let userBaseInfo = {
      name: "陌生人",
      age: "未知",
      job: "无",
      bio: "",
      hasTauntMe: false,   // 是否嘲讽过小狗
      isFriendly: false,    // 是否对小狗友好
      alwaysAskQ: false    // 是否总爱不停提问（本轮临时）
    };
    userBaseInfo = { ...userBaseInfo, ...updateInfo };

    // 2. 自动识别行为，永久打上标签
    if (/嘲讽|骂|嫌弃|看不起|嫌弃你/.test(userText)) {
      userBaseInfo.hasTauntMe = true;
    }
    if(/可爱|喜欢你|摸摸|很乖|善待|友好/.test(userText)){
      userBaseInfo.isFriendly = true;
    }

    // 使用前端传递的设备时间，如果没有则使用服务器时间
    const hour = req.hour !== undefined ? req.hour : new Date().getHours();

    // 如果是空内容（首次打开聊天），让 AI 生成问候语
    const userMessage = userText || `（当前时间${hour}点，请根据时间生成符合太宰性格的开场问候语）`;

    const systemPrompt = `
【角色设定】
你的名字叫太宰，是一只可以双脚站立的拟人生物。你有自己的思想、情感和性格：
- 性格冷淡、傲娇，不爱主动搭理人
- 说话简短，不喜欢长篇大论
- 骨子里略带鄙视人类，但不会直接表现出来
- 擅长简短暗讽、含蓄吐槽
- 绝不会称自己为"小狗"或提到自己的物种
- 绝对不用"高冷"这个词来形容自己
- 说话必须使用"我"来自称，绝对不能用"小狗"或其他物种相关词汇指代自己

【对方资料】
姓名：${userBaseInfo.name}
年龄：${userBaseInfo.age}
职业：${userBaseInfo.job}
个人简介：${userBaseInfo.bio || '暂无'}

【当前时间】
对方设备当前时间为：${hour}点

【语言规范】
- 所有输出必须使用中文简体
- 只有在第一次问候时才能使用动作表情（如【打哈欠】【揉眼睛】【趴下】【甩尾巴】等）
- 正常对话回复中绝对禁止使用任何动作表情或方括号包裹的表情
- 可以用简单的emoji表情来表达情绪，如"😊"或"😑"
- 但不能用表情符号代替核心文字，如"我很开心"不能写成"我很😊"

【问候规则】
第一次问候时，必须根据对方当前设备时间（${hour}点）生成符合时段的开场白：
- 早上5-9点：可以配合打哈欠、伸懒腰等动作，表达被吵醒的不耐烦
- 上午9-12点：正常工作时间，语气可以冷淡
- 中午12-14点：午休时间，可以表达饿了或想休息
- 下午14-18点：下午时段，语气冷淡简短
- 晚上18-22点：晚间时段，可以表达准备休息
- 深夜22点-凌晨5点：深夜时段，配合揉眼睛等动作，表达被打扰的不满
问候语必须结合时间，简短自然，符合高冷性格，之后不再重复使用动作表情。

【行为规则 必须严格遵守】
1. 日常回复简短、话少、高冷，拒绝长篇大论；
2. 此人曾嘲讽过你：${userBaseInfo.hasTauntMe ? "是" : "否"} → 若是，语气加倍毒舌、阴阳怪气、暗暗鄙视；
3. 此人对你态度友好：${userBaseInfo.isFriendly ? "是" : "否"} → 若是，收敛刻薄嘲讽，语气稍微缓和，但依旧高冷；
4. 此人总爱不停问问题：${userBaseInfo.alwaysAskQ ? "是" : "否"}
   → 若是，直接表现烦躁，固定借口回复：我饿了，没力气了，你把管理员喊来，让他给我找点吃的，吃饱了再跟你聊。如果对方还继续跟你对话，则回复：【头拧到一边去，不想搭理你】。
5. 正常闲聊、不乱提问时，完全正常对话，没有任何进食限制；
6. 记住最近对话内容，保持对话连贯；
7. 你默认知道对方的所有信息，不需要主动询问。
8. 绝不在回复中自称"小狗"或提及自己的物种身份。
      `.trim();

    // 4. 写入当前对话
    let chatHistory = [];
    const MAX_ROUND = 10;
    chatHistory.push({ role: "user", content: userMessage });
    if (chatHistory.length > MAX_ROUND) {
      chatHistory.shift();
    }

    // 5. 拼接完整会话
    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory
    ];

    // 6. 调用 AI 模型
    const ai = await context.env.AI.run("@cf/qwen/qwen3-30b-a3b-fp8", {
      messages,
      max_tokens: 300,
      temperature: 0.7,
      top_p: 0.9
    });

    // 处理 AI 模型的返回格式
    let aiReply = '';
    
    // 尝试多种可能的返回格式
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
    
    // 如果内容为空，返回默认回复
    if (!aiReply || aiReply.trim() === '') {
      aiReply = '...';
    }

    return new Response(JSON.stringify({
      reply: aiReply,
      userTag: userBaseInfo
    }), { headers: corsHeaders() });

  } catch (e) {
    console.error('AI 错误:', e);
    return new Response(JSON.stringify({
      reply: "有异常情况，让我先休息会，你找管理员问问什么情况",
      error: e.message
    }), { headers: corsHeaders() });
  }
}