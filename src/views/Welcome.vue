<template>
  <div class="welcome-container">
    <!-- 字符艺术 -->
    <div class="ascii-art">
      <pre>
  ______   ______   ______   ______   ______
 /\  __ \ /\  == \ /\  __ \ /\  ___\ /\  ___\
 \ \  __ \\ \  __< \ \  __ \ \ \  __\ \ \___  \
  \ \_\ \_\\ \_____\\ \_\ \_\\ \_____\\/\_____\
   \/_/\/_/ \/_____/ \/_/\/_/ \/_____/ \/_____/
                                            
  ______   ______   ______   ______   ______
 /\  __ \ /\  __ \ /\  __ \ /\  __ \ /\  __ \
 \ \  __ \\ \  __ \\ \  __ \\ \  __ \\ \  __ \
  \ \_\ \_\\ \_\ \_\\ \_\ \_\\ \_\ \_\\ \_\ \_\
   \/_/\/_/ \/_/\/_/ \/_/\/_/ \/_/\/_/ \/_/\/_/
      </pre>
    </div>
    
    <h1 class="welcome-title">FORTUNE LIFE</h1>
    
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.ascii-art {
  margin-bottom: 30px;
  font-family: 'Courier New', monospace;
  font-size: 8px;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  white-space: pre;
}

.welcome-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 40px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
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
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(10px);
  color: white;
  border: 2px solid rgba(255,255,255,0.3);
}

.btn-register:hover {
  background: rgba(255,255,255,0.3);
}

.btn-login {
  background: white;
  color: #667eea;
}

.btn-login:hover {
  background: #f8f9fa;
}

.btn-text {
  position: relative;
  z-index: 1;
}
</style>
