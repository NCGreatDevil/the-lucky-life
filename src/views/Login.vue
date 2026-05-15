<template>
  <div class="login-page">
    <wired-card class="login-container">
      <div class="login-header">
        <h1 class="sketch-font">登录</h1>
        <p class="subtitle">进入你的虚拟人生</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form" ref="loginFormRef">
        <div class="form-group">
          <label for="loginId" class="sketch-font">用户ID</label>
          <wired-input
            id="loginId"
            :value="loginId"
            @input="loginId = $event.target.value"
            placeholder="请输入你的用户ID"
            style="width: 100%;"
          ></wired-input>
        </div>

        <div class="form-group">
          <label for="password" class="sketch-font">密码</label>
          <wired-input
            id="password"
            type="password"
            :value="password"
            @input="password = $event.target.value"
            placeholder="请输入密码"
            style="width: 100%;"
          ></wired-input>
        </div>

        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <wired-button
          @click="handleLogin"
          :disabled="loading"
          style="width: 100%;"
        >
          {{ loading ? '登录中...' : '登录' }}
        </wired-button>
      </form>

      <div class="login-footer">
        <p class="sketch-font">还没有账号？<router-link to="/register" class="sketch-font">立即注册</router-link></p>
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
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #fafafa;
}

.login-container {
  width: 100%;
  max-width: 360px;
  background: #fff;
  padding: 32px 24px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  opacity: 0.6;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: bold;
}

.form-group input {
  padding: 12px;
  border: 2px solid #000;
  border-radius: 4px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: #666;
}

.error-message {
  color: #c62828;
  font-size: 14px;
  padding: 8px 12px;
  background: #f5e8e8;
  border: 1px solid #c48a8a;
  border-radius: 4px;
}

.btn-primary {
  padding: 14px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  background-color: #fff;
  color: #1a1a1a;
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}

.login-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
}

.login-footer a {
  color: #1a1a1a;
  font-weight: bold;
  text-decoration: underline;
}

.warning-box {
  margin-top: 24px;
  padding: 12px;
  background: #fafafa;
  border: 2px solid #000;
  border-radius: 4px;
}

.warning-title {
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 4px;
}

.warning-text {
  font-size: 11px;
  color: #1a1a1a;
  line-height: 1.5;
}
</style>
