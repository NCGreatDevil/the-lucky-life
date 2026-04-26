<template>
  <div class="profile-page">
        <!-- 顶部标题 -->
    <header class="header">
      <router-link to="/" class="back-btn">←</router-link>
      <h1 class="title sketch-font">我的角色</h1>
      <div class="placeholder"></div>
      <button @click="handleLogout" class="btn-logout">退出</button>
    </header>
    <div class="profile-container">
      <!-- <div class="profile-header">
        <h1 class="sketch-font">我的角色</h1>
        <button @click="handleLogout" class="btn-logout">退出登录</button>
      </div> -->

      <div v-if="loading" class="loading">加载中...</div>

      <template v-else-if="user">
        <div class="user-card hand-drawn-border">
          <div class="user-id">ID: {{ user.id }}</div>
          <div class="user-nickname">{{ user.nickname }}</div>
          <div v-if="user.attributes" class="user-luck">
            <span class="luck-label">{{ user.attributes.luckLabel }}</span>
          </div>
        </div>

        <div class="info-section hand-drawn-border">
          <h2>基本信息</h2>

          <div v-if="!isEditing" class="info-list">
            <div class="info-item">
              <span class="label">出生日期</span>
              <span class="value">{{ user.birthday }}</span>
            </div>
            <div class="info-item">
              <span class="label">性别</span>
              <span class="value">{{ genderText }}</span>
            </div>
            <div class="info-item">
              <span class="label">职业</span>
              <span class="value">{{ user.occupation }}</span>
            </div>
            <div class="info-item">
              <span class="label">个人简介</span>
              <span class="value">{{ user.bio || '暂无' }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间</span>
              <span class="value">{{ formatDate(user.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="label">更新时间</span>
              <span class="value">{{ formatDate(user.updatedAt) }}</span>
            </div>
          </div>

          <form v-else @submit.prevent="handleUpdate" class="edit-form">
            <div class="form-group">
              <label>昵称</label>
              <input type="text" v-model="editForm.nickname" required />
            </div>

            <div class="form-group">
              <label>出生日期</label>
              <input type="date" v-model="editForm.birthday" required />
            </div>

            <div class="form-group">
              <label>性别</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="editForm.gender" value="male" />
                  <span>男</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="editForm.gender" value="female" />
                  <span>女</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="editForm.gender" value="other" />
                  <span>其他</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label>职业</label>
              <input type="text" v-model="editForm.occupation" required />
            </div>

            <div class="form-group">
              <label>个人简介</label>
              <textarea v-model="editForm.bio" rows="3" placeholder="简单介绍一下你的虚拟角色"></textarea>
            </div>

            <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

            <div class="btn-group">
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? '保存中...' : '保存' }}
              </button>
              <button type="button" @click="cancelEdit" class="btn-secondary">取消</button>
            </div>
          </form>

          <button v-if="!isEditing" @click="startEdit" class="btn-edit">编辑资料</button>
        </div>

        <div class="attr-section hand-drawn-border" v-if="user.attributes">
          <h2>日常属性</h2>
          <div class="attr-grid">
            <div class="attr-item">
              <span class="attr-name">能量</span>
              <div class="attr-bar">
                <div class="attr-fill energy" :style="{ width: user.attributes.energy + '%' }"></div>
              </div>
              <span class="attr-value">{{ user.attributes.energy }} / 100</span>
            </div>
            <div class="attr-item">
              <span class="attr-name">活力</span>
              <div class="attr-bar">
                <div class="attr-fill vitality" :style="{ width: user.attributes.vitality + '%' }"></div>
              </div>
              <span class="attr-value">{{ user.attributes.vitality }} / 100</span>
            </div>
          </div>
        </div>

        <div class="attr-section hand-drawn-border" v-if="user.attributes">
          <h2>长期属性</h2>
          <div class="attr-grid">
            <div class="attr-item">
              <span class="attr-name">道德</span>
              <span class="attr-value-simple">{{ user.attributes.morality }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-name">智力</span>
              <span class="attr-value-simple">{{ user.attributes.intelligence }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-name">体质</span>
              <span class="attr-value-simple">{{ user.attributes.constitution }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-name">魅力</span>
              <span class="attr-value-simple">{{ user.attributes.charm }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-name">意志</span>
              <span class="attr-value-simple">{{ user.attributes.willpower }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-name">情绪</span>
              <span class="attr-value-simple">{{ user.attributes.emotion }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-name">人缘</span>
              <span class="attr-value-simple">{{ user.attributes.popularity }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-name">金钱</span>
              <span class="attr-value-simple">{{ user.attributes.money }}</span>
            </div>
          </div>
        </div>

        <div class="attr-section hand-drawn-border" v-if="user.attributes">
          <h2>隐藏属性</h2>
          <div class="attr-grid">
            <div class="attr-item luck-item">
              <span class="attr-name">运气</span>
              <span class="luck-tag">{{ user.attributes.luckLabel }}</span>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="not-logged-in">
        <p>您还没有登录</p>
        <router-link to="/login" class="btn-primary">去登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const isEditing = ref(false)
const saving = ref(false)
const errorMessage = ref('')

const editForm = ref({
  nickname: '',
  birthday: '',
  gender: '',
  occupation: '',
  bio: ''
})

const user = computed(() => userStore.user)

const genderText = computed(() => {
  const map = { male: '男', female: '女', other: '其他' }
  return map[user.value?.gender] || '未知'
})

function formatDate(timestamp) {
  if (!timestamp) return '暂无'
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

onMounted(async () => {
  if (userStore.isLoggedIn) {
    try {
      await userStore.fetchProfile()
    } catch (e) {
      console.error('获取用户信息失败:', e)
    }
  }
  loading.value = false
})

function startEdit() {
  editForm.value = {
    nickname: user.value.nickname,
    birthday: user.value.birthday,
    gender: user.value.gender,
    occupation: user.value.occupation,
    bio: user.value.bio || ''
  }
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
  errorMessage.value = ''
}

async function handleUpdate() {
  errorMessage.value = ''
  saving.value = true

  try {
    await userStore.updateProfile({
      nickname: editForm.value.nickname,
      birthday: editForm.value.birthday,
      gender: editForm.value.gender,
      occupation: editForm.value.occupation,
      bio: editForm.value.bio
    })
    isEditing.value = false
  } catch (e) {
    errorMessage.value = e.message
  } finally {
    saving.value = false
  }
}

async function handleLogout() {
  await userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  /* padding: 24px;
  padding-top: 48px; */
  padding-bottom: 24px;
  background: #fafafa;
  overflow-y: auto;
}

.profile-container {
  max-width: 400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-header h1 {
  font-size: 24px;
}


.header {
  display: flex;
  align-items: center;
  padding: 48px 24px 24px;
}

.back-btn {
  font-size: 24px;
  text-decoration: none;
  color: inherit;
  width: 40px;
  flex-shrink: 0;
}

.title {
  font-size: 24px;
  font-weight: bold;
  flex: 1;
  text-align: center;
  margin: 0;
}

.placeholder {
  display: none;
}

.btn-logout {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: bold;
  background: #fff;
  border: 2px solid #000;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
}

.loading {
  text-align: center;
  padding: 40px;
  opacity: 0.6;
}

.user-card {
  padding: 20px;
  background: #0B0500;
  color: #fff;
  text-align: center;
}

.user-id {
  font-size: 12px;
  opacity: 0.6;
  margin-bottom: 8px;
}

.user-nickname {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 12px;
}

.user-luck {
  display: flex;
  justify-content: center;
}

.luck-label {
  font-size: 14px;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.info-section,
.attr-section {
  padding: 20px;
  background: #fff;
}

.info-section h2,
.attr-section h2 {
  font-size: 16px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.info-item .label {
  opacity: 0.6;
}

.info-item .value {
  font-weight: 500;
}

.btn-edit {
  width: 100%;
  margin-top: 20px;
  padding: 12px;
  font-size: 14px;
  font-weight: bold;
  background: #fff;
  border: 2px solid #000;
  border-radius: 4px;
  cursor: pointer;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: bold;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px;
  border: 2px solid #000;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.radio-group {
  display: flex;
  gap: 16px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: normal;
}

.radio-label input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.btn-group {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn-primary {
  flex: 1;
  padding: 12px;
  font-size: 14px;
  font-weight: bold;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary {
  flex: 1;
  padding: 12px;
  font-size: 14px;
  font-weight: bold;
  background: #fff;
  border: 2px solid #000;
  border-radius: 4px;
  cursor: pointer;
}

.error-message {
  color: #d32f2f;
  font-size: 14px;
  padding: 8px 12px;
  background: #ffebee;
  border-radius: 4px;
}

.attr-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.attr-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attr-name {
  font-size: 12px;
  opacity: 0.6;
}

.attr-bar {
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.attr-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.attr-fill.energy {
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
}

.attr-fill.vitality {
  background: linear-gradient(90deg, #FF9800, #FFC107);
}

.attr-value {
  font-size: 14px;
  font-weight: bold;
}

.attr-value-simple {
  font-size: 18px;
  font-weight: bold;
}

.luck-item {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.luck-tag {
  font-size: 16px;
  font-weight: bold;
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 4px;
}

.not-logged-in {
  text-align: center;
  padding: 40px;
}

.not-logged-in p {
  margin-bottom: 20px;
  opacity: 0.6;
}

.not-logged-in .btn-primary {
  display: inline-block;
  padding: 12px 24px;
  text-decoration: none;
}
</style>