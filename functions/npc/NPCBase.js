export class NPCBase {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.avatar = config.avatar;
    this.title = config.title;
    this.personality = config.personality;
    this.rules = config.rules;
    this.greetingHours = config.greetingHours || {};
  }

  getStaticPrompt() {
    return `
${this.personality}

【对话规则】
${this.rules.join('\n')}
`.trim();
  }

  getDynamicContext(userInfo, chatHistory) {
    const hour = new Date().getHours();
    const timeContext = this.getTimeContext(hour);

    return `
【对话对象】
- 姓名：${userInfo.name || '未知'}
- 年龄：${userInfo.age || '未知'}
- 职业：${userInfo.job || '无'}
- 简介：${userInfo.bio || '暂无'}

【当前时间】${hour}点（${timeContext}）
`.trim();
  }

  getSystemPrompt(userInfo, chatHistory) {
    return `${this.getStaticPrompt()}\n\n${this.getDynamicContext(userInfo, chatHistory)}`;
  }

  getTimeContext(hour) {
    if (hour >= 5 && hour < 9) return '清晨';
    if (hour >= 9 && hour < 12) return '上午';
    if (hour >= 12 && hour < 14) return '中午';
    if (hour >= 14 && hour < 18) return '下午';
    if (hour >= 18 && hour < 22) return '晚上';
    return '深夜';
  }

  getGreeting(hour) {
    return this.greetingHours[hour] || null;
  }

  processUserInput(userText, userState) {
    const newState = { ...userState };

    if (/嘲讽|骂|嫌弃|看不起|嫌弃你|笨|傻/.test(userText)) {
      newState.hasTauntMe = true;
    }
    if (/可爱|喜欢你|摸摸|很乖|善待|友好|好|棒/.test(userText)) {
      newState.isFriendly = true;
    }
    if (/\?|？|吗|呢|什么|为什么|怎么|如何/.test(userText)) {
      newState.askCount = (newState.askCount || 0) + 1;
    }

    return newState;
  }

  shouldRefuseReply(userState, chatHistory) {
    const totalRounds = chatHistory.filter(m => m.role === 'user').length;
    return totalRounds >= 20 || userState.askCount >= 10;
  }

  getRefusalMessage() {
    return '...不想说了。';
  }

  validateReply(reply) {
    if (!reply || reply.trim().length === 0) {
      return '...';
    }
    return reply.trim();
  }
}
