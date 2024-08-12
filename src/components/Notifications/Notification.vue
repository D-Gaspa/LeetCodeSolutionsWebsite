<template>
  <transition name="notification" @after-leave="onAfterLeave">
    <div v-if="show" :class="['notification', type]">
      <div :class="type" class="notification-icon">
        <component :is="iconComponent"/>
      </div>
      <div class="notification-content">
        <div class="notification-message">{{ message }}</div>
      </div>
      <button v-if="!isLoading" class="close-button" @click="closeNotification">
        <X :size="14"/>
      </button>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {AlertCircle, AlertTriangle, CheckCircle, Info, Loader, X} from 'lucide-vue-next'
import type {NotificationType} from '@/types/Notification'

const props = defineProps<{
  message: string
  type: NotificationType
  duration: number
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'hide-complete'): void
}>()

const show = ref(false)
const timeoutId = ref<number>(0)

const iconComponent = computed(() => {
  const iconMap = {
    info: Info,
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    loading: Loader
  }
  return iconMap[props.type]
})

const setHideTimeout = (): void => {
  if (timeoutId.value) {
    clearTimeout(timeoutId.value)
  }
  timeoutId.value = window.setTimeout(() => {
    show.value = false
  }, props.duration)
}

const closeNotification = (): void => {
  show.value = false
}

const onAfterLeave = (): void => {
  emit('hide-complete')
}

watch(() => props.isLoading, (newVal: boolean) => {
  if (!newVal && props.duration > 0) {
    setHideTimeout()
  }
})

watch(() => props.duration, (newVal: number) => {
  if (!props.isLoading && newVal > 0) {
    setHideTimeout()
  }
})

onMounted(() => {
  show.value = true
  if (!props.isLoading && props.duration > 0) {
    setHideTimeout()
  }
})

onBeforeUnmount(() => {
  if (timeoutId.value) {
    clearTimeout(timeoutId.value)
  }
})
</script>

<style scoped>
.notification {
  display: flex;
  align-items: flex-start;
  background-color: var(--bg-color-secondary);
  border-radius: 4px;
  box-shadow: var(--shadow-medium);
  color: var(--text-color-primary);
  font-size: var(--font-size-small);
  margin-bottom: 10px;
  max-width: 350px;
  padding: 12px 15px;
  position: relative;
}

.notification-icon {
  margin-right: 12px;
  display: flex;
  align-items: center;
}

.notification-icon svg {
  width: 20px;
  height: 20px;
}

.notification-icon.info {
  color: var(--color-info);
}

.notification-icon.success {
  color: var(--color-success);
}

.notification-icon.error {
  color: var(--color-error);
}

.notification-icon.warning {
  color: var(--color-warning);
}

.notification-icon.loading {
  color: var(--color-loading);
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.notification-content {
  flex-grow: 1;
  padding-right: 20px;
}

.notification-message {
  line-height: 1.4;
}

.close-button {
  background: none;
  border: none;
  color: var(--text-color-primary);
  cursor: pointer;
  padding: 0;
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
}

.notification.info {
  border-left: 4px solid #3498db;
}

.notification.success {
  border-left: 4px solid #2ecc71;
}

.notification.error {
  border-left: 4px solid #e74c3c;
}

.notification.warning {
  border-left: 4px solid #f39c12;
}

.notification.loading {
  border-left: 4px solid #9b59b6;
}

.notification-enter-active, .notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from, .notification-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>