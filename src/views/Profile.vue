<template>
  <div class="min-h-screen bg-[#fafafa] pb-6">
    <header class="flex items-center px-6 pt-6 pb-4">
      <router-link to="/" class="text-2xl no-underline text-inherit w-10 flex-shrink-0">←</router-link>
      <h1 class="text-xl font-bold flex-1 text-center m-0 sketch-font">我的角色</h1>
      <div class="w-auto">
        <wired-button @click="handleLogout" class="px-2 py-1 text-xs font-bold bg-white sketch-font">退出</wired-button>
      </div> 
    </header>

    <div class="max-w-[400px] mx-auto flex flex-col gap-5 px-6">
      <div v-if="loading" class="text-center py-10 opacity-60">加载中...</div>

      <template v-else-if="user">
        <wired-card class="p-5 text-center" fill="#fafafa">
          <div class="text-xs opacity-60 mb-2">ID: {{ user.id }}</div>
          <div class="text-2xl font-bold mb-3">{{ user.nickname }}</div>
          <div v-if="user.attributes" class="flex justify-center">
            <span class="text-lg font-bold px-3 py-1 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white rounded">{{ user.attributes.luckLabel }}</span>
          </div>
        </wired-card>

        <wired-card class="p-5" fill="#ffffff">
          <h2 class="text-base mb-4 pb-2 border-b-2 border-black">基本信息</h2>

          <div v-if="!isEditing" class="flex flex-col gap-3">
            <div class="flex justify-between text-sm">
              <span class="opacity-60">出生日期</span>
              <span class="font-medium">{{ user.birthday }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="opacity-60">性别</span>
              <span class="font-medium">{{ genderText }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="opacity-60">职业</span>
              <span class="font-medium">{{ user.occupation }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="opacity-60">个人简介</span>
              <span class="font-medium">{{ user.bio || '暂无' }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="opacity-60">创建时间</span>
              <span class="font-medium">{{ formatDate(user.createdAt) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="opacity-60">更新时间</span>
              <span class="font-medium">{{ formatDate(user.updatedAt) }}</span>
            </div>
          </div>

          <form v-else @submit.prevent="handleUpdate" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-bold sketch-font">昵称</label>
              <wired-input
                :value="editForm.nickname"
                @input="editForm.nickname = $event.target.value"
                class="w-full"
              ></wired-input>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-bold sketch-font">出生日期</label>
              <wired-input
                type="date"
                :value="editForm.birthday"
                @input="editForm.birthday = $event.target.value"
                class="w-full"
              ></wired-input>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-bold sketch-font">性别</label>
              <div class="flex gap-4">
                <wired-radio :checked="editForm.gender === 'male'" @click="editForm.gender = 'male'" class="sketch-font">男</wired-radio>
                <wired-radio :checked="editForm.gender === 'female'" @click="editForm.gender = 'female'" class="sketch-font">女</wired-radio>
                <wired-radio :checked="editForm.gender === 'other'" @click="editForm.gender = 'other'" class="sketch-font">其他</wired-radio>
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-bold sketch-font">职业</label>
              <wired-input
                :value="editForm.occupation"
                @input="editForm.occupation = $event.target.value"
                class="w-full"
              ></wired-input>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-bold sketch-font">个人简介</label>
              <wired-textarea
                :value="editForm.bio"
                @input="editForm.bio = $event.target.value"
                placeholder="简单介绍一下你的虚拟角色"
                rows="3"
                class="w-full"
              ></wired-textarea>
            </div>

            <div v-if="errorMessage" class="text-sm text-[#c62828] p-2 bg-[#f5e8e8] border border-[#c48a8a] rounded">{{ errorMessage }}</div>

            <div class="flex gap-3 mt-2">
              <wired-button
                @click="handleUpdate"
                :disabled="saving"
                class="flex-1 sketch-font"
              >
                {{ saving ? '保存中...' : '保存' }}
              </wired-button>
              <wired-button
                @click="cancelEdit"
                class="flex-1 sketch-font"
              >
                取消
              </wired-button>
            </div>
          </form>

          <wired-button v-if="!isEditing" @click="startEdit" class="w-full mt-5 py-3 text-sm font-bold bg-white sketch-font">编辑资料</wired-button>
        </wired-card>

        <wired-card class="p-5" v-if="user.attributes" fill="#ffffff">
          <h2 class="text-base mb-4 pb-2 border-b-2 border-black">日常属性</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <span class="text-xs opacity-60 sketch-font">能量</span>
              <wired-progress :value="user.attributes.energy" class="flex-1"></wired-progress>
              <span class="text-sm font-bold sketch-font">{{ user.attributes.energy }} / 100</span>
            </div>
            <div class="flex flex-col gap-1.5">
              <span class="text-xs opacity-60 sketch-font">活力</span>
              <wired-progress :value="user.attributes.vitality" class="flex-1"></wired-progress>
              <span class="text-sm font-bold sketch-font">{{ user.attributes.vitality }} / 100</span>
            </div>
          </div>
        </wired-card>

        <wired-card class="p-5" v-if="user.attributes" fill="#ffffff">
          <h2 class="text-base mb-4 pb-2 border-b-2 border-black">长期属性</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <span class="text-xs opacity-60 sketch-font">道德</span>
              <span class="text-lg font-bold sketch-font">{{ user.attributes.morality }}</span>
            </div>
            <div class="flex flex-col gap-1.5">
              <span class="text-xs opacity-60 sketch-font">智力</span>
              <span class="text-lg font-bold sketch-font">{{ user.attributes.intelligence }}</span>
            </div>
            <div class="flex flex-col gap-1.5">
              <span class="text-xs opacity-60 sketch-font">体质</span>
              <span class="text-lg font-bold sketch-font">{{ user.attributes.constitution }}</span>
            </div>
            <div class="flex flex-col gap-1.5">
              <span class="text-xs opacity-60 sketch-font">魅力</span>
              <span class="text-lg font-bold sketch-font">{{ user.attributes.charm }}</span>
            </div>
            <div class="flex flex-col gap-1.5">
              <span class="text-xs opacity-60 sketch-font">意志</span>
              <span class="text-lg font-bold sketch-font">{{ user.attributes.willpower }}</span>
            </div>
            <div class="flex flex-col gap-1.5">
              <span class="text-xs opacity-60 sketch-font">情绪</span>
              <span class="text-lg font-bold sketch-font">{{ user.attributes.emotion }}</span>
            </div>
            <div class="flex flex-col gap-1.5">
              <span class="text-xs opacity-60 sketch-font">人缘</span>
              <span class="text-lg font-bold sketch-font">{{ user.attributes.popularity }}</span>
            </div>
            <div class="flex flex-col gap-1.5">
              <span class="text-xs opacity-60 sketch-font">金钱</span>
              <span class="text-lg font-bold sketch-font">{{ user.attributes.money }}</span>
            </div>
          </div>
        </wired-card>

        <wired-card class="p-5" v-if="user.attributes" fill="#ffffff">
          <h2 class="text-base mb-4 pb-2 border-b-2 border-black">隐藏属性</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-row items-center justify-between">
              <span class="text-xs opacity-60 sketch-font">运气</span>
              <span class="text-lg font-bold px-3 py-1 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white rounded">{{ user.attributes.luckLabel }}</span>
            </div>
          </div>
        </wired-card>
      </template>

      <div v-else class="text-center py-10">
        <p class="mb-5 opacity-60">您还没有登录</p>
        <router-link to="/login" class="inline-block px-6 py-3 no-underline sketch-font bg-white text-[#1a1a1a] border-2 border-black rounded font-bold">去登录</router-link>
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

const user = computed(() => {
  const u = userStore.user
  if (!u) return null
  
  if (!u.attributes) {
    u.attributes = getDemoAttributes()
  }
  
  return u
})

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

function getDemoAttributes() {
  return {
    energy: 80,
    vitality: 60,
    morality: 10,
    intelligence: 15,
    constitution: 8,
    charm: 12,
    willpower: 20,
    emotion: 5,
    popularity: 18,
    money: 100,
    luckLevel: 3,
    luckLabel: '平常'
  }
}

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
</style>
