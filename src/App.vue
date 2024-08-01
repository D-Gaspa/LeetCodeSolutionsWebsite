<template>
  <div id="app">
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
  </div>
</template>

<script>
import {onMounted, provide, ref} from 'vue'
import {useRouter} from 'vue-router'
import {supabase} from './services/supabase'
import NotificationContainer from './components/NotificationContainer.vue'

export default {
  name: 'App',
  components: {
    NotificationContainer
  },
  setup() {
    const router = useRouter()
    const user = ref(null)
    const notificationContainer = ref(null)

    onMounted(() => {
      user.value = supabase.auth.getUserIdentities()?.[0]?.user ?? null

      supabase.auth.onAuthStateChange((_, session) => {
        user.value = session?.user ?? null
      })
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

    // Provide both methods
    provide('showNotification', showNotification)
    provide('updateNotification', updateNotification)

    return {
      user,
      handleLogout,
      notificationContainer,
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
  color: #2c3e50;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

</style>