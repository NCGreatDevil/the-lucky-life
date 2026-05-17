<template>
  <div class="flex flex-col h-full">
    <div class="flex justify-end items-center gap-3 px-4 py-2 text-xs">
      <template v-if="userStore.isLoggedIn">
        <router-link to="/profile" class="flex items-center gap-1 no-underline text-[#1a1a1a] font-bold">
          <span class="text-sm">👤</span>
          <span>{{ userStore.user?.nickname }}</span>
        </router-link>
      </template>
    </div>

    <header class="flex justify-between items-center px-6 pt-0 pb-2">
      <router-link to="/" class="text-2xl no-underline text-inherit w-10">←</router-link>
      <h1 class="text-xl font-bold sketch-font">事件</h1>
      <div class="w-10"></div>
    </header>

    <div class="flex-1 px-6 pb-6 overflow-y-auto">
      <div v-if="isPageLoading" class="flex flex-col gap-4">
        <div class="skeleton-card h-20"></div>
        <div class="flex gap-6">
          <div class="flex-1 h-5 skeleton-card"></div>
          <div class="flex-1 h-5 skeleton-card"></div>
        </div>
        <div class="flex flex-col gap-3">
          <div class="skeleton-card h-24"></div>
          <div class="skeleton-card h-24"></div>
          <div class="skeleton-card h-24"></div>
        </div>
      </div>

      <template v-else>
      <div v-if="pendingCount > 0" class="flex items-center gap-2 p-3 mb-4 bg-[#fff9e6] border-2 border-[#e6c200] rounded cursor-pointer active:translate-x-0.5 active:translate-y-0.5" @click="showPendingEvents = !showPendingEvents">
        <span class="text-lg">📋</span>
        <span class="text-sm font-bold">待处理事件 ({{ pendingCount }})</span>
      </div>

      <div class="mb-4">
        <wired-button class="w-full py-3 bg-white text-[#1a1a1a] font-bold cursor-pointer flex items-center justify-center gap-2 sketch-font active:translate-x-0.5 active:translate-y-0.5" @click="triggerActiveEvent" :disabled="isEventActive || isLoading">
          <span class="text-xl">⚡</span>
          <span>{{ isEventActive ? '事件进行中...' : isLoading ? '加载中...' : '触发随机事件' }}</span>
        </wired-button>
        <p class="text-xs text-center mt-2 opacity-60">消耗10能量，可能触发各种事件</p>
      </div>
      
      <div class="mb-4" v-if="isAdmin">
        <button class="w-full py-2 bg-[#f0f0f0] border-2 border-black rounded text-sm cursor-pointer active:bg-[#e0e0e0]" @click="restoreFullStatus">
          恢复满状态（测试用）
        </button>
      </div>

      <div class="bg-white p-1 mb-4 flex gap-6" v-if="userStore.isLoggedIn">
        <div class="flex items-center gap-2 flex-1">
          <span class="text-xs opacity-60 whitespace-nowrap">能量</span>
          <wired-progress class="flex-1" :value="userStore.user?.attributes?.energy || 80"></wired-progress>
          <span class="text-xs font-bold whitespace-nowrap min-w-[24px] text-right">{{ userStore.user?.attributes?.energy || 80 }}</span>
        </div>
        <div class="flex items-center gap-2 flex-1">
          <span class="text-xs opacity-60 whitespace-nowrap">活力</span>
          <wired-progress class="flex-1" :value="userStore.user?.attributes?.vitality || 60"></wired-progress>
          <span class="text-xs font-bold whitespace-nowrap min-w-[24px] text-right">{{ userStore.user?.attributes?.vitality || 60 }}</span>
        </div>
      </div>

      <div v-if="showPendingEvents && pendingEvents.length > 0" class="mb-6">
        <h3 class="text-base font-bold mb-3">待处理事件</h3>
        <div class="flex flex-col gap-3">
          <wired-card v-for="event in pendingEvents" :key="event.id" class="p-4 cursor-pointer active:translate-x-0.5 active:translate-y-0.5" @click="resolvePendingEvent(event)" fill="#ffffff">
            <div class="flex justify-between items-center mb-2">
              <span class="px-2 py-0.5 bg-gray-200 border border-black rounded text-xs">{{ event.category === 'npc' ? 'NPC' : event.category === 'friend' ? '好友' : '普通' }}</span>
              <span class="text-xs" :class="isExpiringSoon(event.expiresAt) ? 'text-red-600 font-bold' : 'opacity-60'">
                {{ getCountdownText(event.expiresAt) }}
              </span>
            </div>
            <p class="text-sm font-bold mb-1">{{ event.name }}</p>
            <p class="text-xs opacity-70">{{ event.description }}</p>
          </wired-card>
        </div>
      </div>

      <div v-if="isEventActive && currentEvent" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4" @click.self="closeEvent">
        <wired-card class="max-w-[400px] w-full p-6" fill="#ffffff">
          <div class="mb-4">
            <span v-if="!currentEvent.encounter" class="px-2 py-0.5 bg-gray-200 border border-black rounded text-xs">{{ getCategoryLabel(currentEvent.category) }}</span>
            <span v-if="currentEvent.encounter" class="px-2 py-0.5 bg-[#fff9e6] border border-[#e6c200] rounded text-xs">
              {{ currentEvent.encounter.type === 'npc' ? ' NPC' : '👤 真人' }}
            </span>
          </div>

          <div v-if="currentEvent.encounter" class="flex gap-3 mb-4 p-3 bg-[#fafafa] border border-black rounded">
            <img v-if="currentEvent.encounter.npcAvatar" :src="currentEvent.encounter.npcAvatar" class="w-12 h-12 border-2 border-black rounded" />
            <div>
              <p class="text-sm font-bold">{{ currentEvent.encounter.npcName || currentEvent.encounter.nickname }}</p>
              <p v-if="currentEvent.encounter.npcTitle" class="text-xs opacity-70">{{ currentEvent.encounter.npcTitle }}</p>
              <p class="text-xs text-[#9a85a8]">好感度 +{{ currentEvent.encounter.favorabilityGained }} (总计 {{ currentEvent.encounter.totalFavorability }})</p>
            </div>
          </div>

          <h3 class="text-base font-bold mb-2">{{ currentEvent.name }}</h3>
          <p class="text-sm mb-4 leading-relaxed">{{ currentEvent.description }}</p>

          <div v-if="!eventResolved">
            <p class="text-xs font-bold mb-2 opacity-60">请选择：</p>
            <div class="flex flex-col gap-2 mb-3">
              <wired-button
                v-for="option in currentEvent.options"
                :key="option.id"
                class="w-full sketch-font"
                @click="makeChoice(option.id)"
                :disabled="isSubmitting || !isOptionAvailable(option)"
                :title="getOptionDisabledReason(option)"
              >
                {{ option.text }}
                <span v-if="!isOptionAvailable(option)" class="text-xs opacity-60">（{{ getOptionDisabledReason(option) }}）</span>
              </wired-button>
            </div>
            <wired-button
              v-if="allOptionsDisabled"
              class="w-full sketch-font bg-[#f0f0f0]"
              @click="skipEvent"
              :disabled="isSubmitting"
            >
              跳过此事件
            </wired-button>
          </div>

          <div v-if="eventResolved" class="mt-4">
            <p class="text-sm mb-3">{{ resultText }}</p>
            <div class="flex flex-wrap gap-2 mb-4" v-if="resultChanges && Object.keys(resultChanges).length > 0">
              <span
                v-for="(value, attr) in resultChanges"
                :key="attr"
                class="px-2 py-1 bg-gray-100 border border-black rounded text-xs"
                :class="value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : ''"
              >
                {{ attr }} {{ value > 0 ? '+' : '' }}{{ value }}
              </span>
            </div>
            <wired-button class="w-full sketch-font" @click="confirmEvent">确定</wired-button>
          </div>
        </wired-card>
      </div>

      <div>
        <h3 class="text-base font-bold mb-3">事件历史</h3>
        <div class="flex flex-col gap-3" v-if="history.length > 0">
          <wired-card v-for="item in history" :key="item.id" class="p-4" fill="#ffffff">
            <div class="flex justify-between items-center mb-2">
              <span class="px-2 py-0.5 bg-gray-200 border border-black rounded text-xs">{{ item.event_type === 'active' ? '主动' : '被动' }}</span>
              <span class="text-xs opacity-60">{{ formatTime(item.timestamp) }}</span>
            </div>
            <p class="text-sm font-bold mb-1">{{ item.event_title }}</p>
            <p class="text-xs opacity-70 mb-2">选择了：{{ item.choice }}</p>
            <div class="flex flex-wrap gap-1" v-if="item.changes">
              <span
                v-for="(value, attr) in parseChanges(item.changes)"
                :key="attr"
                class="px-2 py-0.5 bg-gray-100 border border-black rounded text-xs"
                :class="value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : ''"
              >
                {{ attr }} {{ value > 0 ? '+' : '' }}{{ value }}
              </span>
            </div>
          </wired-card>
        </div>
        <div v-else class="text-center opacity-50 py-8 text-sm">
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
</style>
