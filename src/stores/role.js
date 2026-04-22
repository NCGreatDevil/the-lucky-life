import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useRoleStore = defineStore('role', () => {
  // 角色基础信息
  const roleName = ref('好运萌新')
  const roleLevel = ref(1)
  const roleTitle = ref('好运萌新')

  // 角色属性 - 根据需求文档，部分属性初始隐藏
  // 只有获得过的属性才会显示
  const attributes = ref({
   体力: { value: 80, visible: true, unlocked: true },
    心情: { value: 65, visible: true, unlocked: true },
    财运: { value: 0, visible: false, unlocked: false },
    桃花: { value: 0, visible: false, unlocked: false },
    事业: { value: 0, visible: false, unlocked: false },
    学识: { value: 0, visible: false, unlocked: false }
  })

  // 已解锁的标签
  const tags = ref([])

  // 抽签记录
  const fortuneHistory = ref([])

  // 今日是否已抽签
  const hasDrawnToday = ref(false)
  const lastDrawDate = ref('')

  // 事件记录
  const eventHistory = ref([])

  // 好友列表
  const friends = ref([])

  // 计算属性：获取可见的属性
  const visibleAttributes = computed(() => {
    return Object.entries(attributes.value)
      .filter(([key, val]) => val.visible && val.unlocked)
      .reduce((acc, [key, val]) => {
        acc[key] = val.value
        return acc
      }, {})
  })

  // 更新属性值，如果属性首次出现则解锁显示
  function updateAttribute(name, delta) {
    if (!attributes.value[name]) {
      // 属性首次出现，解锁并显示
      attributes.value[name] = { value: 0, visible: true, unlocked: true }
    } else {
      attributes.value[name].visible = true
      attributes.value[name].unlocked = true
    }
    attributes.value[name].value += delta

    // 检查是否达到解锁标签的条件
    checkTagUnlock(name)
  }

  // 检查并解锁标签
  function checkTagUnlock(attrName) {
    const tagRules = {
      财运: [
        { threshold: 50, tag: '小财神' },
        { threshold: 100, tag: '财运亨通' },
        { threshold: 200, tag: '富甲一方' }
      ],
      桃花: [
        { threshold: 50, tag: '人缘不错' },
        { threshold: 100, tag: '万人迷' },
        { threshold: 200, tag: '桃花泛滥' }
      ],
      事业: [
        { threshold: 50, tag: '职场新人' },
        { threshold: 100, tag: '事业有成' },
        { threshold: 200, tag: '行业精英' }
      ],
      学识: [
        { threshold: 50, tag: '好学宝宝' },
        { threshold: 100, tag: '学富五车' },
        { threshold: 200, tag: '博古通今' }
      ],
      体力: [
        { threshold: 90, tag: '精力充沛' },
        { threshold: 50, tag: '需要休息' }
      ],
      心情: [
        { threshold: 80, tag: '开心果' },
        { threshold: 50, tag: '情绪稳定' }
      ]
    }

    const rules = tagRules[attrName]
    if (!rules) return

    const currentValue = attributes.value[attrName]?.value || 0

    for (const rule of rules) {
      if (currentValue >= rule.threshold && !tags.value.includes(rule.tag)) {
        tags.value.push(rule.tag)
      }
    }
  }

  // 添加抽签记录
  function addFortuneRecord(result, changes) {
    const today = new Date().toISOString().split('T')[0]

    fortuneHistory.value.unshift({
      date: today,
      result,
      changes,
      timestamp: Date.now()
    })

    hasDrawnToday.value = true
    lastDrawDate.value = today
  }

  // 添加事件记录
  function addEventRecord(event) {
    eventHistory.value.unshift({
      ...event,
      timestamp: Date.now()
    })
  }

  // 添加好友
  function addFriend(friend) {
    if (!friends.value.find(f => f.id === friend.id)) {
      friends.value.push(friend)
    }
  }

  // 移除好友
  function removeFriend(friendId) {
    friends.value = friends.value.filter(f => f.id !== friendId)
  }

  // 检查每日重置
  function checkDailyReset() {
    const today = new Date().toISOString().split('T')[0]
    if (lastDrawDate.value !== today) {
      hasDrawnToday.value = false
    }
  }

  // 计算角色等级
  function calculateLevel() {
    const totalAttr = Object.values(attributes.value)
      .reduce((sum, attr) => sum + (attr.unlocked ? attr.value : 0), 0)
    return Math.floor(totalAttr / 100) + 1
  }

  // 初始化角色
  function initRole(name) {
    roleName.value = name || '好运萌新'
    roleLevel.value = 1
    roleTitle.value = '好运萌新'
    checkDailyReset()
  }

  return {
    roleName,
    roleLevel,
    roleTitle,
    attributes,
    tags,
    fortuneHistory,
    hasDrawnToday,
    eventHistory,
    friends,
    visibleAttributes,
    updateAttribute,
    addFortuneRecord,
    addEventRecord,
    addFriend,
    removeFriend,
    checkDailyReset,
    calculateLevel,
    initRole
  }
})
