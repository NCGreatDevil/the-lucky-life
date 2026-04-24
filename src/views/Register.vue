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
          <label for="birthday">出生日期 <span class="required">*</span></label>
          <input
            type="date"
            id="birthday"
            v-model="form.birthday"
            required
          />
          <span class="hint">例如：你28岁，可以填写1999年</span>
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
          <select id="occupation" v-model="form.occupation" required>
            <option value="">请选择或填写</option>
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
            v-if="form.occupation === '其他'"
            type="text"
            v-model="form.customOccupation"
            placeholder="请输入你的岗位"
            class="custom-input"
          />
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const form = ref({
  nickname: '',
  password: '',
  confirmPassword: '',
  birthday: '',
  gender: '',
  occupation: '',
  customOccupation: '',
  bio: ''
})

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const occupation = computed(() => {
  return form.value.occupation === '其他' ? form.value.customOccupation : form.value.occupation
})

async function handleRegister() {
  errorMessage.value = ''
  successMessage.value = ''

  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  if (form.value.password.length < 6) {
    errorMessage.value = '密码长度至少为6位'
    return
  }

  if (!form.value.birthday) {
    errorMessage.value = '请选择出生日期'
    return
  }

  if (!form.value.gender) {
    errorMessage.value = '请选择性别'
    return
  }

  if (!form.value.occupation || (form.value.occupation === '其他' && !form.value.customOccupation)) {
    errorMessage.value = '请选择或填写工作岗位'
    return
  }

  loading.value = true

  try {
    const result = await userStore.register({
      nickname: form.value.nickname,
      password: form.value.password,
      birthday: form.value.birthday,
      gender: form.value.gender,
      occupation: occupation.value,
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
.form-group input[type="date"],
.form-group select,
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
.form-group select:focus,
.form-group textarea:focus {
  border-color: #666;
}

.hint {
  font-size: 11px;
  color: #888;
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
