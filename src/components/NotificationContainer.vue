<template>
  <div class="notification-container">
    <Notification
        v-for="notification in notifications"
        :key="notification.id"
        :message="notification.message"
        :type="notification.type"
        :duration="notification.duration"
        :isLoading="notification.isLoading"
        @close="initiateNotificationRemoval(notification.id)"
        @hide-complete="removeNotification(notification.id)"
    />
  </div>
</template>

<script>
import {ref} from 'vue'
import Notification from './Notification.vue'

export default {
  name: 'NotificationContainer',
  components: {
    Notification
  },
  setup() {
    const notifications = ref([])

    const addNotification = (notification) => {
      const id = Date.now() + Math.random()
      notifications.value.push({...notification, id})
      return id
    }

    const initiateNotificationRemoval = (id) => {
      const index = notifications.value.findIndex(n => n.id === id)
      if (index !== -1) {
        notifications.value[index] = {...notifications.value[index], isRemoving: true}
      }
    }

    const removeNotification = (id) => {
      notifications.value = notifications.value.filter(n => n.id !== id)
    }

    const updateNotification = (id, updates) => {
      const index = notifications.value.findIndex(n => n.id === id)
      if (index !== -1) {
        const updatedNotification = {...notifications.value[index], ...updates}
        notifications.value[index] = updatedNotification

        if (!updatedNotification.isLoading && updatedNotification.duration) {
          setTimeout(() => {
            initiateNotificationRemoval(id)
          }, updatedNotification.duration)
        }
      }
    }

    return {
      notifications,
      addNotification,
      initiateNotificationRemoval,
      removeNotification,
      updateNotification
    }
  }
}
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}
</style>