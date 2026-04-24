<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <h1 class="sketch-font">注册</h1>
        <p class="subtitle">创建你的虚拟角色</p>
      </div>

      <div class="warning-box">
        <p class="warning-title">⚠️ 重要提示</p>
        <p class="warning-text">
          这是一个虚拟人生体验项目。<strong>请勿填写真实的个人信息</strong>，<br/>
          但建议填写与真实情况相似的信息以获得更真实的体验。
        </p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="userId">用户ID <span class="required">*</span></label>
          <input
            type="text"
            id="userId"
            v-model="form.userId"
            @input="validateUserId"
            placeholder="字母、数字、下划线，最多16字符"
            required
            maxlength="16"
            pattern="[A-Za-z0-9_]+"
          />
          <span class="hint">用于登录的唯一标识，如：Player_01</span>
        </div>

        <div class="form-group">
          <label for="nickname">昵称 <span class="required">*</span></label>
          <input
            type="text"
            id="nickname"
            v-model="form.nickname"
            placeholder="给自己起个昵称"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">密码 <span class="required">*</span></label>
          <input
            type="password"
            id="password"
            v-model="form.password"
            placeholder="至少6位密码"
            minlength="6"
            required
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">确认密码 <span class="required">*</span></label>
          <input
            type="password"
            id="confirmPassword"
            v-model="form.confirmPassword"
            placeholder="再次输入密码"
            required
          />
        </div>

        <div class="form-group">
          <label>出生日期 <span class="required">*</span></label>
          <div class="birthday-selects">
            <select v-model="form.birthYear" @change="updateBirthday" class="birthday-select">
              <option value="">年</option>
              <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
            </select>
            <select v-model="form.birthMonth" @change="updateBirthday" class="birthday-select">
              <option value="">月</option>
              <option v-for="month in 12" :key="month" :value="month">{{ month }}月</option>
            </select>
            <select v-model="form.birthDay" @change="updateBirthday" class="birthday-select">
              <option value="">日</option>
              <option v-for="day in daysInMonth" :key="day" :value="day">{{ day }}日</option>
            </select>
          </div>
          <span class="hint">例如：你28岁，可以选择1999年</span>
        </div>

        <div class="form-group">
          <label>性别 <span class="required">*</span></label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" v-model="form.gender" value="male" />
              <span>男</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="form.gender" value="female" />
              <span>女</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="form.gender" value="other" />
              <span>其他</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label for="occupation">工作岗位 <span class="required">*</span></label>
          <input
            type="text"
            id="occupation"
            v-model="form.occupation"
            placeholder="请输入工作岗位"
            required
            @focus="showOccupationGrid = true"
            @blur="showOccupationGrid = false"
          />
          <div v-if="showOccupationGrid" class="occupation-grid">
            <button
              v-for="job in occupationOptions"
              :key="job"
              type="button"
              class="occupation-item"
              :class="{ selected: form.occupation === job }"
              @click="selectOccupation(job)"
            >
              {{ job }}
            </button>
          </div>
          <span class="hint">例如：你是教师，可以填写"学校教职工"</span>
        </div>

        <div class="form-group">
          <label for="bio">个人简介</label>
          <textarea
            id="bio"
            v-model="form.bio"
            placeholder="简单介绍一下你的虚拟角色（选填）"
            rows="3"
          ></textarea>
        </div>

        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
        <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '注册中...' : '创建角色' }}
        </button>
      </form>

      <div class="register-footer">
        <p>已有账号？<router-link to="/login">立即登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 120 }, (_, i) => currentYear - i)

const occupationOptions = [
  '教师', '医生', '工程师', '设计师', '销售', '公务员',
  '学生', '管理者', '自由职业', '企业家', '艺术家',
  '金融从业者', '媒体从业者', '医护人员', '教育工作者',
  '技术工人', '服务员', '创业者'
]

const form = ref({
  userId: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  birthYear: '',
  birthMonth: '',
  birthDay: '',
  birthday: '',
  gender: '',
  occupation: '',
  bio: ''
})

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const showOccupationGrid = ref(false)

const daysInMonth = computed(() => {
  if (!form.value.birthYear || !form.value.birthMonth) {
    return 31
  }
  const year = parseInt(form.value.birthYear)
  const month = parseInt(form.value.birthMonth)
  
  if (month === 2) {
    if (isLeapYear(year)) {
      return 29
    }
    return 28
  }
  
  if ([4, 6, 9, 11].includes(month)) {
    return 30
  }
  
  return 31
})

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

function updateBirthday() {
  if (form.value.birthYear && form.value.birthMonth && form.value.birthDay) {
    const month = String(form.value.birthMonth).padStart(2, '0')
    const day = String(form.value.birthDay).padStart(2, '0')
    form.value.birthday = `${form.value.birthYear}-${month}-${day}`
  } else {
    form.value.birthday = ''
  }
}

watch(() => form.value.birthYear, () => {
  if (form.value.birthDay > daysInMonth.value) {
    form.value.birthDay = ''
  }
  updateBirthday()
})

watch(() => form.value.birthMonth, () => {
  if (form.value.birthDay > daysInMonth.value) {
    form.value.birthDay = ''
  }
  updateBirthday()
})

function selectOccupation(job) {
  form.value.occupation = job
  showOccupationGrid.value = false
}

function validateUserId() {
  form.value.userId = form.value.userId.replace(/[^A-Za-z0-9_]/g, '')
}

async function handleRegister() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!form.value.userId) {
    errorMessage.value = '请输入用户ID'
    return
  }

  if (!/^[A-Za-z0-9_]+$/.test(form.value.userId)) {
    errorMessage.value = '用户ID只能包含字母、数字和下划线'
    return
  }

  if (form.value.userId.length > 16) {
    errorMessage.value = '用户ID不能超过16个字符'
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  if (form.value.password.length < 6) {
    errorMessage.value = '密码长度至少为6位'
    return
  }

  if (!form.value.birthday) {
    errorMessage.value = '请选择完整的出生日期'
    return
  }

  if (!form.value.gender) {
    errorMessage.value = '请选择性别'
    return
  }

  if (!form.value.occupation) {
    errorMessage.value = '请选择工作岗位'
    return
  }

  loading.value = true

  try {
    const result = await userStore.register({
      userId: form.value.userId,
      nickname: form.value.nickname,
      password: form.value.password,
      birthday: form.value.birthday,
      gender: form.value.gender,
      occupation: form.value.occupation,
      bio: form.value.bio
    })

    successMessage.value = '注册成功！正在跳转登录...'
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  padding: 24px;
  padding-top: 48px;
  background: #fafafa;
  overflow-y: auto;
}

.register-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  background: #fff;
  border: 2.5px solid #000;
  border-radius: 8px;
  padding: 24px;
}

.register-header {
  text-align: center;
  margin-bottom: 16px;
}

.register-header h1 {
  font-size: 24px;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 14px;
  opacity: 0.6;
}

.warning-box {
  padding: 12px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  margin-bottom: 20px;
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

.register-form {
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

.required {
  color: #d32f2f;
}

.form-group input[type="text"],
.form-group input[type="password"],
.form-group textarea {
  padding: 10px;
  border: 2px solid #000;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #666;
}

.hint {
  font-size: 11px;
  color: #888;
}

.birthday-selects {
  display: flex;
  gap: 8px;
}

.birthday-select {
  flex: 1;
  padding: 10px;
  border: 2px solid #000;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  background: #fff;
  font-family: inherit;
}

.birthday-select:focus {
  border-color: #666;
}

.occupation-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px;
  background: #fafafa;
  border: none;
  border-radius: 4px;
}

.occupation-item {
  padding: 8px 4px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.occupation-item:hover {
  background: #e9ecef;
  border-color: #667eea;
}

.occupation-item.selected {
  background: #667eea;
  color: white;
  border-color: #667eea;
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

.error-message {
  color: #d32f2f;
  font-size: 14px;
  padding: 8px 12px;
  background: #ffebee;
  border-radius: 4px;
}

.success-message {
  color: #2e7d32;
  font-size: 14px;
  padding: 8px 12px;
  background: #e8f5e9;
  border-radius: 4px;
}

.btn-primary {
  padding: 14px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.1s;
  margin-top: 8px;
}

.btn-primary:active:not(:disabled) {
  transform: translate(2px, 2px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
}

.register-footer a {
  color: #000;
  font-weight: bold;
  text-decoration: underline;
}
</style>
