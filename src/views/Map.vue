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
      <h1 class="text-xl font-bold sketch-font">地图</h1>
      <div class="w-10"></div>
    </header>

    <div class="flex-1 px-6 pb-6 overflow-y-auto">
      <div class="flex flex-col gap-4">
        <wired-card v-for="location in locations" :key="location.id" class="flex items-center gap-4 p-4 cursor-pointer active:translate-x-0.5 active:translate-y-0.5" fill="#ffffff" @click="showUnderConstruction">
          <div class="text-3xl w-12 h-12 flex items-center justify-center bg-[#fafafa] border-2 border-black rounded flex-shrink-0">{{ location.icon }}</div>
          <div class="flex-1">
            <h3 class="text-base font-bold m-0 mb-1">{{ location.name }}</h3>
            <p class="text-xs text-[#1a1a1a] m-0">{{ location.description }}</p>
          </div>
          <span class="text-[10px] px-2 py-1 bg-[#e0e0e0] text-[#1a1a1a] border border-black rounded flex-shrink-0">建设中</span>
        </wired-card>
      </div>
    </div>

    <div v-if="showTip" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" @click.self="showTip = false">
      <wired-card class="p-6 max-w-[300px] w-full text-center" fill="#ffffff">
        <p class="text-sm mb-5 leading-relaxed">该区域建设中，暂未开放</p>
        <wired-button class="w-full py-2.5 bg-white text-[#1a1a1a] font-bold cursor-pointer sketch-font" @click="showTip = false">知道了</wired-button>
      </wired-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const showTip = ref(false)

const locations = [
  { id: 1, name: '公园', icon: '🌳', description: '城市中心的休闲公园' },
  { id: 2, name: '步行街', icon: '🚶', description: '繁华的商业步行街' },
  { id: 3, name: '公司', icon: '🏢', description: '你的工作场所' },
  { id: 4, name: '购物中心', icon: '🛍️', description: '大型综合购物中心' },
  { id: 5, name: '图书馆', icon: '📚', description: '安静的知识殿堂' },
  { id: 6, name: '咖啡厅', icon: '☕', description: '休闲聚会的好去处' }
]

function showUnderConstruction() {
  showTip.value = true
}
</script>

<style scoped>
</style>
