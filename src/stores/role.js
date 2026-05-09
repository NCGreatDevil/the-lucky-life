import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useRoleStore = defineStore('role', () => {
  const roleName = ref('好运萌新')
  const roleLevel = ref(1)
  const roleTitle = ref('好运萌新')

  const attributes = ref({
    能量: { value: 80, visible: true, unlocked: true },
    活力: { value: 60, visible: true, unlocked: true },
    道德: { value: 0, visible: false, unlocked: false },
    智力: { value: 0, visible: false, unlocked: false },
    体质: { value: 0, visible: false, unlocked: false },
    魅力: { value: 0, visible: false, unlocked: false },
    意志: { value: 0, visible: false, unlocked: false },
    情绪: { value: 0, visible: false, unlocked: false },
    人缘: { value: 0, visible: false, unlocked: false },
    金钱: { value: 0, visible: false, unlocked: false },
  })

  const luckLevel = ref(3)
  const luckLabel = ref('平常')

  const tags = ref([])

  const fortuneHistory = ref([])
  const hasDrawnToday = ref(false)
  const lastDrawDate = ref('')

  const eventHistory = ref([])

  const friends = ref([])

  const visibleAttributes = computed(() => {
    return Object.entries(attributes.value)
      .filter(([key, val]) => val.visible && val.unlocked)
      .reduce((acc, [key, val]) => {
        acc[key] = val.value
        return acc
      }, {})
  })

  function updateAttribute(name, delta) {
    if (!attributes.value[name]) {
      attributes.value[name] = { value: 0, visible: true, unlocked: true }
    } else {
      attributes.value[name].visible = true
      attributes.value[name].unlocked = true
    }
    attributes.value[name].value += delta

    if (name === '能量') {
      attributes.value[name].value = Math.max(0, Math.min(100, attributes.value[name].value))
    }
    if (name === '活力') {
      attributes.value[name].value = Math.max(0, Math.min(100, attributes.value[name].value))
    }
    if (name === '金钱') {
      attributes.value[name].value = Math.max(0, attributes.value[name].value)
    }

    checkTagUnlock(name)
  }

  function checkTagUnlock(attrName) {
    const tagRules = {
      道德: [
        { threshold: 50, tag: '积德行善' },
        { threshold: 100, tag: '功德无量' },
      ],
      智力: [
        { threshold: 50, tag: '聪明伶俐' },
        { threshold: 100, tag: '学富五车' },
      ],
      体质: [
        { threshold: 50, tag: '身强体壮' },
        { threshold: 100, tag: '铜筋铁骨' },
      ],
      魅力: [
        { threshold: 50, tag: '人缘不错' },
        { threshold: 100, tag: '万人迷' },
      ],
      意志: [
        { threshold: 50, tag: '意志坚定' },
        { threshold: 100, tag: '坚如磐石' },
      ],
      情绪: [
        { threshold: 50, tag: '开心果' },
        { threshold: 100, tag: '乐天派' },
      ],
      人缘: [
        { threshold: 50, tag: '广结善缘' },
        { threshold: 100, tag: '八面玲珑' },
      ],
      金钱: [
        { threshold: 50, tag: '小财神' },
        { threshold: 100, tag: '财运亨通' },
      ],
      能量: [
        { threshold: 90, tag: '精力充沛' },
        { threshold: 30, tag: '需要休息' },
      ],
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

  function addEventRecord(event) {
    eventHistory.value.unshift({
      ...event,
      timestamp: Date.now()
    })
  }

  async function addFriend(friend) {
    if (!friends.value.find(f => f.id === friend.id)) {
      friends.value.push(friend)
      await syncFriendsToBackend()
    }
  }

  async function removeFriend(friendId) {
    friends.value = friends.value.filter(f => f.id !== friendId)
    await syncFriendsToBackend()
  }

  async function syncFriendsToBackend() {
    try {
      const response = await fetch('/api/role-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          friends: friends.value.map(f => ({
            id: f.isNpc ? f.npcId : f.id,
            isNpc: f.isNpc,
            createdAt: f.createdAt || new Date().toISOString()
          }))
        })
      })

      if (!response.ok) {
        console.error('同步好友数据失败')
      }
    } catch (error) {
      console.error('同步好友数据错误:', error)
    }
  }

  async function loadFriendsFromBackend() {
    try {
      const response = await fetch('/api/role-data', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data.friends) {
          friends.value = result.data.friends.map(f => ({
            id: f.id,
            npcId: f.is_npc ? f.friend_id : null,
            isNpc: Boolean(f.is_npc),
            name: '',
            avatar: '',
            level: 1,
            title: '',
            tags: [],
            createdAt: f.created_at
          }))
        }
      }
    } catch (error) {
      console.error('加载好友数据错误:', error)
    }
  }

  async function mergeNPCMetadata() {
    try {
      const response = await fetch('/api/npc-list', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data.npcs) {
          const npcMap = {}
          result.data.npcs.forEach(npc => {
            npcMap[npc.id] = npc
          })

          friends.value = friends.value.map(friend => {
            if (friend.isNpc && friend.npcId && npcMap[friend.npcId]) {
              const npc = npcMap[friend.npcId]
              return {
                ...friend,
                name: npc.name,
                avatar: npc.avatarUrl,
                title: npc.title,
                description: npc.description
              }
            }
            return friend
          })
        }
      }
    } catch (error) {
      console.error('合并 NPC 元数据错误:', error)
    }
  }

  function checkDailyReset() {
    const today = new Date().toISOString().split('T')[0]
    if (lastDrawDate.value !== today) {
      hasDrawnToday.value = false
    }
  }

  function calculateLevel() {
    const totalAttr = Object.values(attributes.value)
      .reduce((sum, attr) => sum + (attr.unlocked ? attr.value : 0), 0)
    return Math.floor(totalAttr / 100) + 1
  }

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
    luckLevel,
    luckLabel,
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
    loadFriendsFromBackend,
    mergeNPCMetadata,
    checkDailyReset,
    calculateLevel,
    initRole
  }
})
