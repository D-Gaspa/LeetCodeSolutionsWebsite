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
        <X size="14"/>
      </button>
    </div>
  </transition>
</template>

<script>
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {AlertCircle, AlertTriangle, CheckCircle, Info, Loader, X} from 'lucide-vue-next'

export default {
  name: 'Notification',
  components: {Info, CheckCircle, AlertCircle, AlertTriangle, Loader, X},
  props: {
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['info', 'success', 'error', 'warning', 'loading'].includes(value)
    },
    duration: {
      type: Number,
      default: 3000
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'hide-complete'],
  setup(props, {emit}) {
    const show = ref(false)
    const timeoutId = ref(0)

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

    const setHideTimeout = () => {
      if (timeoutId.value) {
        clearTimeout(timeoutId.value)
      }
      timeoutId.value = setTimeout(() => {
        show.value = false
      }, props.duration)
    }

    const closeNotification = () => {
      show.value = false
    }

    const onAfterLeave = () => {
      emit('hide-complete')
    }

    watch(() => props.isLoading, (newVal) => {
      if (!newVal && props.duration > 0) {
        setHideTimeout()
      }
    })

    watch(() => props.duration, (newVal) => {
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

    return {
      show,
      iconComponent,
      closeNotification,
      onAfterLeave
    }
  }
}
</script>

<style scoped>
.notification {
  display: flex;
  align-items: flex-start;
  background-color: #333333;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  color: #ffffff;
  font-family: 'Arial', sans-serif;
  font-size: 14px;
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
  color: #3498db;
}

.notification-icon.success {
  color: #2ecc71;
}

.notification-icon.error {
  color: #e74c3c;
}

.notification-icon.warning {
  color: #f39c12;
}

.notification-icon.loading {
  color: #9b59b6;
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
  color: #ffffff;
  cursor: pointer;
  padding: 0;
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
}

.progress-bar {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  height: 4px;
  margin-top: 8px;
  overflow: hidden;
  width: 100%;
}

.progress-bar-inner {
  animation: loading 2s linear infinite;
  background-color: #ffffff;
  height: 100%;
  width: 30%;
}

@keyframes loading {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(400%);
  }
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