<template>
  <div class="app-container">
    <!-- 模拟手机容器 -->
    <div class="phone-frame">
      <router-view />
    </div>
  </div>
</template>

<script setup>
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
  overflow: hidden;
}

.phone-frame::before {
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
  z-index: 0;
}
</style>
