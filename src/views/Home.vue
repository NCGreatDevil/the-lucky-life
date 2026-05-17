<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="flex justify-end items-center gap-3 px-4 py-2 text-xs">
      <template v-if="userStore.isLoggedIn">
        <router-link to="/profile" class="flex items-center gap-1 no-underline text-[#1a1a1a] font-bold">
          <span class="text-sm">👤</span>
          <span>{{ userStore.user?.nickname }}</span>
        </router-link>
        <span class="text-base relative">🔔</span>
      </template>
      <template v-else>
        <router-link to="/login" class="text-[#666] no-underline hover:underline">登录</router-link>
        <router-link to="/register" class="text-[#666] no-underline hover:underline">注册</router-link>
      </template>
    </div>

    <header class="px-6 pt-6 pb-4 text-center">
      <div class="inline-block relative">
        <h1 class="text-4xl font-bold tracking-[8px] relative z-10 sketch-font">好运人生</h1>
        <div class="absolute bottom-[-4px] left-[-8px] right-[-8px] h-3 bg-black/5 -rotate-1 z-0"></div>
        <svg class="absolute top-[-16px] right-[-24px] w-8 h-8" viewBox="0 0 100 100">
          <path d="M10,50 Q30,10 50,50 T90,50" fill="none" stroke="black" stroke-width="3"></path>
        </svg>
      </div>
      <p class="text-xs mt-2 opacity-60">{{ currentDate }} · {{ solarTerm }}</p>
    </header>

    <nav class="grid grid-cols-4 gap-1.5 px-4 mb-6">
      <router-link to="/fortune" class="no-underline text-inherit">
        <wired-card class="flex flex-col items-center justify-center w-full aspect-square p-1 text-center">
          <span class="text-2xl mb-1">🙏</span>
          <span class="text-[10px] font-bold">祈祷</span>
        </wired-card>
      </router-link>
      <router-link to="/events" class="no-underline text-inherit">
        <wired-card class="flex flex-col items-center justify-center w-full aspect-square p-1 text-center">
          <span class="text-2xl mb-1">⚡</span>
          <span class="text-[10px] font-bold">事件</span>
        </wired-card>
      </router-link>
      <router-link to="/friends" class="no-underline text-inherit">
        <wired-card class="flex flex-col items-center justify-center w-full aspect-square p-1 text-center">
          <span class="text-2xl mb-1">👥</span>
          <span class="text-[10px] font-bold">好友</span>
        </wired-card>
      </router-link>
      <router-link to="/map" class="no-underline text-inherit">
        <wired-card class="flex flex-col items-center justify-center w-full aspect-square p-1 text-center">
          <span class="text-2xl mb-1">🗺️</span>
          <span class="text-[10px] font-bold">地图</span>
        </wired-card>
      </router-link>
    </nav>

    <div class="flex-1 px-4 pb-4 overflow-y-auto">
      <wired-card class="flex flex-col items-center justify-center overflow-hidden p-4" fill="#fafafa">
        <div class="w-full h-full">
          <img :src="dailyFortuneImage" alt="今日运势" class="w-full h-full object-cover" />
        </div>
        <div class="mt-4 px-6 text-center">
          <wired-divider></wired-divider>
          <p class="text-sm italic font-medium">"{{ dailyQuote }}"</p>
        </div>
      </wired-card>

      <div class="bg-white mt-4 p-4 flex gap-6" v-if="userStore.isLoggedIn">
        <div class="flex items-center gap-2 flex-1">
          <span class="text-xs opacity-60 whitespace-nowrap">能量</span>
          <wired-progress class="flex-1" :value="userStore.user?.attributes?.energy || 80"></wired-progress>
          <span class="text-xs font-bold whitespace-nowrap min-w-[24px] text-right sketch-font">{{ userStore.user?.attributes?.energy || 80 }}</span>
        </div>
        <div class="flex items-center gap-2 flex-1">
          <span class="text-xs opacity-60 whitespace-nowrap">活力</span>
          <wired-progress class="flex-1" :value="userStore.user?.attributes?.vitality || 60"></wired-progress>
          <span class="text-xs font-bold whitespace-nowrap min-w-[24px] text-right sketch-font">{{ userStore.user?.attributes?.vitality || 60 }}</span>
        </div>
      </div>
    </div>

    <footer class="p-4 text-center">
      <p class="text-[10px] opacity-40">好运人生 · 凌晨五点工作室 © 2026</p>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(() => {
  if (userStore.isLoggedIn) {
    userStore.fetchProfile()
  }
})

const currentDate = computed(() => {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  return `${month}月${day}日`
})

const solarTerm = computed(() => {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()

  const terms = {
    '1-20': '大寒', '2-4': '立春', '2-19': '雨水', '3-5': '惊蛰',
    '3-20': '春分', '4-5': '清明', '4-20': '谷雨', '5-5': '立夏',
    '5-21': '小满', '6-6': '芒种', '6-21': '夏至', '7-7': '小暑',
    '7-23': '大暑', '8-7': '立秋', '8-23': '处暑', '9-7': '白露',
    '9-23': '秋分', '10-8': '寒露', '10-23': '霜降', '11-7': '立冬',
    '11-22': '小雪', '12-7': '大雪', '12-21': '冬至', '1-5': '小寒'
  }

  const key = `${month}-${day}`
  return terms[key] || '日常'
})

const dailyFortuneImage = computed(() => {
  return '/r2?path=home/sunny.png'
})

const dailyQuotes = [
  '今日宜：放下执念，顺其自然。',
  '宜保持微笑，微笑带来好运。',
  '今日适合尝试新事物。',
  '宜静心思考，沉淀自我。',
  '今日运势上扬，适合社交。'
]

const dailyQuote = computed(() => {
  const index = new Date().getDate() % dailyQuotes.length
  return dailyQuotes[index]
})
</script>

<style scoped>
</style>
