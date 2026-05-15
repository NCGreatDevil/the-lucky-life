<template>
  <div class="events-page">
    <div class="user-bar">
      <template v-if="userStore.isLoggedIn">
        <router-link to="/profile" class="user-link">
          <span class="user-icon">👤</span>
          <span class="user-name">{{ userStore.user?.nickname }}</span>
        </router-link>
      </template>
    </div>

    <header class="header">
      <router-link to="/" class="back-btn">←</router-link>
      <h1 class="title sketch-font">事件</h1>
      <div class="placeholder"></div>
    </header>

    <div class="content-area">
      <div v-if="isPageLoading" class="skeleton-container">
        <div class="skeleton-card skeleton-trigger"></div>
        <div class="skeleton-attr-bar">
          <div class="skeleton-attr-item"></div>
          <div class="skeleton-attr-item"></div>
        </div>
        <div class="skeleton-history">
          <div class="skeleton-card skeleton-history-item"></div>
          <div class="skeleton-card skeleton-history-item"></div>
          <div class="skeleton-card skeleton-history-item"></div>
        </div>
      </div>

      <template v-else>

      <div class="pending-toggle" v-if="pendingCount > 0" @click="showPendingEvents = !showPendingEvents">
        <span class="pending-toggle-icon">📋</span>
        <span class="pending-toggle-text">待处理事件 ({{ pendingCount }})</span>
      </div>

      <div class="trigger-section">
        <wired-button class="trigger-btn hand-drawn-border" @click="triggerActiveEvent" :disabled="isEventActive || isLoading" style="width: 100%;">
          <span class="trigger-icon">⚡</span>
          <span class="trigger-text">{{ isEventActive ? '事件进行中...' : isLoading ? '加载中...' : '触发随机事件' }}</span>
        </wired-button>
        <p class="trigger-tip">消耗10能量，可能触发各种事件</p>
      </div>
      
      <!-- 测试按钮：恢复满状态 -->
      <div class="test-section" v-if="isAdmin">
        <button class="test-btn" @click="restoreFullStatus">
          恢复满状态（测试用）
        </button>
      </div>

      <!-- 属性条 -->
      <div class="attr-bar-fixed" v-if="userStore.isLoggedIn">
        <div class="attr-item">
          <span class="attr-name">能量</span>
          <div class="attr-bar">
            <div class="attr-fill energy" :style="{ width: (userStore.user?.attributes?.energy || 80) + '%' }"></div>
          </div>
          <span class="attr-value">{{ userStore.user?.attributes?.energy || 80 }}</span>
        </div>
        <div class="attr-item">
          <span class="attr-name">活力</span>
          <div class="attr-bar">
            <div class="attr-fill vitality" :style="{ width: (userStore.user?.attributes?.vitality || 60) + '%' }"></div>
          </div>
          <span class="attr-value">{{ userStore.user?.attributes?.vitality || 60 }}</span>
        </div>
      </div>

      <div v-if="showPendingEvents && pendingEvents.length > 0" class="pending-events-panel hand-drawn-border">
        <h3 class="panel-title">待处理事件</h3>
        <div class="pending-list">
          <div v-for="event in pendingEvents" :key="event.id" class="pending-item" @click="resolvePendingEvent(event)">
            <div class="pending-header">
              <span class="pending-badge">{{ event.category === 'npc' ? 'NPC' : event.category === 'friend' ? '好友' : '普通' }}</span>
              <span class="pending-countdown" :class="{ 'expiring-soon': isExpiringSoon(event.expiresAt) }">
                {{ getCountdownText(event.expiresAt) }}
              </span>
            </div>
            <p class="pending-name">{{ event.name }}</p>
            <p class="pending-desc">{{ event.description }}</p>
          </div>
        </div>
      </div>

      <div v-if="isEventActive && currentEvent" class="event-modal modal-overlay" @click.self="closeEvent">
        <div class="event-card modal-content hand-drawn-border">
          <div class="event-header">
            <span v-if="!currentEvent.encounter" class="event-badge">{{ getCategoryLabel(currentEvent.category) }}</span>
            <span v-if="currentEvent.encounter" class="encounter-badge">
              {{ currentEvent.encounter.type === 'npc' ? ' NPC' : '👤 真人' }}
            </span>
          </div>

          <div v-if="currentEvent.encounter" class="encounter-info">
            <img v-if="currentEvent.encounter.npcAvatar" :src="currentEvent.encounter.npcAvatar" class="encounter-avatar" />
            <div class="encounter-details">
              <p class="encounter-name">{{ currentEvent.encounter.npcName || currentEvent.encounter.nickname }}</p>
              <p v-if="currentEvent.encounter.npcTitle" class="encounter-title">{{ currentEvent.encounter.npcTitle }}</p>
              <p class="encounter-fav">好感度 +{{ currentEvent.encounter.favorabilityGained }} (总计 {{ currentEvent.encounter.totalFavorability }})</p>
            </div>
          </div>

          <h3 class="event-title">{{ currentEvent.name }}</h3>
          <p class="event-description">{{ currentEvent.description }}</p>

          <div class="event-choices" v-if="!eventResolved">
            <p class="choices-hint">请选择：</p>
            <wired-button
              v-for="option in currentEvent.options"
              :key="option.id"
              class="choice-btn"
              @click="makeChoice(option.id)"
              :disabled="isSubmitting || !isOptionAvailable(option)"
              :title="getOptionDisabledReason(option)"
              style="width: 100%;"
            >
              {{ option.text }}
              <span v-if="!isOptionAvailable(option)" class="disabled-reason">（{{ getOptionDisabledReason(option) }}）</span>
            </wired-button>
            <wired-button
              v-if="allOptionsDisabled"
              class="skip-btn"
              @click="skipEvent"
              :disabled="isSubmitting"
              style="width: 100%;"
            >
              跳过此事件
            </wired-button>
          </div>

          <div class="event-result" v-if="eventResolved">
            <p class="result-text">{{ resultText }}</p>
            <div class="result-changes" v-if="resultChanges && Object.keys(resultChanges).length > 0">
              <span
                v-for="(value, attr) in resultChanges"
                :key="attr"
                class="change-tag"
                :class="{ positive: value > 0, negative: value < 0 }"
              >
                {{ attr }} {{ value > 0 ? '+' : '' }}{{ value }}
              </span>
            </div>
            <wired-button class="confirm-btn" @click="confirmEvent" style="width: 100%;">确定</wired-button>
          </div>
        </div>
      </div>

      <div class="history-section">
        <h3 class="section-title">事件历史</h3>
        <div class="history-list" v-if="history.length > 0">
          <div v-for="item in history" :key="item.id" class="history-item">
            <div class="history-header">
              <span class="history-type">{{ item.event_type === 'active' ? '主动' : '被动' }}</span>
              <span class="history-time">{{ formatTime(item.timestamp) }}</span>
            </div>
            <p class="history-title">{{ item.event_title }}</p>
            <p class="history-choice">选择了：{{ item.choice }}</p>
            <div class="history-changes" v-if="item.changes">
              <span
                v-for="(value, attr) in parseChanges(item.changes)"
                :key="attr"
                class="change-tag small"
                :class="{ positive: value > 0, negative: value < 0 }"
              >
                {{ attr }} {{ value > 0 ? '+' : '' }}{{ value }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="empty-tip">
          暂无事件记录，去触发一些事件吧！
        </div>
      </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoleStore } from '@/stores/role'
import { useUserStore } from '@/stores/user'

const roleStore = useRoleStore()
const userStore = useUserStore()

const isAdmin = computed(() => userStore.user?.id === 'admin')

const isEventActive = ref(false)
const eventResolved = ref(false)
const currentEvent = ref(null)
const isLoading = ref(false)
const isPageLoading = ref(true)
const isSubmitting = ref(false)
const resultText = ref('')
const resultChanges = ref({})
const pendingCount = ref(0)
const pendingEvents = ref([])
const showPendingEvents = ref(false)
const history = ref([])
const currentAttributes = ref(null)
const countdownTimer = ref(null)

function getCountdownText(expiresAt) {
  const now = new Date()
  const expires = new Date(expiresAt)
  const diff = expires.getTime() - now.getTime()

  if (diff <= 0) return '已过期'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else {
    return `${minutes}分钟`
  }
}

function isExpiringSoon(expiresAt) {
  const now = new Date()
  const expires = new Date(expiresAt)
  const diff = expires.getTime() - now.getTime()
  return diff > 0 && diff < 60 * 60 * 1000
}

function startCountdownTimer() {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
  }
  countdownTimer.value = setInterval(() => {
    const now = new Date()
    const expiredEvents = pendingEvents.value.filter(e => new Date(e.expiresAt) <= now)
    if (expiredEvents.length > 0) {
      loadPendingEvents()
    }
  }, 60000)
}

function stopCountdownTimer() {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
}

const attrKeyMap = {
  energy: '能量',
  vitality: '活力',
  morality: '道德',
  intelligence: '智力',
  constitution: '体质',
  charm: '魅力',
  willpower: '意志',
  emotion: '情绪',
  popularity: '人缘',
  money: '金钱',
  luck: '运气'
}

function isOptionAvailable(option) {
  if (!currentAttributes.value || !option.effects) return true

  try {
    const effects = JSON.parse(option.effects)
    for (const effect of effects) {
      const { attr, range } = effect
      const [minVal] = range
      if (minVal < 0) {
        const currentVal = currentAttributes.value[attr] || 0
        if (currentVal + minVal < 0) {
          return false
        }
      }
    }
    return true
  } catch {
    return true
  }
}

function getOptionDisabledReason(option) {
  if (!currentAttributes.value || !option.effects) return ''

  try {
    const effects = JSON.parse(option.effects)
    const insufficientAttrs = []
    for (const effect of effects) {
      const { attr, range } = effect
      const [minVal] = range
      if (minVal < 0) {
        const currentVal = currentAttributes.value[attr] || 0
        if (currentVal + minVal < 0) {
          insufficientAttrs.push(attrKeyMap[attr] || attr)
        }
      }
    }
    return insufficientAttrs.length > 0 ? `${insufficientAttrs.join('、')}不足` : ''
  } catch {
    return ''
  }
}

const allOptionsDisabled = computed(() => {
  if (!currentEvent.value?.options || currentEvent.value.options.length === 0) return false
  return currentEvent.value.options.every(opt => !isOptionAvailable(opt))
})

async function skipEvent() {
  if (isSubmitting.value || !currentEvent.value) return

  isSubmitting.value = true
  try {
    const response = await fetch('/api/events/skip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        eventId: currentEvent.value.id,
        isPending: currentEvent.value.isPending
      })
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || '跳过失败')
      return
    }

    if (result.attributes) {
      for (const [key, value] of Object.entries(result.attributes)) {
        const attrName = attrKeyMap[key]
        if (attrName && roleStore.attributes[attrName]) {
          roleStore.attributes[attrName].value = value
        }
        if (userStore.user?.attributes && (key === 'energy' || key === 'vitality')) {
          userStore.user.attributes[key] = value
          sessionStorage.setItem('user_data', JSON.stringify(userStore.user))
        }
      }
    }

    alert('已跳过事件')
    isEventActive.value = false
    currentEvent.value = null
    await loadHistory()
    await loadPendingCount()
    await loadPendingEvents()
  } catch (error) {
    console.error('跳过事件错误:', error)
    alert('跳过失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

async function triggerActiveEvent() {
  if (isEventActive.value || isLoading.value) return

  isLoading.value = true
  try {
    const response = await fetch('/api/events/active', {
      method: 'GET',
      credentials: 'include'
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || '触发事件失败')
      return
    }

    currentEvent.value = result.event
    currentEvent.value.isPending = false
    currentAttributes.value = result.currentAttributes || null
    eventResolved.value = false
    isEventActive.value = true

    if (result.currentEnergy !== undefined) {
      if (userStore.user?.attributes) {
        userStore.user.attributes.energy = result.currentEnergy
        sessionStorage.setItem('user_data', JSON.stringify(userStore.user))
      }
      roleStore.updateAttribute('能量', result.currentEnergy - (roleStore.attributes.能量?.value || 80))
    }

    await loadPendingCount()
    await loadPendingEvents()
  } catch (error) {
    console.error('触发事件错误:', error)
    alert('触发事件失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

async function makeChoice(optionId) {
  if (isSubmitting.value) return

  isSubmitting.value = true
  try {
    const response = await fetch('/api/events/choose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        optionId,
        passiveEventId: currentEvent.value?.isPending ? currentEvent.value?.id : undefined
      })
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || '结算失败')
      return
    }

    resultText.value = `${result.event.name} - 已选择: ${result.event.choice}`
    resultChanges.value = result.event.changes || {}

    if (result.attributes) {
      for (const [key, value] of Object.entries(result.attributes)) {
        const attrMap = {
          energy: '能量',
          vitality: '活力',
          morality: '道德',
          intelligence: '智力',
          constitution: '体质',
          charm: '魅力',
          willpower: '意志',
          emotion: '情绪',
          popularity: '人缘',
          money: '金钱',
          luck: '运气'
        }
        const attrName = attrMap[key]
        if (attrName && roleStore.attributes[attrName]) {
          roleStore.attributes[attrName].value = value
        }
        if (userStore.user?.attributes && (key === 'energy' || key === 'vitality')) {
          userStore.user.attributes[key] = value
        }
      }
    }

    eventResolved.value = true
    await loadHistory()
    await loadPendingCount()
  } catch (error) {
    console.error('结算错误:', error)
    alert('结算失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

async function resolvePendingEvent(event) {
  showPendingEvents.value = false
  currentEvent.value = {
      id: event.id,
      name: event.name,
      description: event.description,
      category: event.category,
      options: [],
      encounter: null,
      isPending: true
    }

  try {
    const response = await fetch(`/api/events/options/${event.eventId}`, {
      method: 'GET',
      credentials: 'include'
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || '获取选项失败')
      return
    }

    currentEvent.value.options = result.options
    currentAttributes.value = result.currentAttributes || null
    eventResolved.value = false
    isEventActive.value = true
  } catch (error) {
    console.error('获取选项错误:', error)
    alert('获取选项失败')
  }
}

async function confirmEvent() {
  isEventActive.value = false
  currentEvent.value = null
  resultText.value = ''
  resultChanges.value = {}

  await loadPendingEvents()
  await loadHistory()

  if (pendingEvents.value.length > 0) {
    showPendingEvents.value = true
  }
}

function closeEvent() {
  if (!eventResolved.value) {
    isEventActive.value = false
    currentEvent.value = null
  }
}

async function loadPendingCount() {
  try {
    const response = await fetch('/api/events/pending-count', {
      credentials: 'include'
    })

    if (response.ok) {
      const result = await response.json()
      pendingCount.value = result.count || 0
      window.dispatchEvent(new CustomEvent('pending-count-change', { detail: pendingCount.value }))
    }
  } catch (error) {
    console.error('加载待处理数量错误:', error)
  }
}

async function loadPendingEvents() {
  try {
    const response = await fetch('/api/events/passive', {
      credentials: 'include'
    })

    if (response.ok) {
      const result = await response.json()
      pendingEvents.value = result.events || []
    }
  } catch (error) {
    console.error('加载待处理事件错误:', error)
  }
}

async function loadHistory() {
  try {
    const response = await fetch('/api/events/history', {
      credentials: 'include'
    })

    if (response.ok) {
      const result = await response.json()
      history.value = result.history || []
    }
  } catch (error) {
    console.error('加载历史错误:', error)
  }
}

function getCategoryLabel(category) {
  const labels = { normal: '普通', npc: 'NPC', friend: '好友' }
  return labels[category] || '普通'
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

function parseChanges(changesStr) {
  try {
    return JSON.parse(changesStr)
  } catch {
    return {}
  }
}

async function restoreFullStatus() {
  try {
    const response = await fetch('/api/test-restore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })
    const data = await response.json()
    if (data.success) {
      userStore.user.attributes.energy = 100
      userStore.user.attributes.vitality = 100
      console.log('已恢复满状态！')
    } else {
      alert(data.error || '恢复失败')
    }
  } catch (error) {
    console.error('恢复失败:', error)
    alert('恢复失败，请稍后重试')
  }
}

onMounted(async () => {
  if (userStore.isLoggedIn) {
    await userStore.fetchProfile()
  }
  await Promise.all([
    loadPendingCount(),
    loadPendingEvents(),
    loadHistory()
  ])
  isPageLoading.value = false
  startCountdownTimer()
})

onUnmounted(() => {
  stopCountdownTimer()
})
</script>

<style scoped>
.events-page {
  display: flex;
  flex-direction: column;
  height: 100%;
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

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 24px 8px 24px;
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

.placeholder {
  width: 40px;
}

.content-area {
  flex: 1;
  padding: 0 24px 24px;
  overflow-y: auto;
}

/* 骨架屏 */
.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-card {
  background: linear-gradient(90deg, #e8e8e8 25%, #d8d8d8 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 2.25s infinite;
  border-radius: 4px;
}

.skeleton-trigger {
  height: 80px;
}

.skeleton-attr-bar {
  display: flex;
  gap: 24px;
}

.skeleton-attr-item {
  flex: 1;
  height: 20px;
  background: linear-gradient(90deg, #e8e8e8 25%, #d8d8d8 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 2.25s infinite;
  border-radius: 4px;
}

.skeleton-history {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-history-item {
  height: 100px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 测试按钮 */
.test-section {
  margin-bottom: 16px;
}

.test-btn {
  width: 100%;
  padding: 8px;
  background: #f0f0f0;
  border: 1px dashed #999;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
}

.test-btn:active {
  background: #e0e0e0;
}

/* 属性条（固定） */
.attr-bar-fixed {
  background: #fff;
  padding: 4px;
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
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
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}

.attr-bar {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.attr-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.attr-fill.energy {
  background: linear-gradient(90deg, #7a9a6d, #8fa87a);
}

.attr-fill.vitality {
  background: linear-gradient(90deg, #c48a4a, #d4a85a);
}

.attr-value {
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
  min-width: 24px;
  text-align: right;
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}

.trigger-section {
  text-align: center;
  margin-bottom: 32px;
}

.trigger-btn {
  width: 100%;
  padding: 24px;
  background: #fff;
  color: #1a1a1a;
  border: 2.5px solid #000;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: transform 0.1s ease;
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}

.trigger-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
}

.trigger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.trigger-icon {
  font-size: 32px;
}

.trigger-text {
  font-size: 14px;
  font-weight: bold;
}

.trigger-tip {
  margin-top: 12px;
  font-size: 12px;
  opacity: 0.5;
}

.pending-toggle {
  background: #fff;
  padding: 12px 16px;
  margin-bottom: 16px;
  border: 2px solid #000;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pending-toggle-icon {
  font-size: 18px;
}

.pending-toggle-text {
  font-size: 14px;
  font-weight: bold;
}

.pending-events-panel {
  background: #fff;
  padding: 16px;
  margin-bottom: 24px;
  border: 2px solid #000;
  border-radius: 4px;
}

.panel-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
}

.pending-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pending-item {
  padding: 12px;
  border: 2px solid #000;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.1s ease;
  background: #fff;
}

.pending-item:active {
  transform: translate(2px, 2px);
}

.pending-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.pending-badge {
  font-size: 10px;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 2px;
}

.pending-countdown {
  font-size: 10px;
  color: #666;
}

.pending-countdown.expiring-soon {
  color: #c62828;
  font-weight: bold;
}

.pending-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.pending-desc {
  font-size: 12px;
  opacity: 0.7;
}

.event-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.event-card {
  background: #fff;
  padding: 24px;
  max-width: 320px;
  width: 90%;
  text-align: center;
}

.event-header {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.event-badge {
  display: inline-block;
  background: #000;
  color: #fff;
  padding: 4px 12px;
  border-radius: 2px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.encounter-badge {
  display: inline-block;
  background: #d4a85a;
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid #000;
  font-size: 10px;
}

.encounter-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border: 2px solid #000;
  border-radius: 4px;
  margin-bottom: 16px;
}

.encounter-avatar {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  object-fit: cover;
  border: 2px solid #000;
}

.encounter-details {
  text-align: left;
}

.encounter-name {
  font-size: 14px;
  font-weight: bold;
  margin: 0;
}

.encounter-title {
  font-size: 12px;
  opacity: 0.7;
  margin: 2px 0;
}

.encounter-fav {
  font-size: 12px;
  color: #4caf50;
  margin: 2px 0;
}

.event-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
}

.event-description {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 20px;
  color: #333;
}

.event-choices {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.choices-hint {
  font-size: 12px;
  opacity: 0.6;
  margin-bottom: 8px;
}

.choice-btn {
  width: 100%;
  padding: 12px;
  border: 2px solid #000;
  border-radius: 4px;
  background: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.choice-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
  background: #f0f0f0;
}

.choice-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.disabled-reason {
  font-size: 11px;
  color: #c62828;
}

.skip-btn {
  width: 100%;
  padding: 10px;
  border: 2px dashed #999;
  border-radius: 4px;
  background: #f9f9f9;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  margin-top: 8px;
  transition: transform 0.1s ease;
}

.skip-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
  background: #eee;
}

.skip-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.event-result {
  padding-top: 16px;
  border-top: 2px solid #000;
}

.result-text {
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.5;
}

.result-changes {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.change-tag {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid #000;
}

.change-tag.small {
  padding: 2px 6px;
  font-size: 10px;
}

.change-tag.positive {
  background: #f0f5e8;
  border-color: #7a9a6d;
  color: #2e7d32;
}

.change-tag.negative {
  background: #f5e8e8;
  border-color: #c48a8a;
  color: #c62828;
}

.confirm-btn {
  width: 100%;
}

.history-section {
  margin-top: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  padding: 12px;
  border: 2px solid #000;
  border-radius: 4px;
  background: #fff;
}

.history-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.history-type {
  font-size: 10px;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 2px;
}

.history-time {
  font-size: 10px;
  opacity: 0.5;
}

.history-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.history-choice {
  font-size: 12px;
  opacity: 0.7;
  margin-bottom: 4px;
}

.history-changes {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.empty-tip {
  text-align: center;
  opacity: 0.5;
  padding: 24px;
  font-size: 14px;
}

.btn-primary {
  background: #fff;
  color: #1a1a1a;
  border: 2px solid #000;
  padding: 12px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.1s ease;
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}

.btn-primary:active {
  transform: translate(2px, 2px);
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
