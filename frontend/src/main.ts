import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@/assets/styles/index.css'

import App from './App.vue'
import router from './router'
import { setAdminTokenProvider, setUnauthorizedHandler } from '@/shared/api/client'
import { useAdminTokenStore } from '@/modules/admin/store/adminToken'
import { useAuthStore } from '@/modules/auth/store'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const adminToken = useAdminTokenStore(pinia)
setAdminTokenProvider(() => adminToken.token)

const auth = useAuthStore(pinia)
setUnauthorizedHandler(() => {
  auth.reset()
  const current = router.currentRoute.value
  if (current.meta.requiresAuth && router.hasRoute('login')) {
    router.push({ name: 'login', query: { redirect: current.fullPath } })
  }
})

app.mount('#app')
