<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1 class="sketch-font">登录</h1>
        <p class="subtitle">进入你的虚拟人生</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="nickname">昵称</label>
          <input
            type="text"
            id="nickname"
            v-model="nickname"
            placeholder="请输入你的昵称"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            type="password"
            id="password"
            v-model="password"
            placeholder="请输入密码"
            required
          />
        </div>

        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="login-footer">
        <p>还没有账号？<router-link to="/register">立即注册</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const nickname = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  errorMessage.value = ''
  loading.value = true

  try {
    await userStore.login(nickname.value, password.value)
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
  border: 2.5px solid #000;
  border-radius: 8px;
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
  color: #d32f2f;
  font-size: 14px;
  padding: 8px 12px;
  background: #ffebee;
  border-radius: 4px;
}

.btn-primary {
  padding: 14px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.1s;
}

.btn-primary:active:not(:disabled) {
  transform: translate(2px, 2px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
}

.login-footer a {
  color: #000;
  font-weight: bold;
  text-decoration: underline;
}

.warning-box {
  margin-top: 24px;
  padding: 12px;
  background: #fff8e1;
  border: 1px solid #ffc107;
  border-radius: 4px;
}

.warning-title {
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 4px;
}

.warning-text {
  font-size: 11px;
  color: #666;
  line-height: 1.5;
}
</style>
