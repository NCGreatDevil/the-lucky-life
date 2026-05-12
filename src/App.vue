<template>
  <div class="app-container">
    <div class="phone-frame">
      <div class="global-notification" v-if="pendingCount > 0" @click="goToEvents">
        🔔 <span class="badge">{{ pendingCount }}</span>
      </div>
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const pendingCount = ref(0)
const checkTimer = ref(null)

async function loadPendingCount() {
  try {
    const response = await fetch('/api/events/pending-count', {
      credentials: 'include'
    })

    if (response.ok) {
      const result = await response.json()
      pendingCount.value = result.count || 0
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
})

onUnmounted(() => {
  if (checkTimer.value) {
    clearInterval(checkTimer.value)
  }
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
  height: 812px;
  background-color: #ffffff;
  border: 2.5px solid #000;
  border-radius: 4px;
  position: relative;
  box-shadow: 10px 10px 0px 0px rgba(0, 0, 0, 1);
  overflow-y: auto;
}

.phone-frame::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  /* border: 1px solid #000; */
  border-radius: 6px;
  pointer-events: none;
  opacity: 0.3;
  z-index: 0;
}

@media (max-width: 768px) {
  .app-container {
    background-color: #ffffff;
    padding: 0;
    align-items: stretch;
  }

  .phone-frame {
    width: 100%;
    height: 100vh;
    border: none;
    border-radius: 0;
    box-shadow: none;
    position: static;
  }

  .phone-frame::before {
    display: none;
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
  background: #f44336;
  color: #fff;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}
</style>
