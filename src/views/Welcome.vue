<template>
  <div class="flex flex-col items-center justify-center h-full p-5 bg-[#E6EFFF] text-[#333]">
    <div class="text-[80px] mb-5 animate-[float_3s_ease-in-out_infinite]">🍀</div>
    
    <h1 class="text-3xl font-bold mb-10 text-center">欢迎来到好运人生</h1>
    
    <div class="flex flex-col gap-4 w-full max-w-[280px]">
      <wired-button class="w-full py-3.5 cursor-pointer font-bold text-lg bg-white text-[#1a1a1a] sketch-font" @click="goToRegister">
        <span class="relative z-10">注册</span>
      </wired-button>
      
      <wired-button class="w-full py-3.5 cursor-pointer font-bold text-lg bg-[#1a1a1a] text-white sketch-font" @click="goToLogin">
        <span class="relative z-10">登录</span>
      </wired-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goToRegister() {
  router.push('/register')
}

function goToLogin() {
  router.push('/login')
}
</script>

<style scoped>
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
