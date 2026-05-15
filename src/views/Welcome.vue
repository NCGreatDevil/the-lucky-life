<template>
  <div class="welcome-container">
    <div class="fortune-symbol">🍀</div>
    
    <h1 class="welcome-title">欢迎来到好运人生</h1>
    
    <div class="buttons-container">
      <wired-button class="btn btn-register" @click="goToRegister" style="width: 100%;">
        <span class="btn-text">注册</span>
      </wired-button>
      
      <wired-button class="btn btn-login" @click="goToLogin" style="width: 100%;">
        <span class="btn-text">登录</span>
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
.welcome-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  background: #E6EFFF;
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
  padding: 14px 32px;
  border: 2.5px solid #000;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.1s ease;
  font-weight: bold;
  font-size: 18px;
  position: relative;
}

.btn::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 1px solid #000;
  border-radius: 6px;
  pointer-events: none;
  opacity: 0.3;
}

.btn:active {
  transform: translate(2px, 2px);
}

.btn-register {
  background: #fff;
  color: #1a1a1a;
}

.btn-login {
  background: #1a1a1a;
  color: #fff;
}

.btn-text {
  position: relative;
  z-index: 1;
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}
</style>
