import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/fortune',
    name: 'Fortune',
    component: () => import('@/views/Fortune.vue')
  },
  {
    path: '/role',
    name: 'Role',
    component: () => import('@/views/Role.vue')
  },
  {
    path: '/events',
    name: 'Events',
    component: () => import('@/views/Events.vue')
  },
  {
    path: '/friends',
    name: 'Friends',
    component: () => import('@/views/Friends.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
