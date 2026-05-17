<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-[#fafafa]">
    <wired-card class="w-full max-w-[360px] bg-white p-8" fill="#ffffff">
      <div class="text-center mb-8">
        <h1 class="text-3xl mb-2 sketch-font">登录</h1>
        <p class="text-sm opacity-60">进入你的虚拟人生</p>
      </div>

      <form @submit.prevent="handleLogin" class="flex flex-col gap-5" ref="loginFormRef">
        <div class="flex flex-col gap-2">
          <label for="loginId" class="text-sm font-bold sketch-font">用户ID</label>
          <wired-input
            id="loginId"
            :value="loginId"
            @input="loginId = $event.target.value"
            placeholder="请输入你的用户ID"
            class="w-full"
          ></wired-input>
        </div>

        <div class="flex flex-col gap-2">
          <label for="password" class="text-sm font-bold sketch-font">密码</label>
          <wired-input
            id="password"
            type="password"
            :value="password"
            @input="password = $event.target.value"
            placeholder="请输入密码"
            class="w-full"
          ></wired-input>
        </div>

        <div v-if="errorMessage" class="text-sm text-[#c62828] p-2 bg-[#f5e8e8] border border-[#c48a8a] rounded">{{ errorMessage }}</div>

        <wired-button
          @click="handleLogin"
          :disabled="loading"
          class="w-full py-3.5 text-base font-bold bg-white text-[#1a1a1a] cursor-pointer sketch-font text-center"
        >
          {{ loading ? '登录中...' : '登录' }}
        </wired-button>
      </form>

      <div class="mt-6 text-center text-sm sketch-font">
        <p>还没有账号？<router-link to="/register" class="text-[#1a1a1a] font-bold underline sketch-font">立即注册</router-link></p>
      </div>
    </wired-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loginId = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  errorMessage.value = ''
  loading.value = true

  try {
    await userStore.login(loginId.value, password.value)
    router.push('/')
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
</style>
