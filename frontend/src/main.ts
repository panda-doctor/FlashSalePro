import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import '@/assets/styles/index.css'

import App from './App.vue'
import router from './router'
import { setAdminTokenProvider, setUnauthorizedHandler } from '@/http/client'
import { useAdminTokenStore } from '@/stores/adminToken'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: zhCn })

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
