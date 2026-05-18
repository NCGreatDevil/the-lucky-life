<template>
  <div class="app-container">
    <wired-card class="phone-frame">
      <div class="global-notification" v-if="pendingCount > 0 && !isOnEventsPage" @click="goToEvents">
        🔔 <span class="badge">{{ pendingCount }}</span>
      </div>
      <router-view />
    </wired-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const pendingCount = ref(0)
const checkTimer = ref(null)

const isOnEventsPage = computed(() => route.path === '/events')

async function loadPendingCount() {
  if (!userStore.isLoggedIn) return

  try {
    const response = await fetch('/api/events/pending-count', {
      credentials: 'include'
    })

    if (response.ok) {
      const result = await response.json()
      pendingCount.value = result.count || 0
    } else if (response.status === 401) {
      pendingCount.value = 0
    }
  } catch (error) {
    console.error('加载待处理数量错误:', error)
  }
}

function goToEvents() {
  router.push('/events')
}

onMounted(() => {
  loadPendingCount()
  checkTimer.value = setInterval(loadPendingCount, 60000)
  window.addEventListener('pending-count-change', (e) => {
    pendingCount.value = e.detail
  })
})

onUnmounted(() => {
  if (checkTimer.value) {
    clearInterval(checkTimer.value)
  }
  window.removeEventListener('pending-count-change', (e) => {
    pendingCount.value = e.detail
  })
})
</script>

<style scoped>
.app-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f3f4f6;
}

.phone-frame {
  width: 375px;
  /* height: 812px; */
  background-color: #ffffff;
  position: relative;
  box-shadow: 10px 10px 0px 0px rgba(0, 0, 0, 1);
  overflow: visible;
}

@media (max-width: 768px) {
  .app-container {
    background-color: #ffffff;
    padding: 0;
    align-items: stretch;
  }

  .phone-frame {
    width: 100%;
    border-radius: 0;
    box-shadow: none;
    position: static;
  }
}

.global-notification {
  position: absolute;
  top: 8px;
  right: 16px;
  font-size: 16px;
  cursor: pointer;
  z-index: 100;
}

.badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background: #c62828;
  color: #fff;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 4px;
  border: 1px solid #000;
  min-width: 16px;
  text-align: center;
}
</style>
