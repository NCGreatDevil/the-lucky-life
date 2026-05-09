<template>
  <div class="events-page">
    <div class="user-bar">
      <template v-if="userStore.isLoggedIn">
        <router-link to="/profile" class="user-link">
          <span class="user-icon">👤</span>
          <span class="user-name">{{ userStore.user?.nickname }}</span>
        </router-link>
        <span class="notification-bell" @click="showPendingEvents = !showPendingEvents">
          🔔
          <span v-if="pendingCount > 0" class="badge">{{ pendingCount }}</span>
        </span>
      </template>
    </div>

    <header class="header">
      <router-link to="/" class="back-btn">←</router-link>
      <h1 class="title sketch-font">随机事件</h1>
      <div class="placeholder"></div>
    </header>

    <div class="content-area">
      <div class="trigger-section">
        <button class="trigger-btn hand-drawn-border" @click="triggerActiveEvent" :disabled="isEventActive || isLoading">
          <span class="trigger-icon">⚡</span>
          <span class="trigger-text">{{ isEventActive ? '事件进行中...' : isLoading ? '加载中...' : '触发随机事件' }}</span>
        </button>
        <p class="trigger-tip">消耗10能量，可能触发各种事件</p>
      </div>

      <div v-if="showPendingEvents && pendingEvents.length > 0" class="pending-events-panel hand-drawn-border">
        <h3 class="panel-title">待处理事件</h3>
        <div class="pending-list">
          <div v-for="event in pendingEvents" :key="event.id" class="pending-item" @click="resolvePendingEvent(event)">
            <div class="pending-header">
              <span class="pending-badge">{{ event.category === 'npc' ? 'NPC' : event.category === 'friend' ? '好友' : '普通' }}</span>
              <span class="pending-time">{{ formatTime(event.generatedAt) }}</span>
            </div>
            <p class="pending-name">{{ event.name }}</p>
            <p class="pending-desc">{{ event.description }}</p>
          </div>
        </div>
      </div>

      <div v-if="isEventActive && currentEvent" class="event-modal modal-overlay" @click.self="closeEvent">
        <div class="event-card modal-content hand-drawn-border">
          <div class="event-header">
            <span class="event-badge">{{ getCategoryLabel(currentEvent.category) }}</span>
            <span v-if="currentEvent.encounter" class="encounter-badge">
              {{ currentEvent.encounter.type === 'npc' ? '🐾 NPC' : '👤 真人' }}
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
            <button
              v-for="option in currentEvent.options"
              :key="option.id"
              class="choice-btn"
              @click="makeChoice(option.id)"
              :disabled="isSubmitting"
            >
              {{ option.text }}
            </button>
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
            <button class="confirm-btn btn-primary" @click="confirmEvent">确定</button>
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoleStore } from '@/stores/role'
import { useUserStore } from '@/stores/user'

const roleStore = useRoleStore()
const userStore = useUserStore()

const isEventActive = ref(false)
const eventResolved = ref(false)
const currentEvent = ref(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const resultText = ref('')
const resultChanges = ref({})
const pendingCount = ref(0)
const pendingEvents = ref([])
const showPendingEvents = ref(false)
const history = ref([])

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
    eventResolved.value = false
    isEventActive.value = true

    if (result.currentEnergy !== undefined) {
      roleStore.updateAttribute('能量', result.currentEnergy - (roleStore.attributes.能量?.value || 80))
    }

    await loadPendingCount()
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
        passiveEventId: currentEvent.value?.id
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
    encounter: null
  }

  try {
    const response = await fetch(`/api/events/${event.eventId}/options`, {
      method: 'GET',
      credentials: 'include'
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || '获取选项失败')
      return
    }

    currentEvent.value.options = result.options
    eventResolved.value = false
    isEventActive.value = true
  } catch (error) {
    console.error('获取选项错误:', error)
    alert('获取选项失败')
  }
}

function confirmEvent() {
  isEventActive.value = false
  currentEvent.value = null
  resultText.value = ''
  resultChanges.value = {}
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

onMounted(() => {
  loadPendingCount()
  loadPendingEvents()
  loadHistory()
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
  color: #000;
  font-weight: bold;
}

.user-icon {
  font-size: 14px;
}

.notification-bell {
  font-size: 16px;
  position: relative;
  cursor: pointer;
}

.badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background: #f44336;
  color: #fff;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
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

.trigger-section {
  text-align: center;
  margin-bottom: 32px;
}

.trigger-btn {
  width: 100%;
  padding: 24px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: transform 0.1s ease;
}

.trigger-btn:active:not(:disabled) {
  transform: translate(4px, 4px);
}

.trigger-btn:disabled {
  opacity: 0.6;
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
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.pending-item:active {
  background: #f5f5f5;
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

.pending-time {
  font-size: 10px;
  opacity: 0.5;
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
  background: #ff9800;
  color: #fff;
  padding: 4px 12px;
  border-radius: 2px;
  font-size: 10px;
}

.encounter-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 16px;
}

.encounter-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
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

.event-result {
  padding-top: 16px;
  border-top: 1px solid #eee;
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
  background: #e8f5e9;
  border-color: #4caf50;
  color: #2e7d32;
}

.change-tag.negative {
  background: #ffebee;
  border-color: #f44336;
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
  border: 1px solid #e0e0e0;
  border-radius: 4px;
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
  background: #000;
  color: #fff;
  border: none;
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
