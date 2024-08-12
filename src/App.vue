<template>
  <div id="app">
    <header>
      <div class="header-icons">
        <ThemeToggle class="theme-toggle-position"/>
      </div>
    </header>
    <nav>
      <router-link class="nav-link" to="/">Home</router-link>
      |
      <router-link class="nav-link" to="/problems">Problems</router-link>
      |
      <template v-if="user">
        <router-link class="nav-link" to="/admin">Admin</router-link>
        |
        <a href="#" @click.prevent="confirmLogout">Logout</a>
      </template>
      <template v-else>
        <router-link class="nav-link" to="/login">Login</router-link>
      </template>
    </nav>
    <router-view/>
    <NotificationContainer ref="notificationContainer"/>
    <ConfirmDialog ref="confirmDialog" v-model:show="showConfirmDialog" @confirm="handleConfirm"
                   @dismiss="handleDismiss"/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, provide, ref} from 'vue'
import {useRouter} from 'vue-router'
import {supabase} from './services/supabase'
import NotificationContainer from './components/Notifications/NotificationContainer.vue'
import ConfirmDialog from "@/components/ConfirmDialog.vue"
import ThemeToggle from "@/components/ThemeToggle.vue"
import {useTheme} from "@/composables/useTheme"
import type {User} from '@supabase/supabase-js'
import type {NewNotification, NotificationOptions, NotificationType} from '@/types/Notification'

const {theme} = useTheme()
const router = useRouter()
const user = ref<User | null>(null)
const notificationContainer = ref<InstanceType<typeof NotificationContainer> | null>(null)
const showConfirmDialog = ref(false)
const confirmDialog = ref<InstanceType<typeof ConfirmDialog> | null>(null)
let confirmResolve: ((value: boolean) => void) | null = null

onMounted(async () => {
  const {data: {user: currentUser}} = await supabase.auth.getUser()
  user.value = currentUser

  supabase.auth.onAuthStateChange((_, session) => {
    user.value = session?.user ?? null
  })

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (prefersDark && !localStorage.getItem('theme')) {
    theme.value = 'dark'
  }
})

const confirmLogout = async () => {
  const confirmed = await showConfirm('Logout', 'Are you sure you want to logout?')
  if (confirmed) {
    await handleLogout()
  }
}

const handleLogout = async () => {
  await supabase.auth.signOut()
  user.value = null
  await router.push('/login')
}

const showNotification = (message: string, type: NotificationType = 'info', options: NotificationOptions = {}): number => {
  const notification: NewNotification = {
    message,
    type,
    duration: options.duration ?? 3000, // default duration
    isLoading: type === 'loading' || options.isLoading || false
  };

  if (notificationContainer.value === null) {
    throw new Error('Notification container not found')
  }

  return notificationContainer.value.addNotification(notification)
}

const updateNotification = (id: number, updates: Partial<NewNotification>) => {
  notificationContainer.value?.updateNotification(id, updates)
}

const showConfirm = (title: string, message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    confirmResolve = resolve
    confirmDialog.value?.open(title, message)
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
</script>

<style>
#app {
  font-family: Inter, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  min-height: 100%;
}

.header-icons {
  display: flex;
  justify-content: flex-end;
  padding: 10px;
  gap: 10px;
  align-content: center;
}

.theme-toggle-position {
  position: absolute;
}

nav {
  padding: 15px;
}

nav a {
  font-weight: bold;
  color: var(--text-color-primary);
}

.nav-link.router-link-active {
  border-bottom: 2px solid var(--color-primary);
}
</style>