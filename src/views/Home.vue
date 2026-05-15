<template>
  <div class="home-page">
    <!-- 用户状态栏 -->
    <div class="user-bar">
      <template v-if="userStore.isLoggedIn">
        <router-link to="/profile" class="user-link">
          <span class="user-icon">👤</span>
          <span class="user-name">{{ userStore.user?.nickname }}</span>
        </router-link>
        <span class="notification-bell">🔔</span>
      </template>
      <template v-else>
        <router-link to="/login" class="auth-link">登录</router-link>
        <router-link to="/register" class="auth-link">注册</router-link>
      </template>
    </div>

    <!-- 顶部标题 -->
    <header class="header">
      <div class="title-wrapper">
        <h1 class="title sketch-font">好运人生</h1>
        <div class="title-underline"></div>
        <svg class="title-decoration" viewBox="0 0 100 100">
          <path d="M10,50 Q30,10 50,50 T90,50" fill="none" stroke="black" stroke-width="3"></path>
        </svg>
      </div>
      <p class="date-text">{{ currentDate }} · {{ solarTerm }}</p>
    </header>

    <!-- 导航格子 -->
    <nav class="nav-grid">
      <router-link to="/fortune" class="nav-link">
        <wired-card class="nav-item">
          <span class="nav-icon">🙏</span>
          <span class="nav-label">祈祷</span>
        </wired-card>
      </router-link>
      <router-link to="/events" class="nav-link">
        <wired-card class="nav-item">
          <span class="nav-icon">⚡</span>
          <span class="nav-label">事件</span>
        </wired-card>
      </router-link>
      <router-link to="/friends" class="nav-link">
        <wired-card class="nav-item">
          <span class="nav-icon">👥</span>
          <span class="nav-label">好友</span>
        </wired-card>
      </router-link>
      <router-link to="/map" class="nav-link">
        <wired-card class="nav-item">
          <span class="nav-icon">🗺️</span>
          <span class="nav-label">地图</span>
        </wired-card>
      </router-link>
    </nav>

    <!-- 运势大图区域 -->
    <div class="content-area">
      <wired-card class="fortune-card">
        <div class="fortune-image">
          <img :src="dailyFortuneImage" alt="今日运势" />
        </div>
        <div class="fortune-quote">
          <wired-divider></wired-divider>
          <p class="quote-text">"{{ dailyQuote }}"</p>
        </div>
      </wired-card>

      <div class="attr-bar-section" v-if="userStore.isLoggedIn">
        <div class="attr-item">
          <span class="attr-name">能量</span>
          <wired-progress :value="userStore.user?.attributes?.energy || 80" style="flex: 1;"></wired-progress>
          <span class="attr-value">{{ userStore.user?.attributes?.energy || 80 }}</span>
        </div>
        <div class="attr-item">
          <span class="attr-name">活力</span>
          <wired-progress :value="userStore.user?.attributes?.vitality || 60" style="flex: 1;"></wired-progress>
          <span class="attr-value">{{ userStore.user?.attributes?.vitality || 60 }}</span>
        </div>
      </div>
    </div>  

    <!-- 底部提示 -->
    <footer class="footer">
      <p class="copyright">好运人生 · 凌晨五点工作室 © 2026</p>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(() => {
  if (userStore.isLoggedIn) {
    userStore.fetchProfile()
  }
})

const currentDate = computed(() => {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  return `${month}月${day}日`
})

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

const dailyFortuneImage = computed(() => {
  return '/r2?path=home/sunny.png'
})

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
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.user-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  font-size: 12px;
}

.user-link {
  display: flex;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: #1a1a1a;
  font-weight: bold;
}

.user-icon {
  font-size: 14px;
}

.notification-bell {
  font-size: 16px;
  position: relative;
}

.auth-link {
  color: #666;
  text-decoration: none;
}

.auth-link:hover {
  text-decoration: underline;
}

.header {
  padding: 24px 24px 16px;
  text-align: center;
}

.title-wrapper {
  display: inline-block;
  position: relative;
}

.title {
  font-size: 32px;
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
  gap: 6px;
  padding: 0 16px;
  margin-bottom: 24px;
}

.nav-link {
  text-decoration: none;
  color: inherit;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  padding: 4px;
  text-align: center;
  background: #fff;
}

.nav-item:active {
  transform: translate(2px, 2px);
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
  padding: 0 16px 16px;
  overflow-y: auto;
}

.fortune-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #fafafa;
  padding: 16px;
}

.fortune-image {
  width: 100%;
  height: 100%;
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

.quote-text {
  font-size: 14px;
  font-style: italic;
  font-weight: 500;
}

.attr-section {
  margin-top: 24px;
  padding: 20px;
  background: #fff;
  border: 2.5px solid #000;
  border-radius: 4px;
}

.attr-bar-section {
  margin-top: 16px;
  padding: 16px;
  background: #fff;
  display: flex;
  gap: 24px;
}

.attr-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.attr-name {
  font-size: 12px;
  opacity: 0.6;
  white-space: nowrap;
}

.attr-value {
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
  min-width: 24px;
  text-align: right;
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
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
