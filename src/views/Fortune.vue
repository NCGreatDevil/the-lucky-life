<template>
  <div class="flex flex-col h-full">
    <div class="flex justify-end items-center gap-3 px-4 py-2 text-xs">
      <template v-if="userStore.isLoggedIn">
        <router-link to="/profile" class="flex items-center gap-1 no-underline text-[#1a1a1a] font-bold">
          <span class="text-sm">👤</span>
          <span>{{ userStore.user?.nickname }}</span>
        </router-link>
        <span class="text-base relative">🔔</span>
      </template>
    </div>

    <header class="flex justify-between items-center px-6 pt-0 pb-2">
      <router-link to="/" class="text-2xl no-underline text-inherit w-10">←</router-link>
      <h1 class="text-xl font-bold sketch-font">祈祷</h1>
      <div class="w-10"></div>
    </header>

    <div class="flex-1 px-6 pb-6 overflow-y-auto">
      <div v-if="isLoading" class="flex flex-col gap-4">
        <div class="skeleton-card h-[60px]"></div>
        <div class="skeleton-card h-[100px]"></div>
        <div class="flex gap-6">
          <div class="flex-1 h-5 skeleton-card"></div>
          <div class="flex-1 h-5 skeleton-card"></div>
        </div>
        <div class="flex flex-col gap-3">
          <div class="skeleton-card h-20"></div>
          <div class="skeleton-card h-20"></div>
          <div class="skeleton-card h-20"></div>
        </div>
      </div>

      <template v-else>
      <wired-card class="p-4 mb-6 bg-white" :class="{ 'justify-center': worshippingDeity }" fill="#ffffff">
        <div v-if="!worshippingDeity" class="text-sm font-bold">当前信仰</div>
        <div class="flex items-center gap-2">
          <template v-if="worshippingDeity">
            <span class="text-base font-bold">{{ worshippingDeity.name }}</span>
            <span class="text-xs px-2 py-0.5 bg-[#d4a85a] text-white rounded border border-black">LV{{ worshippingDeity.level }}</span>
          </template>
          <template v-else>
            <span class="text-sm opacity-50">无</span>
          </template>
        </div>
      </wired-card>

      <div class="mb-8">
        <wired-button class="w-full py-12 bg-white text-[#1a1a1a] cursor-pointer flex flex-col items-center gap-2 sketch-font" :disabled="isPraying || vitality < 30" @click="startPrayer">
          <span class="text-3xl">🙏</span>
          <span class="text-lg font-bold">{{ vitality < 30 ? '活力不足' : '祈求好运' }}</span>
          <span class="text-xs opacity-80">消耗30活力</span>
        </wired-button>
      </div>

      <div class="mt-4 mb-8" v-if="isAdmin">
        <button class="w-full py-3 bg-white text-[#1a1a1a] cursor-pointer text-sm font-bold sketch-font border-2 border-black rounded" @click="restoreFullStatus">
          恢复满状态（测试用）
        </button>
      </div>

      <div class="bg-white px-4 py-3 flex flex-row gap-3 items-center overflow-hidden" v-if="userStore.isLoggedIn">
        <div class="flex items-center gap-1.5 flex-1 min-w-0">
          <span class="text-xs opacity-60 whitespace-nowrap">能量</span>
          <wired-progress class="flex-1 min-w-0" :value="userStore.user?.attributes?.energy || 80" style="--wired-progress-color: #e74c3c;"></wired-progress>
        </div>
        <div class="flex items-center gap-1.5 flex-1 min-w-0">
          <span class="text-xs opacity-60 whitespace-nowrap">活力</span>
          <wired-progress class="flex-1 min-w-0" :value="userStore.user?.attributes?.vitality || 60" style="--wired-progress-color: #3498db;"></wired-progress>
        </div>
      </div>

      <div class="mt-6" v-if="deityRelations.length > 0">
        <h3 class="text-base font-bold mb-3">神明关系</h3>
        <div class="flex flex-col gap-3">
          <wired-card v-for="relation in deityRelations" :key="relation.deityId" class="p-4" :class="{ 'bg-[#e8f5e9]': relation.isWorshipping }" fill="#ffffff">
            <div class="flex justify-between items-center mb-3">
              <span class="text-base font-bold">{{ relation.deityName }}</span>
              <span v-if="relation.isWorshipping" class="text-xs px-2 py-0.5 bg-[#7a9a6d] text-white rounded border border-black font-bold ml-4">供奉中</span>
              <span class="text-xs px-2 py-0.5 bg-[#1a1a1a] text-white rounded border border-black ml-auto">LV{{ relation.level }}</span>
            </div>
            <div class="relative">
              <div class="w-full h-3 rounded overflow-hidden border border-black" style="background: rgb(200 200 200)">
                <div class="h-full transition-all duration-300" :style="{ width: getProgressPercent(relation) + '%', background: 'rgb(20 161 49)' }"></div>
              </div>
              <span class="absolute inset-0 flex items-center justify-center text-xs font-bold pointer-events-none">{{ relation.favorability }} / {{ getNextLevelFavorability(relation.level) }}</span>
            </div>
            <div class="mt-3 flex justify-end" v-if="relation.level >= 1 && !relation.isWorshipping">
              <wired-button class="px-4 py-2 text-xs font-bold bg-white text-[#1a1a1a] cursor-pointer sketch-font" @click="showSwitchToConfirm(relation)">更换</wired-button>
            </div>
            <div class="mt-3 flex justify-end" v-if="relation.isWorshipping">
              <wired-button class="px-4 py-2 text-xs font-bold bg-white text-[#1a1a1a] cursor-pointer sketch-font ml-2" @click="showAbandonConfirm(relation)">放弃</wired-button>
            </div>
          </wired-card>
        </div>
      </div>
      </template>

      <div v-if="isPraying" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]">
        <div class="w-[70%] h-[70%] relative flex items-center justify-center">
          <div class="absolute inset-0 bg-[radial-gradient(circle,rgba(102,126,234,0.3)_0%,transparent_70%)] animate-[glowPulse_2s_ease-in-out_infinite]"></div>

          <div class="relative z-10">
            <div class="relative w-[120px] h-[200px]">
              <div class="w-[50px] h-[50px] bg-white rounded-full mx-auto mb-2.5 animate-[headBob_3s_ease-in-out_infinite]"></div>
              <div class="w-[80px] h-[100px] bg-white rounded-t-[40px] mx-auto"></div>
              <div class="absolute top-[60px] left-1/2 -translate-x-1/2 w-[100px] flex justify-between">
                <div class="w-5 h-20 bg-white rounded-[10px] -rotate-[20deg] animate-[armRaise_2s_ease-in-out_infinite]"></div>
                <div class="w-5 h-20 bg-white rounded-[10px] rotate-[20deg] animate-[armRaise_2s_ease-in-out_infinite_reverse]"></div>
              </div>
            </div>
          </div>

          <div v-if="encounteredDeity" class="absolute top-[20%] left-1/2 -translate-x-1/2 text-center z-5">
            <div class="w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(255,215,0,0.6)_0%,transparent_70%)] rounded-full animate-[deityGlow_1.5s_ease-in-out_infinite] mx-auto"></div>
            <div class="text-2xl font-bold text-[#ffd700] animate-[textGlow_1.5s_ease-in-out_infinite]">{{ encounteredDeity.name }}</div>
          </div>

          <div class="absolute inset-0 overflow-hidden">
            <div v-for="i in 20" :key="i" class="absolute bottom-[-10px] bg-white/80 rounded-full animate-[particleRise_linear_infinite]" :style="getParticleStyle(i)"></div>
          </div>

          <div class="absolute bottom-[10%] left-1/2 -translate-x-1/2 text-lg text-white animate-[textFade_2s_ease-in-out_infinite]">正在祈求...</div>
        </div>
      </div>

      <div v-if="showResult" class="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-4" @click.self="closeResult">
        <wired-card class="p-6 max-w-[360px] w-full max-h-[80vh] overflow-y-auto" fill="#ffffff">
          <h3 class="text-xl font-bold text-center mb-5">祈求完成</h3>

          <div class="prayer-result-card">
            <div class="result-item" v-if="prayerResult.isMaxLuck || prayerResult.luckLevelUp || prayerResult.luckGain">
              <span class="result-label">运气</span>
              <span class="result-value" v-if="prayerResult.isMaxLuck">恭喜，你的运气已爆棚🎉</span>
              <span class="result-value" v-else>+{{ prayerResult.luckGain || prayerResult.newLuck - userStore.user?.attributes?.luck }}</span>
            </div>

            <div class="result-item" v-if="prayerResult.encounteredDeity">
              <span class="result-label">偶遇神明</span>
              <span class="result-value">{{ prayerResult.encounteredDeity.name }}</span>
            </div>

            <div class="result-item" v-if="prayerResult.attributeGain">
              <span class="result-label">{{ getAttributeName(prayerResult.attributeType) }}</span>
              <span class="result-value">+{{ prayerResult.attributeGain }}</span>
            </div>

            <div class="result-item" v-if="prayerResult.favorabilityResult">
              <span class="result-label">{{ prayerResult.favorabilityResult.deityName }}好感度</span>
              <span class="result-value">
                +{{ prayerResult.favorabilityResult.favorabilityGain }}
                <span v-if="prayerResult.favorabilityResult.levelUp" class="level-up-tag">升至LV{{ prayerResult.favorabilityResult.newLevel }}</span>
              </span>
            </div>
          </div>

          <wired-card v-if="prayerResult.favorabilityResult && prayerResult.favorabilityResult.levelUp && prayerResult.favorabilityResult.newLevel === 1" class="mt-5 p-4 text-center" fill="#fafafa">
            <p class="text-sm font-bold mb-3">{{ prayerResult.favorabilityResult.deityName }} 向你发出供奉邀请</p>
            <div class="flex gap-3 justify-center">
              <wired-button class="px-6 py-2.5 text-sm font-bold cursor-pointer bg-[#1a1a1a] text-white sketch-font" @click="acceptWorship(prayerResult.favorabilityResult.deityId)">接受</wired-button>
              <wired-button class="px-6 py-2.5 text-sm font-bold cursor-pointer bg-white text-[#1a1a1a] sketch-font" @click="rejectWorship(prayerResult.favorabilityResult.deityId)">拒绝</wired-button>
            </div>
          </wired-card>

          <wired-button class="w-full py-3 font-bold cursor-pointer mt-4 sketch-font text-center bg-white/50 rounded-[30px]" @click="closeResult">确定</wired-button>
        </wired-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const isAdmin = computed(() => userStore.user?.id === 'admin')
const vitality = computed(() => userStore.user?.attributes?.vitality || 0)
const worshippingDeity = ref(null)
const deityRelations = ref([])
const isLoading = ref(true)
const isPraying = ref(false)
const showResult = ref(false)
const prayerResult = ref(null)
const encounteredDeity = ref(null)

function getAttributeName(type) {
  const names = {
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
  return names[type] || type
}

function getProgressPercent(relation) {
  const nextLevel = getNextLevelFavorability(relation.level)
  return Math.min(100, (relation.favorability / nextLevel) * 100)
}

function getNextLevelFavorability(level) {
  const requirements = {
    0: 100,
    1: 300,
    2: 600,
    3: 1000,
    4: 1500,
    5: 2000
  }
  return requirements[level] || 2000
}

function getParticleStyle(index) {
  const delay = Math.random() * 3
  const duration = 2 + Math.random() * 2
  const left = Math.random() * 100
  const size = 2 + Math.random() * 4
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    width: `${size}px`,
    height: `${size}px`
  }
}

async function loadDeityInfo() {
  try {
    isLoading.value = true
    const response = await fetch('/api/deity-info', {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    if (data.success) {
      worshippingDeity.value = data.worshippingDeity
      deityRelations.value = (data.deityRelations || []).sort((a, b) => {
        if (b.favorability !== a.favorability) {
          return b.favorability - a.favorability
        }
        return (a.deityName || '').localeCompare(b.deityName || '', 'zh-CN')
      })
    }
  } catch (error) {
    console.error('加载神明信息失败:', error)
  } finally {
    isLoading.value = false
  }
}

async function startPrayer() {
  if (isPraying.value || vitality.value < 30) return

  isPraying.value = true
  encounteredDeity.value = null

  const prayerDuration = 2000 + Math.random() * 3000

  try {
    const response = await fetch('/api/prayer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    await new Promise(resolve => setTimeout(resolve, prayerDuration))

    if (data.success) {
      prayerResult.value = data
      encounteredDeity.value = data.encounteredDeity
      showResult.value = true

      userStore.user.attributes.vitality = data.newVitality
      userStore.user.attributes.luck = data.newLuck
      sessionStorage.setItem('user_data', JSON.stringify(userStore.user))

      await loadDeityInfo()
    } else {
      alert(data.error || '祈求失败')
    }
  } catch (error) {
    console.error('祈求失败:', error)
    alert('祈求失败，请稍后重试')
  } finally {
    isPraying.value = false
  }
}

function closeResult() {
  showResult.value = false
  prayerResult.value = null
  encounteredDeity.value = null
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

function showWorshipConfirm(relation) {
  if (confirm(`是否供奉${relation.deityName}？`)) {
    acceptWorship(relation.deityId)
  }
}

async function acceptWorship(deityId) {
  try {
    const response = await fetch('/api/deity-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deityId,
        action: 'accept'
      })
    })

    const data = await response.json()
    if (data.success) {
      alert(data.message)
      await loadDeityInfo()
    } else {
      alert(data.error)
    }
  } catch (error) {
    console.error('供奉失败:', error)
    alert('操作失败，请稍后重试')
  }
}

async function rejectWorship(deityId) {
  try {
    const response = await fetch('/api/deity-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deityId,
        action: 'reject'
      })
    })

    const data = await response.json()
    if (data.success) {
      alert(data.message)
      await loadDeityInfo()
    } else {
      alert(data.error)
    }
  } catch (error) {
    console.error('拒绝失败:', error)
    alert('操作失败，请稍后重试')
  }
}

function showSwitchToConfirm(relation) {
  const currentDeity = worshippingDeity.value
  if (!currentDeity) {
    alert('当前没有供奉的神明')
    return
  }
  
  if (confirm(`当前供奉的神明是【${currentDeity.name}】，是否要替换为【${relation.deityName}】？\n\n代价：\n1. 随机减少当前供奉神明对应属性值的10%-40%\n2. 对原神明的好感度降至99（LV0）`)) {
    switchDeity(relation.deityId)
  }
}

function showSwitchConfirm(relation) {
  const availableDeities = deityRelations.value.filter(r => r.level >= 1 && !r.isWorshipping)
  if (availableDeities.length === 0) {
    alert('没有其他可供奉的神明')
    return
  }
  
  const targetDeity = availableDeities[0]
  if (confirm(`是否更换供奉为${targetDeity.deityName}？更换后将扣除当前供奉神明对应属性值的10%-40%。`)) {
    switchDeity(targetDeity.deityId)
  }
}

async function switchDeity(deityId) {
  try {
    const response = await fetch('/api/deity-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deityId,
        action: 'switch'
      })
    })

    const data = await response.json()
    if (data.success) {
      let message = data.message
      if (data.attributeLoss) {
        message += `\n扣除${getAttributeName(data.attributeLoss.attributeType)}：${data.attributeLoss.loss}`
      }
      alert(message)
      await loadDeityInfo()
      await userStore.fetchProfile()
    } else {
      alert(data.error)
    }
  } catch (error) {
    console.error('更换失败:', error)
    alert('操作失败，请稍后重试')
  }
}

function showAbandonConfirm(relation) {
  if (confirm(`是否放弃供奉${relation.deityName}？\n\n代价：\n1. 扣除该神明对应属性值的25%\n2. 对该神明的好感度降至99（LV0）`)) {
    abandonWorship(relation.deityId)
  }
}

async function abandonWorship(deityId) {
  try {
    const response = await fetch('/api/deity-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deityId,
        action: 'abandon'
      })
    })

    const data = await response.json()
    if (data.success) {
      let message = data.message
      if (data.attributeLoss) {
        message += `\n扣除${getAttributeName(data.attributeLoss.attributeType)}：${data.attributeLoss.loss}`
      }
      alert(message)
      await loadDeityInfo()
      await userStore.fetchProfile()
    } else {
      alert(data.error)
    }
  } catch (error) {
    console.error('放弃供奉失败:', error)
    alert('操作失败，请稍后重试')
  }
}

onMounted(() => {
  loadDeityInfo()
})
</script>

<style scoped>
.skeleton-card {
  background: linear-gradient(90deg, #e8e8e8 25%, #d8d8d8 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 2.25s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

@keyframes headBob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes armRaise {
  0%, 100% { transform: rotate(-20deg); }
  50% { transform: rotate(-30deg); }
}

@keyframes deityGlow {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes textGlow {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

@keyframes particleRise {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) scale(0);
    opacity: 0;
  }
}

@keyframes textFade {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.prayer-result-card {
  background: #fafafa;
  border: 2px solid #1a1a1a;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px dashed #ccc;
}

.result-item:last-child {
  border-bottom: none;
}

.result-label {
  font-size: 14px;
  color: #666;
  font-weight: bold;
}

.result-value {
  font-size: 16px;
  font-weight: bold;
  color: #1a1a1a;
}

.level-up-tag {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: #d4a85a;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid #1a1a1a;
}
</style>
