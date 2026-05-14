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
  background: #fff;
  color: #1a1a1a;
  border: 2px solid #000;
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}

.btn-register:hover {
  background: #f0f0f0;
}

.btn-login {
  background: #fff;
  color: #1a1a1a;
  border: 2px solid #000;
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}

.btn-login:hover {
  background: #f0f0f0;
}

.btn-text {
  position: relative;
  z-index: 1;
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}
</style>
