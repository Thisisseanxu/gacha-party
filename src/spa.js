import { createApp } from 'vue'
import { createHead } from '@unhead/vue/client'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import { prepareAppData, initializeClientFeatures } from '@/appSetup.js'
import { routes } from '@/router.js'
import '@/styles/theme.css'

async function bootstrap() {
  await prepareAppData()

  const app = createApp(App)
  const router = createRouter({
    history: createWebHistory(),
    routes,
  })

  app.use(router)
  app.use(createHead())
  app.mount('#app')
  initializeClientFeatures(router)
}

bootstrap()
