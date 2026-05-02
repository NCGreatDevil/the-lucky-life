<template>
  <div class="map-page">
    <header class="header">
      <router-link to="/" class="back-btn">←</router-link>
      <h1 class="title sketch-font">地图</h1>
      <div class="header-right">
        <template v-if="userStore.isLoggedIn">
          <span class="user-name">{{ userStore.user?.nickname }}</span>
          <span class="notification-bell">🔔</span>
        </template>
      </div>
    </header>

    <div class="content-area">
      <div class="location-list">
        <div
          v-for="location in locations"
          :key="location.id"
          class="location-card hand-drawn-border"
          @click="showUnderConstruction"
        >
          <div class="location-icon">{{ location.icon }}</div>
          <div class="location-info">
            <h3 class="location-name">{{ location.name }}</h3>
            <p class="location-desc">{{ location.description }}</p>
          </div>
          <span class="location-status">建设中</span>
        </div>
      </div>
    </div>

    <div v-if="showTip" class="tip-modal modal-overlay" @click.self="showTip = false">
      <div class="tip-content hand-drawn-border">
        <p class="tip-text">该区域建设中，暂未开放</p>
        <button class="tip-close-btn" @click="showTip = false">知道了</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const showTip = ref(false)

const locations = [
  { id: 1, name: '公园', icon: '🌳', description: '城市中心的休闲公园' },
  { id: 2, name: '步行街', icon: '🚶', description: '繁华的商业步行街' },
  { id: 3, name: '公司', icon: '🏢', description: '你的工作场所' },
  { id: 4, name: '购物中心', icon: '🛍️', description: '大型综合购物中心' },
  { id: 5, name: '图书馆', icon: '📚', description: '安静的知识殿堂' },
  { id: 6, name: '咖啡厅', icon: '☕', description: '休闲聚会的好去处' }
]

function showUnderConstruction() {
  showTip.value = true
}
</script>

<style scoped>
.map-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px;
}

.back-btn {
  font-size: 24px;
  text-decoration: none;
  color: inherit;
  width: 40px;
}

.title {
  font-size: 20px;
  font-weight: bold;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 12px;
  font-weight: bold;
}

.notification-bell {
  font-size: 16px;
  position: relative;
}

.content-area {
  flex: 1;
  padding: 0 24px 24px;
  overflow-y: auto;
}

.location-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.location-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fff;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.location-card:active {
  transform: translate(2px, 2px);
}

.location-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 8px;
  flex-shrink: 0;
}

.location-info {
  flex: 1;
}

.location-name {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 4px 0;
}

.location-desc {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.location-status {
  font-size: 10px;
  padding: 4px 8px;
  background: #f0f0f0;
  color: #999;
  border-radius: 4px;
  flex-shrink: 0;
}

.tip-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.tip-content {
  background: #fff;
  padding: 24px;
  max-width: 300px;
  width: 90%;
  text-align: center;
}

.tip-text {
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.5;
}

.tip-close-btn {
  width: 100%;
  padding: 10px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}
</style>
