import { createRouter, createWebHistory } from 'vue-router'

import { useSessionStore } from '@/stores/session'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/setup', name: 'setup', component: () => import('@/views/SetupView.vue') },
    {
      path: '/match',
      name: 'match',
      component: () => import('@/views/MatchView.vue'),
      // ยังไม่ได้เริ่มการแข่ง → ไปตั้งค่าก่อน
      beforeEnter: () => (useSessionStore().state ? true : { name: 'setup' }),
    },
    {
      path: '/summary',
      name: 'summary',
      component: () => import('@/views/SummaryView.vue'),
      beforeEnter: () => (useSessionStore().state ? true : { name: 'home' }),
    },
  ],
})

export default router
