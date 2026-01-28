import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// Импорт стилей
import './styles/main.css'

// Импорт маршрутов
const routes = [
  {
    path: '/',
    name: 'Monitoring',
    component: () => import('./views/Monitoring.vue')
  },
  {
    path: '/events',
    name: 'EventsLog',
    component: () => import('./views/EventsLog.vue')
  },
  {
    path: '/cars',
    name: 'SuspiciousCars',
    component: () => import('./views/SuspiciousCars.vue')
  }
]

// Создаем приложение
const app = createApp(App)
const pinia = createPinia()
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Используем плагины
app.use(pinia)
app.use(router)

// Монтируем приложение
app.mount('#app')