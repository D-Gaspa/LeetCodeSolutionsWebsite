import {createApp} from 'vue'
import {createPinia} from 'pinia'
import App from '@/App.vue'
import router from '@/router/index'
import '@/assets/theme.css'
import 'highlight.js/styles/github.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')