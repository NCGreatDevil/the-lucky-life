<template>
  <div class="register-page">
    <wired-card class="register-container" fill="#ffffff">
      <div class="register-header">
        <h1 class="sketch-font">注册</h1>
        <p class="subtitle">创建你的虚拟角色</p>
      </div>

      <wired-card class="warning-box" fill="#fafafa">
        <p class="warning-title">⚠️ 重要提示</p>
        <p class="warning-text">
          这是一个虚拟人生体验项目。<strong>请勿填写真实的个人信息</strong>，<br/>
          但建议填写与真实情况相似的信息以获得更真实的体验。
        </p>
      </wired-card>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="userId" class="sketch-font">用户ID <span class="required">*</span></label>
          <wired-input
            type="text"
            id="userId"
            :value="form.userId"
            @input="form.userId = $event.target.value.replace(/[^A-Za-z0-9_]/g, '')"
            placeholder="字母、数字、下划线，最多16字符"
            style="width: 100%;"
          ></wired-input>
          <span class="hint">用于登录的唯一标识，如：Player_01</span>
        </div>

        <div class="form-group">
          <label for="nickname" class="sketch-font">昵称 <span class="required">*</span></label>
          <wired-input
            type="text"
            id="nickname"
            :value="form.nickname"
            @input="form.nickname = $event.target.value"
            placeholder="给自己起个昵称"
            style="width: 100%;"
          ></wired-input>
        </div>

        <div class="form-group">
          <label for="password" class="sketch-font">密码 <span class="required">*</span></label>
          <wired-input
            type="password"
            id="password"
            :value="form.password"
            @input="form.password = $event.target.value"
            placeholder="至少6位密码"
            style="width: 100%;"
          ></wired-input>
        </div>

        <div class="form-group">
          <label for="confirmPassword" class="sketch-font">确认密码 <span class="required">*</span></label>
          <wired-input
            type="password"
            id="confirmPassword"
            :value="form.confirmPassword"
            @input="form.confirmPassword = $event.target.value"
            placeholder="再次输入密码"
            style="width: 100%;"
          ></wired-input>
        </div>

        <div class="form-group">
          <label class="sketch-font">出生日期 <span class="required">*</span></label>
          <div class="birthday-selects">
            <wired-combo :value="form.birthYear" @selected="form.birthYear = $event.detail.value; updateBirthday()" style="width: 100%;">
              <wired-item value="" text="年"></wired-item>
              <wired-item v-for="year in years" :key="year" :value="year" :text="String(year)"></wired-item>
            </wired-combo>
            <wired-combo :value="form.birthMonth" @selected="form.birthMonth = $event.detail.value; updateBirthday()" style="width: 100%;">
              <wired-item value="" text="月"></wired-item>
              <wired-item v-for="month in 12" :key="month" :value="month" :text="month + '月'"></wired-item>
            </wired-combo>
            <wired-combo :value="form.birthDay" @selected="form.birthDay = $event.detail.value; updateBirthday()" style="width: 100%;">
              <wired-item value="" text="日"></wired-item>
              <wired-item v-for="day in daysInMonth" :key="day" :value="day" :text="day + '日'"></wired-item>
            </wired-combo>
          </div>
          <span class="hint">例如：你28岁，可以选择1999年</span>
        </div>

        <div class="form-group">
          <label class="sketch-font">性别 <span class="required">*</span></label>
          <div class="radio-group">
            <wired-radio :checked="form.gender === 'male'" @click="form.gender = 'male'" class="sketch-font">男</wired-radio>
            <wired-radio :checked="form.gender === 'female'" @click="form.gender = 'female'" class="sketch-font">女</wired-radio>
            <wired-radio :checked="form.gender === 'other'" @click="form.gender = 'other'" class="sketch-font">其他</wired-radio>
          </div>
        </div>

        <div class="form-group">
          <label for="occupation" class="sketch-font">职业 <span class="required">*</span></label>
          <wired-input
            type="text"
            id="occupation"
            :value="form.occupation"
            @input="form.occupation = $event.target.value"
            placeholder="请输入职业"
            style="width: 100%;"
          ></wired-input>
          <span class="hint">例如：你是教师，可以填写"学校教职工"</span>
        </div>

        <div class="form-group">
          <label for="bio" class="sketch-font">个人简介</label>
          <wired-textarea
            id="bio"
            :value="form.bio"
            @input="form.bio = $event.target.value"
            placeholder="简单介绍一下你的虚拟角色（选填）"
            rows="3"
            style="width: 100%;"
          ></wired-textarea>
        </div>

        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
        <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

        <wired-button
          @click="handleRegister"
          :disabled="loading"
          style="width: 100%;"
        >
          {{ loading ? '注册中...' : '创建角色' }}
        </wired-button>
      </form>

      <div class="register-footer">
        <p>已有账号？<router-link to="/login">立即登录</router-link></p>
      </div>
    </wired-card>
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
    errorMessage.value = '请输入职业'
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
  background: #fafafa;
  margin-bottom: 20px;
}

.warning-title {
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 4px;
}

.warning-text {
  font-size: 11px;
  color: #1a1a1a;
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
  color: #c62828;
  font-size: 14px;
  padding: 8px 12px;
  background: #f5e8e8;
  border: 1px solid #c48a8a;
  border-radius: 4px;
}

.success-message {
  color: #2e7d32;
  font-size: 14px;
  padding: 8px 12px;
  background: #f0f5e8;
  border: 1px solid #7a9a6d;
  border-radius: 4px;
}

.btn-primary {
  padding: 14px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 8px;
  background-color: #fff;
  color: #1a1a1a;
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}

.register-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
}

.register-footer a {
  color: #1a1a1a;
  font-weight: bold;
  text-decoration: underline;
}
</style>