export class NPCBase {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.avatar = config.avatar;
    this.title = config.title;
    this.description = config.description || '';
    
    // 对话轮数配置：[最小轮数, 最大轮数]
    // 到达最小轮数后开始随机中断，到达最大轮数后强制中断
    this.conversationRounds = config.conversationRounds || [15, 20];
  }

  getTimeContext(hour) {
    if (hour >= 5 && hour < 9) return '清晨';
    if (hour >= 9 && hour < 12) return '上午';
    if (hour >= 12 && hour < 14) return '中午';
    if (hour >= 14 && hour < 18) return '下午';
    if (hour >= 18 && hour < 22) return '晚上';
    return '深夜';
  }

  getDynamicContext(userInfo) {
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

  getDefaultFallbackMessage() {
    return '...';
  }

  getErrorMessage() {
    return '...';
  }

  getGreetingMessage(hour) {
    return this.getGreeting?.(hour) || '...';
  }

  // 判断是否应该中断对话
  shouldRefuseReply(userState, chatHistory) {
    const totalRounds = chatHistory.filter(m => m.role === 'user').length;
    const [minRounds, maxRounds] = this.conversationRounds;
    
    // 达到最大轮数，强制中断
    if (totalRounds >= maxRounds) {
      return true;
    }
    
    // 在最小到最大轮数之间，随机中断
    if (totalRounds >= minRounds && totalRounds < maxRounds) {
      // 随着轮数增加，中断概率递增
      const progress = (totalRounds - minRounds) / (maxRounds - minRounds);
      const refuseProbability = 0.3 + progress * 0.5; // 30% -> 80%
      if (Math.random() < refuseProbability) {
        return true;
      }
    }
    
    return false;
  }

  // 获取中断对话的理由（通用逻辑）
  getRefusalReason(chatHistory) {
    const hour = new Date().getHours();
    const reasons = [];
    
    // 根据时间生成相关理由
    if (hour >= 22 || hour < 6) {
      reasons.push('夜深了，该休息了');
      reasons.push('困了，要睡觉了');
    } else if (hour >= 12 && hour < 14) {
      reasons.push('该午休了');
      reasons.push('肚子饿了，要去觅食');
    } else if (hour >= 18 && hour < 20) {
      reasons.push('天黑了，该回去了');
      reasons.push('晚上还有事，先走了');
    } else if (hour >= 6 && hour < 9) {
      reasons.push('早上还有事要处理');
      reasons.push('要去活动活动筋骨了');
    }
    
    // 通用理由
    reasons.push('突然想起有件重要的事要处理');
    reasons.push('看到熟人了，过去打个招呼');
    reasons.push('看到仇家了，过去教训一顿');
    reasons.push('有点累了，想一个人静静');
    reasons.push('想起来还有个约会');
    reasons.push('突然想起东西忘拿了，回去找找');
    reasons.push('听到远处有动静，过去看看');
    reasons.push('手机响了，有急事要处理');
    
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  // 获取中断对话的消息
  getRefusalMessage() {
    return this.getRefusalReason();
  }

  // 获取持续拒绝的消息（用户继续追问时）
  getPersistentRefusalMessage() {
    return '';
  }
}
