import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import ContactsPage from './components/ContactsPage.vue' // если вынесешь компоненты, но в моём коде они внутри App.vue
// Проще: все компоненты описаны внутри App.vue, поэтому роутер создаём так:

const routes = [
  { path: '/analytics', component: AnalyticsPage },
  { path: '/contacts', component: ContactsPage },
  { path: '/deals', component: DealsPage },
  { path: '/', redirect: '/analytics' }
]
const router = createRouter({ history: createWebHistory(), routes })
const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')