<template>
  <div class="events-page">
    <!-- 顶部标题 -->
    <header class="header">
      <router-link to="/" class="back-btn">←</router-link>
      <h1 class="title sketch-font">随机事件</h1>
      <div class="placeholder"></div>
    </header>

    <!-- 事件触发区域 -->
    <div class="content-area">
      <!-- 触发按钮 -->
      <div class="trigger-section">
        <button class="trigger-btn hand-drawn-border" @click="triggerRandomEvent" :disabled="isEventActive">
          <span class="trigger-icon">⚡</span>
          <span class="trigger-text">{{ isEventActive ? '事件进行中...' : '触发随机事件' }}</span>
        </button>
        <p class="trigger-tip">可能触发各种有趣的事件哦</p>
      </div>

      <!-- 活跃事件弹窗 -->
      <div v-if="isEventActive && currentEvent" class="event-modal modal-overlay" @click.self="closeEvent">
        <div class="event-card modal-content hand-drawn-border">
          <div class="event-badge">{{ currentEvent.type }}</div>
          <h3 class="event-title">{{ currentEvent.title }}</h3>
          <p class="event-description">{{ currentEvent.description }}</p>

          <div class="event-choices" v-if="!eventResolved">
            <p class="choices-hint">请选择：</p>
            <button
              v-for="(choice, index) in currentEvent.choices"
              :key="index"
              class="choice-btn"
              @click="makeChoice(index)"
            >
              {{ choice.text }}
            </button>
          </div>

          <div class="event-result" v-if="eventResolved">
            <p class="result-text">{{ currentEvent.resultText }}</p>
            <div class="result-changes" v-if="currentEvent.changes">
              <span
                v-for="(value, attr) in currentEvent.changes"
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

      <!-- 事件历史 -->
      <div class="history-section">
        <h3 class="section-title">事件历史</h3>
        <div class="history-list" v-if="roleStore.eventHistory.length > 0">
          <div v-for="event in roleStore.eventHistory" :key="event.timestamp" class="history-item">
            <div class="history-header">
              <span class="history-type">{{ event.type }}</span>
              <span class="history-time">{{ formatTime(event.timestamp) }}</span>
            </div>
            <p class="history-title">{{ event.title }}</p>
            <p class="history-choice" v-if="event.choice">选择了：{{ event.choice }}</p>
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
import { ref } from 'vue'
import { useRoleStore } from '@/stores/role'

const roleStore = useRoleStore()

const isEventActive = ref(false)
const eventResolved = ref(false)
const currentEvent = ref(null)

// 随机事件库
const eventPool = [
  {
    type: '定时事件',
    title: '早起的惊喜',
    description: '今天起得特别早，发现楼下新开了一家早餐店，正在发传单...',
    choices: [
      { text: '接过传单看看', changes: { 体力: 10, 心情: 5 } },
      { text: '礼貌拒绝，径直离开', changes: { 体力: 5, 心情: -3 } }
    ],
    resultTexts: [
      '早餐店老板很热情，还送了小礼物！',
      '还是算了，不喜欢被打扰。'
    ]
  },
  {
    type: '定时事件',
    title: '午后的邂逅',
    description: '午后在咖啡店排队，前面的人似乎遇到了点麻烦...',
    choices: [
      { text: '主动帮忙', changes: { 桃花: 15, 心情: 8 } },
      { text: '静静观望', changes: { 心情: -2 } }
    ],
    resultTexts: [
      '对方很感激，你们交换了联系方式！',
      '最终还是店员帮忙解决了。'
    ]
  },
  {
    type: '不定时事件',
    title: '意外的邮件',
    description: '邮箱里躺着一封神秘的邮件，标题写着"恭喜你..."',
    choices: [
      { text: '好奇地点开', changes: { 心情: 10, 学识: 5 } },
      { text: '当作垃圾邮件删除', changes: { 心情: -3 } }
    ],
    resultTexts: [
      '原来是一封迟到的生日祝福，很暖心！',
      '删除后有点后悔，万一是什么呢...'
    ]
  },
  {
    type: '不定时事件',
    title: '路边的流浪猫',
    description: '回家的路上遇到一只脏兮兮的流浪猫，它眼巴巴地看着你...',
    choices: [
      { text: '去便利店买猫粮', changes: { 心情: 12, 财运: -5 } },
      { text: '蹲下来摸摸它', changes: { 心情: 5 } },
      { text: '直接走开', changes: { 心情: -5 } }
    ],
    resultTexts: [
      '猫咪吃得很开心，一直蹭你的腿',
      '猫咪很亲人，让你想起了什么',
      '走了几步还是回头看了一眼...'
    ]
  },
  {
    type: '定时事件',
    title: '工作的转折',
    description: '老板突然找你谈话，说有个重要项目想交给你负责...',
    choices: [
      { text: '欣然接受挑战', changes: { 事业: 20, 体力: -10, 心情: 8 } },
      { text: '谦虚表示需要学习', changes: { 事业: 8, 学识: 10, 心情: 5 } },
      { text: '婉拒，不想压力太大', changes: { 体力: 5, 心情: 5, 事业: -5 } }
    ],
    resultTexts: [
      '恭喜获得重要项目经验！',
      '老板觉得你很谦虚，印象不错！',
      '轻松自在，但错过了机会...'
    ]
  },
  {
    type: '不定时事件',
    title: '理财的诱惑',
    description: '朋友推荐一个"稳赚不赔"的投资项目，说收益很高...',
    choices: [
      { text: '深入了解一下', changes: { 财运: 25, 心情: -5 } },
      { text: '谨慎观望', changes: { 学识: 8 } },
      { text: '直接拒绝', changes: { 财运: -3, 心情: 5 } }
    ],
    resultTexts: [
      '投资有风险，你懂的...',
      '先学习一下投资知识再说',
      '朋友有点失望，但还是理解你'
    ]
  }
]

let currentChoiceIndex = 0

function triggerRandomEvent() {
  if (isEventActive.value) return

  const index = Math.floor(Math.random() * eventPool.length)
  currentEvent.value = { ...eventPool[index] }
  eventResolved.value = false
  isEventActive.value = true
  currentChoiceIndex = 0
}

function makeChoice(index) {
  currentChoiceIndex = index
  const choice = currentEvent.value.choices[index]

  for (const [attr, delta] of Object.entries(choice.changes)) {
    roleStore.updateAttribute(attr, delta)
  }

  currentEvent.value.changes = choice.changes
  currentEvent.value.resultText = currentEvent.value.resultTexts[index]

  roleStore.addEventRecord({
    type: currentEvent.value.type,
    title: currentEvent.value.title,
    choice: currentEvent.value.choices[index].text,
    changes: currentEvent.value.changes,
    timestamp: Date.now()
  })

  eventResolved.value = true
}

function confirmEvent() {
  isEventActive.value = false
  currentEvent.value = null
}

function closeEvent() {
  if (!eventResolved.value) {
    isEventActive.value = false
    currentEvent.value = null
  }
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.events-page {
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

.event-badge {
  display: inline-block;
  background: #000;
  color: #fff;
  padding: 4px 12px;
  border-radius: 2px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
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

.choice-btn:active {
  transform: translate(2px, 2px);
  background: #f0f0f0;
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
