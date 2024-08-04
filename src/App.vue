<template>
  <div id="app">
    <header>
      <ThemeToggle class="theme-toggle-position"/>
    </header>
    <nav>
      <router-link to="/">Home</router-link>
      |
      <router-link to="/problems">Problems</router-link>
      |
      <template v-if="user">
        <router-link to="/admin">Admin</router-link>
        |
        <a href="#" @click.prevent="handleLogout">Logout</a>
      </template>
      <template v-else>
        <router-link to="/login">Login</router-link>
      </template>
    </nav>
    <router-view/>
    <NotificationContainer ref="notificationContainer"/>
    <ConfirmDialog ref="confirmDialog" v-model:show="showConfirmDialog" @confirm="handleConfirm"
                   @dismiss="handleDismiss"/>
  </div>
</template>

<script>
import {onMounted, provide, ref} from 'vue'
import {useRouter} from 'vue-router'
import {supabase} from './services/supabase'
import NotificationContainer from './components/NotificationContainer.vue'
import ConfirmDialog from "@/components/ConfirmDialog.vue"
import ThemeToggle from "@/components/ThemeToggle.vue"
import {useTheme} from "@/composables/useTheme.js"

export default {
  name: 'App',
  components: {
    ThemeToggle,
    ConfirmDialog,
    NotificationContainer
  },
  setup() {
    const {theme} = useTheme()
    const router = useRouter()
    const user = ref(null)
    const notificationContainer = ref(null)
    const showConfirmDialog = ref(false)
    const confirmDialog = ref(null)
    let confirmResolve = null

    onMounted(() => {
      user.value = supabase.auth.getUserIdentities()?.[0]?.user ?? null

      supabase.auth.onAuthStateChange((_, session) => {
        user.value = session?.user ?? null
      })

      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark && !localStorage.getItem('theme')) {
        theme.value = 'dark'
      }
    })

    const handleLogout = async () => {
      await supabase.auth.signOut()
      user.value = null
      await router.push('/login')
    }

    const showNotification = (message, type = 'info', options = {}) => {
      if (type === 'loading') {
        options.isLoading = true
      }
      return notificationContainer.value.addNotification({message, type, ...options})
    }

    const updateNotification = (id, updates) => {
      notificationContainer.value.updateNotification(id, updates)
    }

    const showConfirm = (title, message) => {
      return new Promise((resolve) => {
        confirmResolve = resolve
        confirmDialog.value.open(title, message)
      })
    }

    const handleConfirm = () => {
      if (confirmResolve) {
        confirmResolve(true)
        confirmResolve = null
      }
    }

    const handleDismiss = () => {
      if (confirmResolve) {
        confirmResolve(false)
        confirmResolve = null
      }
    }

    provide('showNotification', showNotification)
    provide('updateNotification', updateNotification)
    provide('showConfirm', showConfirm)

    return {
      user,
      notificationContainer,
      showConfirmDialog,
      confirmDialog,
      handleLogout,
      handleConfirm,
      handleDismiss
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  min-height: 100vh;
}

.theme-toggle-position {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: var(--text-color-primary);
}
</style>