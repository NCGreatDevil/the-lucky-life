<template>
  <div class="min-h-screen py-12 px-6 pt-12 bg-[#fafafa] overflow-y-auto">
    <wired-card class="w-full max-w-[400px] mx-auto bg-white p-6" fill="#ffffff">
      <div class="text-center mb-4">
        <h1 class="text-2xl mb-1 sketch-font">注册</h1>
        <p class="text-sm opacity-60">创建你的虚拟角色</p>
      </div>

      <wired-card class="p-3 mb-5" fill="#fafafa">
        <p class="text-xs font-bold mb-1">⚠️ 重要提示</p>
        <p class="text-[11px] text-[#1a1a1a] leading-relaxed">
          这是一个虚拟人生体验项目。<strong>请勿填写真实的个人信息</strong>，<br/>
          但建议填写与真实情况相似的信息以获得更真实的体验。
        </p>
      </wired-card>

      <form @submit.prevent="handleRegister" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="userId" class="text-sm font-bold sketch-font">用户ID <span class="text-[#d32f2f]">*</span></label>
          <wired-input
            type="text"
            id="userId"
            :value="form.userId"
            @input="form.userId = $event.target.value.replace(/[^A-Za-z0-9_]/g, '')"
            placeholder="字母、数字、下划线，最多16字符"
            class="w-full"
          ></wired-input>
          <span class="text-[11px] text-[#888]">用于登录的唯一标识，如：Player_01</span>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="nickname" class="text-sm font-bold sketch-font">昵称 <span class="text-[#d32f2f]">*</span></label>
          <wired-input
            type="text"
            id="nickname"
            :value="form.nickname"
            @input="form.nickname = $event.target.value"
            placeholder="给自己起个昵称"
            class="w-full"
          ></wired-input>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="password" class="text-sm font-bold sketch-font">密码 <span class="text-[#d32f2f]">*</span></label>
          <wired-input
            type="password"
            id="password"
            :value="form.password"
            @input="form.password = $event.target.value"
            placeholder="至少6位密码"
            class="w-full"
          ></wired-input>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="confirmPassword" class="text-sm font-bold sketch-font">确认密码 <span class="text-[#d32f2f]">*</span></label>
          <wired-input
            type="password"
            id="confirmPassword"
            :value="form.confirmPassword"
            @input="form.confirmPassword = $event.target.value"
            placeholder="再次输入密码"
            class="w-full"
          ></wired-input>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-bold sketch-font">出生日期 <span class="text-[#d32f2f]">*</span></label>
          <div class="flex gap-2">
            <wired-combo :value="form.birthYear" @selected="form.birthYear = $event.detail.value; updateBirthday()" class="flex-1">
              <wired-item value="" text="年"></wired-item>
              <wired-item v-for="year in years" :key="year" :value="year" :text="String(year)"></wired-item>
            </wired-combo>
            <wired-combo :value="form.birthMonth" @selected="form.birthMonth = $event.detail.value; updateBirthday()" class="flex-1">
              <wired-item value="" text="月"></wired-item>
              <wired-item v-for="month in 12" :key="month" :value="month" :text="month + '月'"></wired-item>
            </wired-combo>
            <wired-combo :value="form.birthDay" @selected="form.birthDay = $event.detail.value; updateBirthday()" class="flex-1">
              <wired-item value="" text="日"></wired-item>
              <wired-item v-for="day in daysInMonth" :key="day" :value="day" :text="day + '日'"></wired-item>
            </wired-combo>
          </div>
          <span class="text-[11px] text-[#888]">例如：你28岁，可以选择1999年</span>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-bold sketch-font">性别 <span class="text-[#d32f2f]">*</span></label>
          <div class="flex gap-4">
            <wired-radio :checked="form.gender === 'male'" @click="form.gender = 'male'" class="sketch-font">男</wired-radio>
            <wired-radio :checked="form.gender === 'female'" @click="form.gender = 'female'" class="sketch-font">女</wired-radio>
            <wired-radio :checked="form.gender === 'other'" @click="form.gender = 'other'" class="sketch-font">其他</wired-radio>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="occupation" class="text-sm font-bold sketch-font">职业 <span class="text-[#d32f2f]">*</span></label>
          <wired-input
            type="text"
            id="occupation"
            :value="form.occupation"
            @input="form.occupation = $event.target.value"
            placeholder="请输入职业"
            class="w-full"
          ></wired-input>
          <span class="text-[11px] text-[#888]">例如：你是教师，可以填写"学校教职工"</span>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="bio" class="text-sm font-bold sketch-font">个人简介</label>
          <wired-textarea
            id="bio"
            :value="form.bio"
            @input="form.bio = $event.target.value"
            placeholder="简单介绍一下你的虚拟角色（选填）"
            rows="3"
            class="w-full"
          ></wired-textarea>
        </div>

        <div v-if="errorMessage" class="text-sm text-[#c62828] p-2 bg-[#f5e8e8] border border-[#c48a8a] rounded">{{ errorMessage }}</div>
        <div v-if="successMessage" class="text-sm text-[#2e7d32] p-2 bg-[#f0f5e8] border border-[#7a9a6d] rounded">{{ successMessage }}</div>

        <wired-button
          @click="handleRegister"
          :disabled="loading"
          class="w-full py-3.5 text-base font-bold bg-white text-[#1a1a1a] cursor-pointer mt-2 sketch-font"
        >
          {{ loading ? '注册中...' : '创建角色' }}
        </wired-button>
      </form>

      <div class="mt-5 text-center text-sm">
        <p>已有账号？<router-link to="/login" class="text-[#1a1a1a] font-bold underline">立即登录</router-link></p>
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
    errorMessage.value = '请选择完整出生日期'
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
</style>
