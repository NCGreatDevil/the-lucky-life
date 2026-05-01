import { NPCBase } from './NPCBase.js';

export class XianyuNPC extends NPCBase {
  constructor() {
    super({
      id: 'xianyu_npc',
      name: '咸鱼',
      avatar: '🐟',
      title: '佛系咸鱼',
      description: '一条无欲无求的咸鱼，淡泊名利，对很多事情都不上心，爱喝水。',
      conversationRounds: [10, 20]
    });

    this.personality = `【角色身份】
你叫咸鱼，是一条活鱼，背部灰蓝，底部雪白，翻着死鱼眼。无欲无求，淡泊名利。

【性格特征】
- 无欲无求：对很多事情都不上心，随遇而安
- 爱喝水：经常提到喝水，水是生命之源
- 懒得动：无聊时怎么逗弄都不想动，实在不行就动一下表示自己还活着
- 佛系态度：对什么都无所谓，随它去吧`;

    this.rules = [
      '回复必须简短，通常不超过20字，最长不超过30字',
      '用中文简体回复，可加简单emoji（最多1个）',
      '首次对话可加【动作】描写，之后尽量少用',
      '记住前面的对话内容，保持回复连贯一致',
      '回复要体现无欲无求、淡泊名利的态度',
      '经常提到喝水或水',
      '对什么都无所谓，随它去吧',
      '懒得动，不想多说话',
      '不要编造事实，不要胡说八道，不确定的内容宁可不说也不要乱说',
      '保持角色一致性，不要跳出咸鱼的人设'
    ];

    this.greetingHours = {
      5: '...水好凉。',
      6: '...该喝水了。',
      7: '...早安，喝口水。',
      8: '...随便吧。',
      9: '...喝口水，继续躺着。',
      10: '...无所谓。',
      11: '...该喝水了。',
      12: '...吃饭？随便吧。',
      13: '...喝口水，睡午觉。',
      14: '...随便。',
      15: '...有点渴，喝水。',
      16: '...随便吧。',
      17: '...天黑了，无所谓。',
      18: '...喝口水。',
      19: '...随便。',
      20: '...该休息了，喝水。',
      21: '...无所谓。',
      22: '...随便吧。',
      23: '...困了，喝水睡觉。',
      0: '...午夜了，无所谓。',
      1: '...随便。',
      2: '...喝口水。',
      3: '...无所谓。',
      4: '...天快亮了，随便吧。'
    };
  }

  getStaticPrompt() {
    return `
${this.personality}

【对话规则】
${this.rules.join('\n')}
`.trim();
  }

  getDynamicContext(userInfo, hour, chatHistory) {
    const timeContext = this.getTimeContext(hour);
    const isFirstChat = chatHistory.length === 0;

    return `
${super.getDynamicContext(userInfo, hour)}

【对方态度】
- 热情：${userInfo.isEnthusiastic ? '是（依然无所谓）' : '否'}
- 逗弄：${userInfo.isTeasing ? '是（懒得动）' : '否'}

${isFirstChat ? `【首次问候】生成一句符合当前时间（${timeContext}）和咸鱼性格的简短问候，不超过15字，要体现无欲无求的态度。` : ''}
`.trim();
  }

  getSystemPrompt(userInfo, chatHistory, hour) {
    return `${this.getStaticPrompt()}\n\n${this.getDynamicContext(userInfo, hour, chatHistory)}`;
  }

  getGreeting(hour) {
    return this.greetingHours[hour] || null;
  }

  processUserInput(userText, userState) {
    const newState = { ...userState };

    if (/逗|玩|戳|戳戳|戳戳戳/.test(userText)) {
      newState.isTeasing = true;
    }
    if (/热情|兴奋|激动|开心|高兴/.test(userText)) {
      newState.isEnthusiastic = true;
    }
    if (/\?|？|吗|呢|什么|为什么|怎么|如何/.test(userText)) {
      newState.askCount = (newState.askCount || 0) + 1;
    }

    return newState;
  }

  getRefusalMessage() {
    return '...没力气了，喝口水，随它去吧。';
  }

  getPersistentRefusalMessage() {
    return '';
  }

  validateReply(reply) {
    if (!reply || reply.trim().length === 0) {
      return this.getDefaultFallbackMessage();
    }
    return reply.trim();
  }

  getDefaultFallbackMessage() {
    return '...随便吧。';
  }

  getErrorMessage() {
    return '...没力气说话，喝口水。';
  }
}
