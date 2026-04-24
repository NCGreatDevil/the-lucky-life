<template>
  <div class="profile-page">
    <div class="profile-container">
      <div class="profile-header">
        <h1 class="sketch-font">我的角色</h1>
        <button @click="handleLogout" class="btn-logout">退出登录</button>
      </div>

      <div v-if="loading" class="loading">加载中...</div>

      <template v-else-if="user">
        <div class="user-card hand-drawn-border">
          <div class="user-id">ID: {{ user.id }}</div>
          <div class="user-nickname">{{ user.nickname }}</div>
          <div class="user-tags">
            <span v-for="tag in user.tags" :key="tag" class="tag">{{ tag }}</span>
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
              <span class="label">工作岗位</span>
              <span class="value">{{ user.occupation }}</span>
            </div>
            <div class="info-item">
              <span class="label">个人简介</span>
              <span class="value">{{ user.bio || '暂无' }}</span>
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
              <label>工作岗位</label>
              <select v-model="editForm.occupation" required>
                <option value="">请选择</option>
                <option value="教师">教师</option>
                <option value="医生">医生</option>
                <option value="工程师">工程师</option>
                <option value="设计师">设计师</option>
                <option value="销售">销售</option>
                <option value="公务员">公务员</option>
                <option value="学生">学生</option>
                <option value="自由职业">自由职业</option>
                <option value="企业家">企业家</option>
                <option value="艺术家">艺术家</option>
                <option value="其他">其他</option>
              </select>
              <input
                v-if="editForm.occupation === '其他'"
                type="text"
                v-model="editForm.customOccupation"
                placeholder="请输入岗位"
                class="custom-input"
              />
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

        <div class="attr-section hand-drawn-border">
          <h2>角色属性</h2>
          <div class="attr-grid">
            <div class="attr-item">
              <span class="attr-name">运势</span>
              <div class="attr-bar">
                <div class="attr-fill" :style="{ width: user.luckiness + '%' }"></div>
              </div>
              <span class="attr-value">{{ user.luckiness }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-name">魅力</span>
              <div class="attr-bar">
                <div class="attr-fill" :style="{ width: user.charm + '%' }"></div>
              </div>
              <span class="attr-value">{{ user.charm }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-name">智慧</span>
              <div class="attr-bar">
                <div class="attr-fill" :style="{ width: user.wisdom + '%' }"></div>
              </div>
              <span class="attr-value">{{ user.wisdom }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-name">勇气</span>
              <div class="attr-bar">
                <div class="attr-fill" :style="{ width: user.courage + '%' }"></div>
              </div>
              <span class="attr-value">{{ user.courage }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-name">财富</span>
              <div class="attr-bar">
                <div class="attr-fill" :style="{ width: user.wealth + '%' }"></div>
              </div>
              <span class="attr-value">{{ user.wealth }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-name">健康</span>
              <div class="attr-bar">
                <div class="attr-fill" :style="{ width: user.health + '%' }"></div>
              </div>
              <span class="attr-value">{{ user.health }}</span>
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
  customOccupation: '',
  bio: ''
})

const user = computed(() => userStore.user)

const genderText = computed(() => {
  const map = { male: '男', female: '女', other: '其他' }
  return map[user.value?.gender] || '未知'
})

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
    customOccupation: '',
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
    const occupation = editForm.value.occupation === '其他'
      ? editForm.value.customOccupation
      : editForm.value.occupation

    await userStore.updateProfile({
      nickname: editForm.value.nickname,
      birthday: editForm.value.birthday,
      gender: editForm.value.gender,
      occupation,
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
  padding: 24px;
  padding-top: 48px;
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

.btn-logout {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: bold;
  background: #fff;
  border: 2px solid #000;
  border-radius: 4px;
  cursor: pointer;
}

.loading {
  text-align: center;
  padding: 40px;
  opacity: 0.6;
}

.user-card {
  padding: 20px;
  background: #000;
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

.user-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.tag {
  font-size: 11px;
  padding: 4px 8px;
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

.custom-input {
  margin-top: 8px;
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
  background: #000;
  transition: width 0.3s ease;
}

.attr-value {
  font-size: 14px;
  font-weight: bold;
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
