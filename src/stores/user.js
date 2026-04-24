import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE = '/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('session_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user_data') || 'null'))
  const isLoggedIn = computed(() => !!token.value && !!user.value)

  async function register(data) {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      body: JSON.stringify({ nickname, password }),
      credentials: 'include'
    })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(json.error || '登录失败')
    }
    token.value = json.token
    user.value = json.user
    localStorage.setItem('session_token', json.token)
    localStorage.setItem('user_data', JSON.stringify(json.user))
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
    token.value = ''
    user.value = null
    localStorage.removeItem('session_token')
    localStorage.removeItem('user_data')
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
    localStorage.setItem('user_data', JSON.stringify(json.user))
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
    localStorage.setItem('user_data', JSON.stringify(json.user))
    return json
  }

  return {
    token,
    user,
    isLoggedIn,
    register,
    login,
    logout,
    fetchProfile,
    updateProfile
  }
})
