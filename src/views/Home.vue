<template>
  <div class="home-page">
    <!-- 顶部标题 -->
    <header class="header">
      <div class="title-wrapper">
        <h1 class="title sketch-font">好运人生</h1>
        <div class="title-underline"></div>
        <!-- 装饰线条 -->
        <svg class="title-decoration" viewBox="0 0 100 100">
          <path d="M10,50 Q30,10 50,50 T90,50" fill="none" stroke="black" stroke-width="3"></path>
        </svg>
      </div>
      <p class="date-text">{{ currentDate }} · {{ solarTerm }}</p>
    </header>

    <!-- 导航格子 -->
    <nav class="nav-grid">
      <router-link to="/fortune" class="nav-item">
        <span class="nav-icon">⭐</span>
        <span class="nav-label">求神问卜</span>
      </router-link>
      <router-link to="/role" class="nav-item">
        <span class="nav-icon">👤</span>
        <span class="nav-label">我的角色</span>
      </router-link>
      <router-link to="/events" class="nav-item">
        <span class="nav-icon">⚡</span>
        <span class="nav-label">随机事件</span>
      </router-link>
      <router-link to="/friends" class="nav-item">
        <span class="nav-icon">👥</span>
        <span class="nav-label">我的好友</span>
      </router-link>
    </nav>

    <!-- 运势大图区域 -->
    <div class="content-area">
      <div class="fortune-card hand-drawn-border">
        <div class="fortune-image">
          <img :src="dailyFortuneImage" alt="今日运势" />
        </div>
        <div class="fortune-quote">
          <div class="divider"></div>
          <p class="quote-text">"{{ dailyQuote }}"</p>
          <p class="luck-level">Luckiness: {{ luckLevel }}</p>
        </div>
      </div>

      <!-- 底部状态概览 -->
      <div class="status-overview hand-drawn-border">
        <div class="status-header">
          <span class="status-label">Current Status</span>
          <span class="status-level">Lv.{{ roleStore.roleLevel }} {{ roleStore.roleTitle }}</span>
        </div>
        <div class="status-bars">
          <div class="status-item" v-for="(attr, name) in visibleAttrs" :key="name">
            <div class="status-info">
              <span>{{ name }}</span>
              <span>{{ attr }}%</span>
            </div>
            <div class="progress-bar">
              <div class="fill" :style="{ width: attr + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部提示 -->
    <footer class="footer">
      <p class="copyright">好运人生 · 极简生活实验室 © 2026</p>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoleStore } from '@/stores/role'

const roleStore = useRoleStore()

// 获取当前日期
const currentDate = computed(() => {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  return `${month}月${day}日`
})

// 节气（简化版，实际项目中可用日历库）
const solarTerm = computed(() => {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()

  const terms = {
    '1-20': '大寒', '2-4': '立春', '2-19': '雨水', '3-5': '惊蛰',
    '3-20': '春分', '4-5': '清明', '4-20': '谷雨', '5-5': '立夏',
    '5-21': '小满', '6-6': '芒种', '6-21': '夏至', '7-7': '小暑',
    '7-23': '大暑', '8-7': '立秋', '8-23': '处暑', '9-7': '白露',
    '9-23': '秋分', '10-8': '寒露', '10-23': '霜降', '11-7': '立冬',
    '11-22': '小雪', '12-7': '大雪', '12-21': '冬至', '1-5': '小寒'
  }

  const key = `${month}-${day}`
  return terms[key] || '日常'
})

// 每日运势图（使用占位图，实际项目替换真实图片）
const dailyFortuneImage = computed(() => {
  return 'https://modao.cc/agent-py/media/generated_images/2026-04-20/9ae827ab420b44f1ab4b20089803fbc7.jpg'
})

// 每日语录
const dailyQuotes = [
  '今日宜：放下执念，顺其自然。',
  '宜保持微笑，微笑带来好运。',
  '今日适合尝试新事物。',
  '宜静心思考，沉淀自我。',
  '今日运势上扬，适合社交。'
]

const dailyQuote = computed(() => {
  const index = new Date().getDate() % dailyQuotes.length
  return dailyQuotes[index]
})

// 运势等级
const luckLevel = computed(() => {
  const stars = Math.min(5, Math.floor(Math.random() * 3) + 3)
  return '★'.repeat(stars) + '☆'.repeat(5 - stars)
})

// 可见属性（最多显示2个）
const visibleAttrs = computed(() => {
  const attrs = roleStore.visibleAttributes
  const entries = Object.entries(attrs).slice(0, 2)
  return Object.fromEntries(entries)
})

onMounted(() => {
  roleStore.checkDailyReset()
})
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.header {
  padding: 48px 24px 24px;
  text-align: center;
}

.title-wrapper {
  display: inline-block;
  position: relative;
}

.title {
  font-size: 36px;
  font-weight: bold;
  letter-spacing: 8px;
  position: relative;
  z-index: 1;
}

.title-underline {
  position: absolute;
  bottom: -4px;
  left: -8px;
  right: -8px;
  height: 12px;
  background: rgba(0, 0, 0, 0.05);
  transform: rotate(-1deg);
  z-index: 0;
}

.title-decoration {
  position: absolute;
  top: -16px;
  right: -24px;
  width: 32px;
  height: 32px;
}

.date-text {
  font-size: 12px;
  margin-top: 8px;
  opacity: 0.6;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 0 24px;
  margin-bottom: 32px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  border: 2.5px solid #000;
  border-radius: 4px;
  padding: 4px;
  text-align: center;
  text-decoration: none;
  color: inherit;
  background: #fff;
  transition: transform 0.1s ease;
}

.nav-item:active {
  transform: translate(2px, 2px);
}

.nav-item::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 1px solid #000;
  border-radius: 6px;
  opacity: 0.3;
  pointer-events: none;
}

.nav-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.nav-label {
  font-size: 10px;
  font-weight: bold;
}

.content-area {
  flex: 1;
  padding: 0 24px 32px;
  overflow-y: auto;
  overflow-x: hidden;
}

.fortune-card {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #fafafa;
  padding: 16px;
}

.fortune-image {
  width: 66%;
  height: 66%;
  opacity: 0.8;
  filter: grayscale(100%);
}

.fortune-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fortune-quote {
  margin-top: 16px;
  padding: 0 24px;
  text-align: center;
}

.divider {
  width: 48px;
  height: 2px;
  background: #000;
  margin: 0 auto 12px;
}

.quote-text {
  font-size: 14px;
  font-style: italic;
  font-weight: 500;
}

.luck-level {
  font-size: 10px;
  margin-top: 8px;
  opacity: 0.5;
}

.status-overview {
  margin-top: 32px;
  padding: 16px;
  background: #000;
  color: #fff;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status-label {
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.status-level {
  font-size: 10px;
  opacity: 0.7;
}

.status-bars {
  display: flex;
  gap: 16px;
}

.status-item {
  flex: 1;
}

.status-info {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  margin-bottom: 4px;
}

.progress-bar {
  height: 4px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
}

.progress-bar .fill {
  height: 100%;
  background: #fff;
  transition: width 0.3s ease;
}

.footer {
  padding: 16px;
  text-align: center;
}

.copyright {
  font-size: 10px;
  opacity: 0.4;
}
</style>
