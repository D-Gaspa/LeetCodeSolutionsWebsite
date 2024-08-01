<template>
  <transition name="fade">
    <div v-if="show" :class="['notification', type, { 'is-loading': isLoading }]">
      <div class="notification-content">
        {{ message }}
      </div>
      <div v-if="isLoading" class="loading-indicator"></div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'Notification',
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
  data() {
    return {
      show: false
    }
  },
  mounted() {
    this.show = true
    if (!this.isLoading && this.duration > 0) {
      setTimeout(() => {
        this.show = false
      }, this.duration)
    }
  }
}
</script>

<style scoped>
.notification {
  background-color: #333333;
  border-left: 4px solid #007bff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  color: #ffffff;
  font-size: 16px;
  margin-bottom: 10px;
  max-width: 300px;
  padding: 15px;
  position: relative;
  display: flex;
  align-items: center;
}

.notification.success {
  border-left-color: #28a745;
}

.notification.error {
  border-left-color: #dc3545;
}

.notification.warning {
  border-left-color: #ffc107;
}

.notification.loading {
  border-left-color: #17a2b8;
}

.notification-content {
  flex-grow: 1;
  margin-right: 30px;
}

.loading-indicator {
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}

@keyframes spin {
  0% {
    transform: translateY(-50%) rotate(0deg);
  }
  100% {
    transform: translateY(-50%) rotate(360deg);
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>