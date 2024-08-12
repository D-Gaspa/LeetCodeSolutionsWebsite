<template>
  <div class="loading-spinner">
    <div class="spinner-icon">
      <Loader :size="size"/>
    </div>
    <div v-if="message" class="spinner-message">{{ message }}</div>
  </div>
</template>

<script lang="ts" setup>
import {Loader} from 'lucide-vue-next'

interface Props {
  size?: number
  message?: string
}

withDefaults(defineProps<Props>(), {
  size: 24,
  message: ''
})
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.spinner-icon {
  color: var(--color-loading);
  animation: spin 1.5s linear infinite;
}

.spinner-message {
  margin-top: 10px;
  color: var(--text-color-primary);
  font-size: var(--font-size-small);
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>