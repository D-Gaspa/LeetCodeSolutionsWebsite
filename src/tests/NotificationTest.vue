<template>
  <div class="notification-test">
    <h2>Notification Test Panel</h2>
    <button @click="showInfoNotification">Show Info</button>
    <button @click="showSuccessNotification">Show Success</button>
    <button @click="showErrorNotification">Show Error</button>
    <button @click="showWarningNotification">Show Warning</button>
    <button @click="showLongLoadingProcess">Show Long Loading Process</button>
  </div>
</template>

<script>
import {inject} from 'vue'

export default {
  name: 'NotificationTest',
  setup() {
    const showNotification = inject('showNotification')
    const updateNotification = inject('updateNotification')

    const showInfoNotification = () => {
      showNotification('This is an info notification', 'info', {duration: 3000})
    }

    const showSuccessNotification = () => {
      showNotification('This is a success notification', 'success', {duration: 3000})
    }

    const showErrorNotification = () => {
      showNotification('This is an error notification', 'error', {duration: 3000})
    }

    const showWarningNotification = () => {
      showNotification('This is a warning notification', 'warning', {duration: 3000})
    }

    const showLongLoadingProcess = async () => {
      const id = showNotification('Starting a long process...', 'loading', {isLoading: true})

      // Simulate steps in a long process
      await new Promise(resolve => setTimeout(resolve, 2000))
      updateNotification(id, {message: 'Step 1 completed'})

      await new Promise(resolve => setTimeout(resolve, 2000))
      updateNotification(id, {message: 'Step 2 completed'})

      await new Promise(resolve => setTimeout(resolve, 2000))
      updateNotification(id, {
        message: 'Process completed successfully',
        type: 'success',
        isLoading: false,
        duration: 3000
      })
    }

    return {
      showInfoNotification,
      showSuccessNotification,
      showErrorNotification,
      showWarningNotification,
      showLongLoadingProcess
    }
  }
}
</script>

<style scoped>
.notification-test {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

button {
  padding: 10px 15px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #2980b9;
}
</style>