import { corsHeaders } from '../_utils.js';

export default {
  async fetch(request, env) {
    const cors = corsHeaders();

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    try {
      const req = await request.json();
      const userText = req.content?.trim() || "";

      // 测试响应
      return new Response(JSON.stringify({
        reply: "测试：" + userText,
        userTag: {
          name: "陌生人",
          hasTauntMe: false,
          isFriendly: false,
          alwaysAskQ: false
        }
      }), { headers: cors });

    } catch (e) {
      return new Response(JSON.stringify({
        reply: "懒得多说。"
      }), { headers: cors });
    }
  }
};