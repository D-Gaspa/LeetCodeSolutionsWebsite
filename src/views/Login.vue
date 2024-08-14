<template>
  <div class="login-page">
    <div class="card login-card">
      <h4 class="login-title">Login</h4>
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <input id="email" v-model="email" autocomplete="email" class="form-input" placeholder="Email" required
                 type="email">
        </div>
        <div class="form-group">
          <input id="password" v-model="password" class="form-input" placeholder="Password" required type="password">
        </div>
        <button class="btn-primary" type="submit">Login</button>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {supabase} from '@/services/supabase'
import {useNotification} from "@/composables/Common/useNotification";

const router = useRouter()
const email = ref('')
const password = ref('')
const {showNotification, updateNotification} = useNotification()

const handleLogin = async () => {
  let notificationId = showNotification('Logging in...', 'loading')
  try {
    const {error: signInError} = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (signInError) {
      updateNotification(notificationId, {message: signInError.message, type: 'error', isLoading: false})
      return
    }

    await router.push('/admin')
    updateNotification(notificationId, {message: 'Logged in successfully', type: 'success', isLoading: false})
  } catch (error) {
    if (error instanceof Error) {
      updateNotification(notificationId, {message: error.message, type: 'error', isLoading: false})
    } else {
      updateNotification(notificationId, {message: 'An unknown error occurred', type: 'error', isLoading: false})
    }
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px 20px 20px 20px;
}

.form-input {
  background: none;
}

.login-card {
  width: 100%;
  max-width: 400px;
  transform: translateY(20px);
  animation: flyIn 0.5s ease-out forwards;
  overflow: hidden;
}

@keyframes flyIn {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.login-title {
  text-align: center;
  margin-bottom: var(--spacing-large);
  color: var(--text-color-primary);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-medium);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-small);
}

.form-group label {
  color: var(--text-color-secondary);
  transition: color var(--transition-base);
}

@media (max-width: 480px) {
  .login-card {
    padding: var(--spacing-medium);
  }
}
</style>