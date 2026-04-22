<template>
  <div class="role-page">
    <!-- 顶部标题 -->
    <header class="header">
      <router-link to="/" class="back-btn">←</router-link>
      <h1 class="title sketch-font">我的角色</h1>
      <div class="placeholder"></div>
    </header>

    <!-- 角色信息区域 -->
    <div class="content-area">
      <!-- 角色卡片 -->
      <div class="role-card hand-drawn-border">
        <div class="role-avatar">
          <span class="avatar-icon">{{ avatarEmoji }}</span>
        </div>
        <div class="role-info">
          <h2 class="role-name">{{ roleStore.roleName }}</h2>
          <div class="role-level">
            <span class="level-badge">Lv.{{ roleStore.roleLevel }}</span>
            <span class="level-title">{{ roleStore.roleTitle }}</span>
          </div>
        </div>
      </div>

      <!-- 属性列表 -->
      <div class="attributes-section">
        <h3 class="section-title">角色属性</h3>
        <div class="attributes-grid">
          <div
            v-for="(attr, name) in roleStore.attributes"
            :key="name"
            class="attribute-item hand-drawn-border"
            :class="{ visible: attr.visible && attr.unlocked, hidden: !attr.visible || !attr.unlocked }"
          >
            <div class="attr-header">
              <span class="attr-name">{{ name }}</span>
              <span class="attr-value" v-if="attr.visible && attr.unlocked">{{ attr.value }}</span>
              <span class="attr-locked" v-else>???</span>
            </div>
            <div class="attr-bar" v-if="attr.visible && attr.unlocked">
              <div class="attr-fill" :style="{ width: Math.min(100, attr.value) + '%' }"></div>
            </div>
            <div class="attr-bar locked" v-else>
              <div class="attr-fill"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 标签列表 -->
      <div class="tags-section" v-if="roleStore.tags.length > 0">
        <h3 class="section-title">已解锁标签</h3>
        <div class="tags-list">
          <span v-for="tag in roleStore.tags" :key="tag" class="tag-item">{{ tag }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <button class="btn-primary" @click="showEditName = true">修改昵称</button>
      </div>
    </div>

    <!-- 修改昵称弹窗 -->
    <div v-if="showEditName" class="modal-overlay" @click.self="showEditName = false">
      <div class="modal-content">
        <h3 class="modal-title">修改昵称</h3>
        <input
          v-model="newName"
          type="text"
          class="name-input"
          placeholder="输入新昵称"
          maxlength="10"
        />
        <div class="modal-actions">
          <button class="btn-secondary" @click="showEditName = false">取消</button>
          <button class="btn-primary" @click="saveName">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoleStore } from '@/stores/role'

const roleStore = useRoleStore()

const showEditName = ref(false)
const newName = ref('')

// 根据等级选择头像emoji
const avatarEmoji = computed(() => {
  const level = roleStore.roleLevel
  if (level < 5) return '🌱'
  if (level < 10) return '🌿'
  if (level < 20) return '🌳'
  return '🌲'
})

function saveName() {
  if (newName.value.trim()) {
    roleStore.roleName = newName.value.trim()
  }
  showEditName.value = false
  newName.value = ''
}
</script>

<style scoped>
.role-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 48px 24px 24px;
}

.back-btn {
  font-size: 24px;
  text-decoration: none;
  color: inherit;
  width: 40px;
}

.title {
  font-size: 24px;
  font-weight: bold;
}

.placeholder {
  width: 40px;
}

.content-area {
  flex: 1;
  padding: 0 24px 24px;
  overflow-y: auto;
}

.role-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fafafa;
  margin-bottom: 24px;
}

.role-avatar {
  width: 64px;
  height: 64px;
  border: 2px solid #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.avatar-icon {
  font-size: 32px;
}

.role-info {
  flex: 1;
}

.role-name {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 4px;
}

.role-level {
  display: flex;
  align-items: center;
  gap: 8px;
}

.level-badge {
  background: #000;
  color: #fff;
  padding: 2px 8px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: bold;
}

.level-title {
  font-size: 12px;
  opacity: 0.7;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.attributes-section {
  margin-bottom: 24px;
}

.attributes-grid {
  display: grid;
  gap: 12px;
}

.attribute-item {
  padding: 12px;
  background: #fff;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.attribute-item.hidden {
  opacity: 0.4;
}

.attr-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.attr-name {
  font-size: 12px;
  font-weight: 500;
}

.attr-value {
  font-size: 14px;
  font-weight: bold;
}

.attr-locked {
  font-size: 14px;
  color: #999;
}

.attr-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.attr-bar.locked {
  background: repeating-linear-gradient(
    45deg,
    #f0f0f0,
    #f0f0f0 4px,
    #e0e0e0 4px,
    #e0e0e0 8px
  );
}

.attr-fill {
  height: 100%;
  background: #000;
  transition: width 0.3s ease;
}

.tags-section {
  margin-bottom: 24px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  padding: 6px 12px;
  border: 2px solid #000;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: #fff;
}

.actions {
  display: flex;
  gap: 12px;
}

.btn-primary {
  flex: 1;
  background: #000;
  color: #fff;
  border: none;
  padding: 12px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.btn-primary:active {
  transform: translate(2px, 2px);
}

.btn-secondary {
  background: #fff;
  color: #000;
  border: 2px solid #000;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.btn-secondary:active {
  transform: translate(2px, 2px);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background: #fff;
  border: 2.5px solid #000;
  border-radius: 4px;
  padding: 20px;
  max-width: 300px;
  width: 90%;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  text-align: center;
}

.name-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #000;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 16px;
  outline: none;
}

.name-input:focus {
  box-shadow: 4px 4px 0 0 rgba(0, 0, 0, 0.2);
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.modal-actions .btn-primary,
.modal-actions .btn-secondary {
  flex: 1;
  text-align: center;
}
</style>
