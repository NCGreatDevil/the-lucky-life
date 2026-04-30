export class NPCBase {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.avatar = config.avatar;
    this.title = config.title;
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
}
