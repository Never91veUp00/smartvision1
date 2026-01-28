import { defineAsyncComponent } from 'vue'

const routes = [
  {
    path: '/',
    redirect: '/monitoring'
  },
  {
    path: '/monitoring',
    name: 'Monitoring',
    component: defineAsyncComponent(() => import('@/views/Monitoring.vue'))
  },
  {
    path: '/events',
    name: 'EventsLog',
    component: defineAsyncComponent(() => import('@/views/EventsLog.vue'))
  },
  {
    path: '/cars',
    name: 'SuspiciousCars',
    component: defineAsyncComponent(() => import('@/views/SuspiciousCars.vue'))
  }
]

export default routes