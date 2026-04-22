<template>
  <div class="fortune-page">
    <!-- 顶部标题 -->
    <header class="header">
      <router-link to="/" class="back-btn">←</router-link>
      <h1 class="title sketch-font">求神问卜</h1>
      <div class="placeholder"></div>
    </header>

    <!-- 抽签区域 -->
    <div class="content-area">
      <!-- 未抽签状态 -->
      <div v-if="!roleStore.hasDrawnToday" class="draw-section">
        <div class="draw-card hand-drawn-border" @click="drawFortune">
          <div class="card-inner">
            <div class="card-icon">🎴</div>
            <p class="card-hint">点击抽取今日运势</p>
          </div>
        </div>
        <p class="draw-tip">每日仅可抽取一次</p>
      </div>

      <!-- 已抽签状态 - 显示结果 -->
      <div v-else class="result-section">
        <div class="result-card hand-drawn-border">
          <div class="result-header">
            <span class="result-date">{{ todayDate }}</span>
            <span class="result-label">今日运势</span>
          </div>
          <div class="result-content">
            <p class="result-text">"{{ currentFortune?.result }}"</p>
          </div>
          <div class="result-changes" v-if="currentFortune?.changes">
            <p class="changes-title">属性变化：</p>
            <div class="changes-list">
              <span
                v-for="(change, attr) in currentFortune.changes"
                :key="attr"
                class="change-item"
                :class="{ positive: change > 0, negative: change < 0 }"
              >
                {{ attr }} {{ change > 0 ? '+' : '' }}{{ change }}
              </span>
            </div>
          </div>
        </div>

        <!-- 历史记录按钮 -->
        <button class="history-btn btn-secondary" @click="showHistory = true">
          查看历史记录
        </button>
      </div>

      <!-- 历史记录弹窗 -->
      <div v-if="showHistory" class="modal-overlay" @click.self="showHistory = false">
        <div class="modal-content">
          <h3 class="modal-title">抽签历史</h3>
          <div class="history-list">
            <div v-if="roleStore.fortuneHistory.length === 0" class="empty-tip">
              暂无历史记录
            </div>
            <div v-for="record in roleStore.fortuneHistory" :key="record.timestamp" class="history-item">
              <div class="history-date">{{ record.date }}</div>
              <div class="history-result">"{{ record.result }}"</div>
              <div class="history-changes" v-if="record.changes">
                <span v-for="(v, k) in record.changes" :key="k" class="change-tag">
                  {{ k }}{{ v > 0 ? '+' : '' }}{{ v }}
                </span>
              </div>
            </div>
          </div>
          <button class="close-btn" @click="showHistory = false">关闭</button>
        </div>
      </div>

      <!-- 免责提示 -->
      <div class="disclaimer">
        <p>本内容仅供趣味娱乐，不构成任何行为指导</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoleStore } from '@/stores/role'

const roleStore = useRoleStore()

const showHistory = ref(false)

// 今日日期
const todayDate = computed(() => {
  const now = new Date()
  return `${now.getMonth() + 1}月${now.getDate()}日`
})

// 运势文案库
const fortunePool = [
  { result: '今天适合主动出击，机会稍纵即逝', changes: { 事业: 5, 心情: 3 } },
  { result: '保持内心平静，好运即将降临', changes: { 心情: 8, 体力: -2 } },
  { result: '今天会遇到有趣的灵魂', changes: { 桃花: 10, 心情: 5 } },
  { result: '工作上会有小惊喜，期待一下吧', changes: { 事业: 8, 财运: 3 } },
  { result: '适合学习新知识，提升自己', changes: { 学识: 10, 体力: -3 } },
  { result: '财运不错，可以买点喜欢的东西', changes: { 财运: 15, 心情: 5 } },
  { result: '今天体力充沛，适合运动', changes: { 体力: 12, 心情: 3 } },
  { result: '社交运很好，约朋友聚聚吧', changes: { 桃花: 8, 心情: 6 } },
  { result: '工作有点累，记得适时休息', changes: { 体力: -10, 心情: -5 } },
  { result: '学习效率很高，继续保持', changes: { 学识: 12, 事业: 3 } },
  { result: '今天的你魅力四射', changes: { 桃花: 15, 心情: 8 } },
  { result: '财运平平，理性消费哦', changes: { 财运: -5, 体力: 5 } },
  { result: '有付出就有收获，继续加油', changes: { 事业: 10, 学识: 5 } },
  { result: '今天心情美美的', changes: { 心情: 15, 体力: 5 } },
  { result: '适合整理房间，清理负面能量', changes: { 心情: 10, 财运: -3 } }
]

// 当前抽签结果
const currentFortune = computed(() => {
  return roleStore.fortuneHistory[0] || null
})

// 执行抽签
function drawFortune() {
  // 随机选择一条运势
  const index = Math.floor(Math.random() * fortunePool.length)
  const fortune = fortunePool[index]

  // 应用属性变化
  for (const [attr, delta] of Object.entries(fortune.changes)) {
    roleStore.updateAttribute(attr, delta)
  }

  // 记录抽签结果
  roleStore.addFortuneRecord(fortune.result, fortune.changes)
}
</script>

<style scoped>
.fortune-page {
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
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
}

.draw-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.draw-card {
  width: 100%;
  aspect-ratio: 1;
  max-width: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.draw-card:active {
  transform: translate(4px, 4px);
}

.card-inner {
  text-align: center;
}

.card-icon {
  font-size: 80px;
  margin-bottom: 16px;
}

.card-hint {
  font-size: 14px;
  font-weight: 500;
}

.draw-tip {
  margin-top: 16px;
  font-size: 12px;
  opacity: 0.5;
}

.result-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.result-card {
  width: 100%;
  padding: 24px;
  background: #fafafa;
}

.result-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 12px;
  opacity: 0.6;
}

.result-content {
  margin-bottom: 20px;
}

.result-text {
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  line-height: 1.6;
}

.result-changes {
  border-top: 1px solid #000;
  padding-top: 16px;
}

.changes-title {
  font-size: 12px;
  margin-bottom: 8px;
}

.changes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.change-item {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid #000;
}

.change-item.positive {
  background: #e8f5e9;
  border-color: #4caf50;
  color: #2e7d32;
}

.change-item.negative {
  background: #ffebee;
  border-color: #f44336;
  color: #c62828;
}

.history-btn {
  margin-top: 24px;
  width: 100%;
  max-width: 280px;
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
  max-height: 70vh;
  overflow-y: auto;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  text-align: center;
}

.history-list {
  margin-bottom: 16px;
}

.empty-tip {
  text-align: center;
  opacity: 0.5;
  padding: 20px;
}

.history-item {
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.history-item:last-child {
  border-bottom: none;
}

.history-date {
  font-size: 10px;
  opacity: 0.5;
  margin-bottom: 4px;
}

.history-result {
  font-size: 14px;
  margin-bottom: 8px;
}

.history-changes {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.change-tag {
  font-size: 10px;
  padding: 2px 6px;
  background: #f5f5f5;
  border-radius: 2px;
}

.close-btn {
  width: 100%;
  padding: 10px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}

.disclaimer {
  padding: 16px;
  text-align: center;
}

.disclaimer p {
  font-size: 10px;
  opacity: 0.4;
}

.btn-secondary {
  background: #fff;
  color: #000;
  border: 2px solid #000;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.btn-secondary:active {
  transform: translate(2px, 2px);
}
</style>
