<template>
  <div class="friends-page">
    <!-- 顶部标题 -->
    <header class="header">
      <router-link to="/" class="back-btn">←</router-link>
      <h1 class="title sketch-font">我的好友</h1>
      <div class="placeholder"></div>
    </header>

    <!-- 好友列表区域 -->
    <div class="content-area">
      <!-- 好友匹配触发 -->
      <div class="match-section">
        <button class="match-btn hand-drawn-border" @click="triggerMatch">
          <span class="match-icon">🔗</span>
          <span class="match-text">触发好友匹配</span>
        </button>
        <p class="match-tip">通过随机事件认识新朋友</p>
      </div>

      <!-- 匹配弹窗 -->
      <div v-if="showMatchResult" class="match-modal modal-overlay" @click.self="closeMatch">
        <div class="match-card modal-content hand-drawn-border">
          <h3 class="match-title">发现新好友</h3>
          <div class="potential-friend">
            <div class="friend-avatar">
              <span class="avatar-emoji">{{ matchedFriend.avatar }}</span>
            </div>
            <div class="friend-info">
              <p class="friend-name">{{ matchedFriend.name }}</p>
              <p class="friend-level">Lv.{{ matchedFriend.level }} {{ matchedFriend.title }}</p>
            </div>
          </div>
          <div class="friend-tags" v-if="matchedFriend.tags.length">
            <span v-for="tag in matchedFriend.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <div class="match-actions">
            <button class="btn-secondary" @click="rejectMatch">拒绝</button>
            <button class="btn-primary" @click="acceptMatch">添加</button>
          </div>
        </div>
      </div>

      <!-- 好友列表 -->
      <div class="friends-section">
        <h3 class="section-title">好友列表 ({{ roleStore.friends.length }})</h3>
        <div class="friends-list" v-if="roleStore.friends.length > 0">
          <div v-for="friend in roleStore.friends" :key="friend.id" class="friend-item hand-drawn-border">
            <div class="friend-avatar">
              <span class="avatar-emoji">{{ friend.avatar }}</span>
            </div>
            <div class="friend-details">
              <div class="friend-header">
                <p class="friend-name">{{ friend.name }}</p>
                <span class="friend-level">Lv.{{ friend.level }}</span>
              </div>
              <p class="friend-title">{{ friend.title }}</p>
              <div class="friend-tags" v-if="friend.tags.length">
                <span v-for="tag in friend.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </div>
            <button class="remove-btn" @click="removeFriend(friend.id)">×</button>
          </div>
        </div>
        <div v-else class="empty-tip">
          还没有好友，通过随机事件认识新朋友吧！
        </div>
      </div>

      <!-- 互动说明 -->
      <div class="info-section">
        <div class="info-card">
          <p class="info-icon">💡</p>
          <p class="info-text">好友功能说明</p>
          <ul class="info-list">
            <li>好友通过随机事件匹配添加</li>
            <li>可以查看好友的角色信息</li>
            <li>不支持站内私信功能</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoleStore } from '@/stores/role'

const roleStore = useRoleStore()

const showMatchResult = ref(false)
const matchedFriend = ref(null)

// 虚拟好友池（用于匹配）
const friendPool = [
  { name: '小明', avatar: '🌱', title: '好运萌新', tags: ['人缘不错'], level: 3 },
  { name: '小红', avatar: '🌿', title: '小财神', tags: ['小财神', '开心果'], level: 8 },
  { name: '阿强', avatar: '🌳', title: '事业有成', tags: ['职场新人', '精力充沛'], level: 12 },
  { name: '小美', avatar: '🌸', title: '万人迷', tags: ['万人迷', '情绪稳定'], level: 15 },
  { name: '老王', avatar: '🌲', title: '行业精英', tags: ['行业精英', '学富五车'], level: 25 },
  { name: '小雪', avatar: '❄️', title: '桃花泛滥', tags: ['桃花泛滥', '好学宝宝'], level: 18 },
  { name: '石头', avatar: '🪨', title: '财运亨通', tags: ['财运亨通', '精力充沛'], level: 22 },
  { name: '云朵', avatar: '☁️', title: '博古通今', tags: ['博古通今', '情绪稳定'], level: 30 }
]

let friendIdCounter = 1

function triggerMatch() {
  const randomFriend = friendPool[Math.floor(Math.random() * friendPool.length)]
  matchedFriend.value = {
    ...randomFriend,
    id: friendIdCounter++
  }
  showMatchResult.value = true
}

function acceptMatch() {
  if (matchedFriend.value) {
    roleStore.addFriend(matchedFriend.value)
  }
  closeMatch()
}

function rejectMatch() {
  closeMatch()
}

function closeMatch() {
  showMatchResult.value = false
  matchedFriend.value = null
}

function removeFriend(friendId) {
  roleStore.removeFriend(friendId)
}
</script>

<style scoped>
.friends-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 48px 24px 24px;
}

.back-btn {
  font-size: 24px;
  text-decoration: none;
  color: inherit;
  width: 40px;
}

.title {
  font-size: 24px;
  font-weight: bold;
}

.placeholder {
  width: 40px;
}

.content-area {
  flex: 1;
  padding: 0 24px 24px;
  overflow-y: auto;
}

.match-section {
  text-align: center;
  margin-bottom: 24px;
}

.match-btn {
  width: 100%;
  padding: 16px;
  background: #fff;
  border: 2px solid #000;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.1s ease;
}

.match-btn:active {
  transform: translate(4px, 4px);
}

.match-icon {
  font-size: 24px;
}

.match-text {
  font-size: 14px;
  font-weight: bold;
}

.match-tip {
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.5;
}

.match-modal {
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

.match-card {
  background: #fff;
  padding: 24px;
  max-width: 300px;
  width: 90%;
  text-align: center;
}

.match-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
}

.potential-friend {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.friend-avatar {
  width: 56px;
  height: 56px;
  border: 2px solid #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.avatar-emoji {
  font-size: 28px;
}

.friend-info {
  flex: 1;
  text-align: left;
}

.friend-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
}

.friend-level {
  font-size: 12px;
  opacity: 0.6;
}

.friend-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-bottom: 20px;
}

.tag {
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 2px;
  font-size: 10px;
}

.match-actions {
  display: flex;
  gap: 12px;
}

.match-actions button {
  flex: 1;
}

.friends-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.friends-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.friend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
}

.friend-details {
  flex: 1;
}

.friend-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.friend-header .friend-name {
  font-size: 14px;
  font-weight: bold;
}

.friend-header .friend-level {
  font-size: 10px;
  background: #000;
  color: #fff;
  padding: 1px 4px;
  border-radius: 2px;
}

.friend-title {
  font-size: 11px;
  opacity: 0.6;
  margin-bottom: 6px;
}

.friend-item .friend-tags {
  justify-content: flex-start;
  margin-bottom: 0;
}

.remove-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #ddd;
  border-radius: 50%;
  background: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
}

.remove-btn:hover {
  opacity: 1;
  background: #ffebee;
  border-color: #f44336;
  color: #f44336;
}

.empty-tip {
  text-align: center;
  opacity: 0.5;
  padding: 32px;
  font-size: 14px;
}

.info-section {
  margin-top: auto;
}

.info-card {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 4px;
  text-align: center;
}

.info-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.info-text {
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 8px;
}

.info-list {
  list-style: none;
  font-size: 11px;
  opacity: 0.6;
  text-align: left;
  padding-left: 16px;
}

.info-list li {
  margin-bottom: 4px;
}

.btn-primary {
  background: #000;
  color: #fff;
  border: none;
  padding: 12px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}

.btn-secondary {
  background: #fff;
  color: #000;
  border: 2px solid #000;
  padding: 12px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}

.modal-overlay {
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

.modal-content {
  background: #fff;
  border: 2.5px solid #000;
  border-radius: 4px;
  padding: 20px;
  max-width: 320px;
  width: 90%;
}
</style>
