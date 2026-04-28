import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE = '/api'

export const useUserStore = defineStore('user', () => {
  const user = ref(JSON.parse(sessionStorage.getItem('user_data') || 'null'))
  const isLoggedIn = computed(() => !!user.value)

  async function register(data) {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(json.error || '注册失败')
    }
    return json
  }

  async function login(nickname, password) {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ nickname, password })
    })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(json.error || '登录失败')
    }
    user.value = json.user
    sessionStorage.setItem('user_data', JSON.stringify(json.user))
    return json
  }

  async function logout() {
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch (e) {
      console.error('登出请求失败:', e)
    }
    user.value = null
    sessionStorage.removeItem('user_data')
  }

  async function fetchProfile() {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'GET',
      credentials: 'include'
    })
    const json = await res.json()
    if (!res.ok) {
      if (res.status === 401) {
        await logout()
      }
      throw new Error(json.error || '获取用户信息失败')
    }
    user.value = json.user
    sessionStorage.setItem('user_data', JSON.stringify(json.user))
    return json.user
  }

  async function updateProfile(data) {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(json.error || '更新失败')
    }
    user.value = json.user
    sessionStorage.setItem('user_data', JSON.stringify(json.user))
    return json
  }

  return {
    user,
    isLoggedIn,
    register,
    login,
    logout,
    fetchProfile,
    updateProfile
  }
})
