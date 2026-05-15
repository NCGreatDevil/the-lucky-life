<template>
  <div class="fortune-page">
    <div class="user-bar">
      <template v-if="userStore.isLoggedIn">
        <router-link to="/profile" class="user-link">
          <span class="user-icon">👤</span>
          <span class="user-name">{{ userStore.user?.nickname }}</span>
        </router-link>
        <span class="notification-bell">🔔</span>
      </template>
    </div>

    <header class="header">
      <router-link to="/" class="back-btn">←</router-link>
      <h1 class="title sketch-font">祈祷</h1>
      <div class="placeholder"></div>
    </header>

    <div class="content-area">
      <div v-if="isLoading" class="skeleton-container">
        <div class="skeleton-card skeleton-faith"></div>
        <div class="skeleton-card skeleton-prayer"></div>
        <div class="skeleton-attr-bar">
          <div class="skeleton-attr-item"></div>
          <div class="skeleton-attr-item"></div>
        </div>
        <div class="skeleton-relations">
          <div class="skeleton-card skeleton-relation"></div>
          <div class="skeleton-card skeleton-relation"></div>
          <div class="skeleton-card skeleton-relation"></div>
        </div>
      </div>

      <template v-else>
      <!-- 信仰状态 -->
      <div class="faith-status" :class="{ 'has-faith': worshippingDeity }">
        <div class="faith-label" v-if="!worshippingDeity">当前信仰</div>
        <div class="faith-value">
          <template v-if="worshippingDeity">
            <span class="deity-name">{{ worshippingDeity.name }}</span>
            <span class="deity-level">LV{{ worshippingDeity.level }}</span>
          </template>
          <template v-else>
            <span class="no-faith">无</span>
          </template>
        </div>
      </div>


      <!-- 祈求按钮 -->
      <div class="prayer-section">
        <wired-button
          class="prayer-btn"
          :disabled="isPraying || vitality < 30"
          @click="startPrayer"
          style="width: 100%;"
        >
          <span class="btn-icon">🙏</span>
          <span class="btn-text">{{ vitality < 30 ? '活力不足' : '祈求好运' }}</span>
          <span class="btn-cost">消耗30活力</span>
        </wired-button>
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

      <!-- 神明关系列表 -->
      <div class="deity-relations" v-if="deityRelations.length > 0">
        <h3 class="relations-title">神明关系</h3>
        <div class="relations-list">
          <div
            v-for="relation in deityRelations"
            :key="relation.deityId"
            class="relation-card"
            :class="{ worshipping: relation.isWorshipping }"
          >
            <div class="relation-header">
              <span class="relation-name">{{ relation.deityName }}</span>
              <span v-if="relation.isWorshipping" class="worshipping-badge">供奉中</span>
              <span class="relation-level">LV{{ relation.level }}</span>
              
            </div>
            <div class="relation-progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: getProgressPercent(relation) + '%' }"
                ></div>
              </div>
              <span class="progress-text">{{ relation.favorability }} / {{ getNextLevelFavorability(relation.level) }}</span>
            </div>
            <div class="relation-actions" v-if="relation.level >= 1 && !relation.isWorshipping">
              <wired-button
                class="action-btn switch-btn"
                @click="showSwitchToConfirm(relation)"
              >
                更换
              </wired-button>
            </div>
            <div class="relation-actions" v-if="relation.isWorshipping">
              <wired-button
                class="action-btn abandon-btn"
                @click="showAbandonConfirm(relation)"
              >
                放弃
              </wired-button>
            </div>
          </div>
        </div>
      </div>
      </template>

      <!-- 祈求动画弹窗 -->
      <div v-if="isPraying" class="prayer-modal">
        <div class="prayer-scene">
          <!-- 背景光效 -->
          <div class="bg-glow"></div>

          <!-- 人物背影 -->
          <div class="figure-container">
            <div class="figure">
              <div class="figure-head"></div>
              <div class="figure-body"></div>
              <div class="figure-arms">
                <div class="arm left"></div>
                <div class="arm right"></div>
              </div>
            </div>
          </div>

          <!-- 神明形象（如果有） -->
          <div v-if="encounteredDeity" class="deity-appearance">
            <div class="deity-glow"></div>
            <div class="deity-text">{{ encounteredDeity.name }}</div>
          </div>

          <!-- 粒子效果 -->
          <div class="particles">
            <div v-for="i in 20" :key="i" class="particle" :style="getParticleStyle(i)"></div>
          </div>

          <!-- 祈求文字 -->
          <div class="prayer-text">正在祈求...</div>
        </div>
      </div>

      <!-- 祈求结果弹窗 -->
      <div v-if="showResult" class="result-modal" @click.self="closeResult">
        <div class="result-content">
          <h3 class="result-title">祈求完成</h3>

          <!-- 运气提升 -->
          <div class="result-item luck-result">
            <span class="result-icon">✨</span>
            <div class="result-info">
              <span class="result-label">运气</span>
              <span class="result-value" v-if="prayerResult.isMaxLuck">
                你的运气已经到达顶峰，必定事事顺利，好运连连
              </span>
              <span class="result-value" v-else-if="prayerResult.luckLevelUp">
                提升至 {{ prayerResult.newLuckLabel }}
              </span>
              <span class="result-value" v-else>
                获得提升
              </span>
            </div>
          </div>

          <!-- 属性提升 -->
          <div class="result-item" v-if="prayerResult.attributeGain">
            <span class="result-icon">️</span>
            <div class="result-info">
              <span class="result-label">{{ getAttributeName(prayerResult.attributeType) }}</span>
              <span class="result-value">+{{ prayerResult.attributeGain }}</span>
            </div>
          </div>

          <!-- 遇到神明 -->
          <div class="result-item" v-if="prayerResult.encounteredDeity">
            <span class="result-icon">🌟</span>
            <div class="result-info">
              <span class="result-label">偶遇神明</span>
              <span class="result-value">{{ prayerResult.encounteredDeity.name }}</span>
            </div>
          </div>

          <!-- 好感度提升 -->
          <div class="result-item" v-if="prayerResult.favorabilityResult">
            <span class="result-icon">💕</span>
            <div class="result-info">
              <span class="result-label">{{ prayerResult.favorabilityResult.deityName }} 好感</span>
              <span class="result-value">
                +{{ prayerResult.favorabilityResult.favorabilityGain }}
                <span v-if="prayerResult.favorabilityResult.isFirstEncounter">（首次相遇，好感翻倍！）</span>
                <span v-if="prayerResult.favorabilityResult.levelUp">
                  (升至LV{{ prayerResult.favorabilityResult.newLevel }})
                </span>
              </span>
            </div>
          </div>

          <!-- 供奉邀请 -->
          <div v-if="prayerResult.favorabilityResult && prayerResult.favorabilityResult.levelUp && prayerResult.favorabilityResult.newLevel === 1" class="worship-invitation">
            <p class="invitation-text">{{ prayerResult.favorabilityResult.deityName }} 向你发出供奉邀请</p>
            <div class="invitation-actions">
              <wired-button class="invite-btn accept" @click="acceptWorship(prayerResult.favorabilityResult.deityId)">接受</wired-button>
              <wired-button class="invite-btn reject" @click="rejectWorship(prayerResult.favorabilityResult.deityId)">拒绝</wired-button>
            </div>
          </div>

          <wired-button class="close-result-btn" @click="closeResult" style="width: 100%;">确定</wired-button>
        </div>
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

// 获取属性中文名
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

// 获取进度百分比
function getProgressPercent(relation) {
  const nextLevel = getNextLevelFavorability(relation.level)
  return Math.min(100, (relation.favorability / nextLevel) * 100)
}

// 获取下一级需要的好感度
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

// 获取粒子样式
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

// 加载神明信息
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

// 开始祈求
async function startPrayer() {
  if (isPraying.value || vitality.value < 30) return

  isPraying.value = true
  encounteredDeity.value = null

  // 随机祈求时间 2-5秒
  const prayerDuration = 2000 + Math.random() * 3000

  try {
    const response = await fetch('/api/prayer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    // 等待动画完成
    await new Promise(resolve => setTimeout(resolve, prayerDuration))

    if (data.success) {
      prayerResult.value = data
      encounteredDeity.value = data.encounteredDeity
      showResult.value = true

      // 更新用户属性
      userStore.user.attributes.vitality = data.newVitality
      userStore.user.attributes.luck = data.newLuck
      sessionStorage.setItem('user_data', JSON.stringify(userStore.user))

      // 重新加载神明信息
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

// 关闭结果
function closeResult() {
  showResult.value = false
  prayerResult.value = null
  encounteredDeity.value = null
}

// 恢复满状态（测试用）
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

// 显示供奉确认
function showWorshipConfirm(relation) {
  if (confirm(`是否供奉${relation.deityName}？`)) {
    acceptWorship(relation.deityId)
  }
}

// 接受供奉
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

// 拒绝供奉
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

// 显示更换到该神明的确认
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

// 显示更换神明确认（针对当前供奉的神明，点击更换按钮时）
function showSwitchConfirm(relation) {
  const availableDeities = deityRelations.value.filter(r => r.level >= 1 && !r.isWorshipping)
  if (availableDeities.length === 0) {
    alert('没有其他可供奉的神明')
    return
  }
  
  // 简单处理：让用户选择第一个可用的神明
  const targetDeity = availableDeities[0]
  if (confirm(`是否更换供奉为${targetDeity.deityName}？更换后将扣除当前供奉神明对应属性值的10%-40%。`)) {
    switchDeity(targetDeity.deityId)
  }
}

// 更换神明
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

// 显示放弃供奉确认
function showAbandonConfirm(relation) {
  if (confirm(`是否放弃供奉${relation.deityName}？\n\n代价：\n1. 扣除该神明对应属性值的25%\n2. 对该神明的好感度降至99（LV0）`)) {
    abandonWorship(relation.deityId)
  }
}

// 放弃供奉
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
.fortune-page {
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

.notification-bell {
  font-size: 16px;
  position: relative;
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
  padding: 0 16px 24px;
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

.skeleton-faith {
  height: 60px;
}

.skeleton-prayer {
  height: 100px;
}

.skeleton-attr-bar {
  display: flex;
  gap: 24px;
}

.skeleton-attr-item {
  flex: 1;
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-relations {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-relation {
  height: 80px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 属性条（固定） */
.attr-bar-fixed {
  background: #fff;
  padding: 4px;
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

/* 信仰状态 */
.faith-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fafafa;
  border: 2px solid #000;
  border-radius: 4px;
  margin-bottom: 24px;
}

.faith-status.has-faith {
  justify-content: center;
  background: #f0f0f0;
  border-color: #000;
}

.faith-label {
  font-size: 14px;
  font-weight: bold;
}

.faith-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.deity-name {
  font-size: 16px;
  font-weight: bold;
}

.deity-level {
  font-size: 12px;
  padding: 2px 8px;
  background: #d4a85a;
  color: #fff;
  border-radius: 4px;
  border: 1px solid #000;
}

.no-faith {
  font-size: 14px;
  opacity: 0.5;
}

/* 祈求按钮 */
.prayer-section {
  margin-bottom: 32px;
}

.prayer-btn {
  width: 100%;
  padding: 16px 32px;
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

.prayer-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
}

.prayer-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 32px;
}

.btn-text {
  font-size: 18px;
  font-weight: bold;
}

.btn-cost {
  font-size: 12px;
  opacity: 0.8;
}

/* 测试按钮 */
.test-section {
  margin-top: 16px;
  margin-bottom: 32px;
}

.test-btn {
  width: 100%;
  padding: 12px;
  background: #fff;
  color: #1a1a1a;
  border: 2px solid #000;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: transform 0.1s ease;
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}

.test-btn:active {
  transform: translate(2px, 2px);
}

/* 神明关系 */
.deity-relations {
  margin-top: 24px;
}

.relations-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
}

.relations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.relation-card {
  padding: 16px;
  background: #fafafa;
  border: 2.5px solid #000;
  border-radius: 4px;
}

.relation-card.worshipping {
  background: #f0f0f0;
  border-color: #666;
}

.relation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.relation-name {
  font-size: 16px;
  font-weight: bold;
}

.relation-level {
  font-size: 12px;
  padding: 2px 8px;
  background: #1a1a1a;
  color: #fff;
  border-radius: 4px;
  border: 1px solid #000;
  margin-left: auto;
}

.worshipping-badge {
  font-size: 12px;
  padding: 2px 8px;
  background: #7a9a6d;
  color: #fff;
  border-radius: 4px;
  border: 1px solid #000;
  font-weight: bold;
  margin-left: 16px;
}

.relation-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8a9bb5, #9a85a8);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  opacity: 0.6;
  white-space: nowrap;
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}

.relation-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: bold;
  border: 2px solid #000;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
  color: #1a1a1a;
  transition: transform 0.1s ease;
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}

.action-btn:active {
  transform: translate(2px, 2px);
}

.worship-btn {
  background: #fff;
  color: #1a1a1a;
  border-color: #1a1a1a;
}

.switch-btn {
  background: #fff;
  color: #1a1a1a;
  border-color: #1a1a1a;
}

.abandon-btn {
  background: #fff;
  color: #1a1a1a;
  border-color: #1a1a1a;
  margin-left: 8px;
}

/* 祈求动画 */
.prayer-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.prayer-scene {
  width: 70%;
  height: 70%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 背景光效 */
.bg-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%);
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

/* 人物背影 */
.figure-container {
  position: relative;
  z-index: 10;
}

.figure {
  position: relative;
  width: 120px;
  height: 200px;
}

.figure-head {
  width: 50px;
  height: 50px;
  background: #fff;
  border-radius: 50%;
  margin: 0 auto 10px;
  animation: headBob 3s ease-in-out infinite;
}

@keyframes headBob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.figure-body {
  width: 80px;
  height: 100px;
  background: #fff;
  border-radius: 40px 40px 0 0;
  margin: 0 auto;
}

.figure-arms {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  display: flex;
  justify-content: space-between;
}

.arm {
  width: 20px;
  height: 80px;
  background: #fff;
  border-radius: 10px;
}

.arm.left {
  transform: rotate(-20deg);
  animation: armRaise 2s ease-in-out infinite;
}

.arm.right {
  transform: rotate(20deg);
  animation: armRaise 2s ease-in-out infinite reverse;
}

@keyframes armRaise {
  0%, 100% { transform: rotate(-20deg); }
  50% { transform: rotate(-30deg); }
}

/* 神明形象 */
.deity-appearance {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 5;
}

.deity-glow {
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.6) 0%, transparent 70%);
  border-radius: 50%;
  animation: deityGlow 1.5s ease-in-out infinite;
  margin: 0 auto;
}

@keyframes deityGlow {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

.deity-text {
  font-size: 24px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  animation: textGlow 1.5s ease-in-out infinite;
}

@keyframes textGlow {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

/* 粒子效果 */
.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.particle {
  position: absolute;
  bottom: -10px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: particleRise linear infinite;
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

/* 祈求文字 */
.prayer-text {
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  animation: textFade 2s ease-in-out infinite;
}

@keyframes textFade {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* 结果弹窗 */
.result-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.result-content {
  background: #fff;
  border: 2.5px solid #000;
  border-radius: 4px;
  padding: 24px;
  max-width: 360px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.result-title {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border: 2px solid #000;
  border-radius: 4px;
  margin-bottom: 12px;
}

.result-icon {
  font-size: 24px;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-label {
  font-size: 12px;
  opacity: 0.6;
}

.result-value {
  font-size: 16px;
  font-weight: bold;
}

.luck-result {
  background: #f0f0f0;
}

/* 供奉邀请 */
.worship-invitation {
  margin-top: 20px;
  padding: 16px;
  background: #fafafa;
  border: 2px solid #000;
  border-radius: 4px;
  text-align: center;
}

.invitation-text {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
}

.invitation-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.invite-btn {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: bold;
  border: 2px solid #000;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.1s ease;
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}

.invite-btn:active {
  transform: translate(2px, 2px);
}

.invite-btn.accept {
  background: #1a1a1a;
  color: #fff;
}

.invite-btn.reject {
  background: #fff;
  color: #1a1a1a;
}

.close-result-btn {
  width: 100%;
  padding: 12px;
  background: #fff;
  color: #1a1a1a;
  border: 2px solid #000;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 16px;
  transition: transform 0.1s ease;
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}

.close-result-btn:active {
  transform: translate(2px, 2px);
}
</style>
