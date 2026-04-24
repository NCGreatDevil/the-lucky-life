<template>
  <div class="welcome-container">
    <div class="fortune-symbol">🍀</div>
    
    <h1 class="welcome-title">欢迎来到好运人生</h1>
    
    <div class="buttons-container">
      <button class="btn btn-register" @click="goToRegister">
        <span class="btn-text">注册</span>
      </button>
      
      <button class="btn btn-login" @click="goToLogin">
        <span class="btn-text">登录</span>
      </button>
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
.welcome-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  background: #FFF8E1;
  color: #333;
}

.fortune-symbol {
  font-size: 80px;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.welcome-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 40px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  text-align: center;
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 280px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0,0,0,0.15);
}

.btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-register {
  background: #667eea;
  color: white;
  border: 2px solid #667eea;
}

.btn-register:hover {
  background: #5a6fd8;
}

.btn-login {
  background: white;
  color: #333;
  border: 2px solid #ddd;
}

.btn-login:hover {
  background: #f8f9fa;
}

.btn-text {
  position: relative;
  z-index: 1;
}
</style>
