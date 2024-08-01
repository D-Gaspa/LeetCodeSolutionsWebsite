<template>
  <div class="notification-container">
    <Notification
        v-for="notification in notifications"
        :key="notification.id"
        :duration="notification.duration"
        :isLoading="notification.isLoading"
        :message="notification.message"
        :type="notification.type"
        @close="removeNotification(notification.id)"
    />
  </div>
</template>

<script>
import Notification from './Notification.vue'

export default {
  name: 'NotificationContainer',
  components: {
    Notification
  },
  data() {
    return {
      notifications: []
    }
  },
  methods: {
    addNotification(notification) {
      const id = Date.now()
      this.notifications.push({...notification, id})
      if (!notification.isLoading && notification.duration) {
        setTimeout(() => this.removeNotification(id), notification.duration)
      }
      return id
    },
    removeNotification(id) {
      this.notifications = this.notifications.filter(n => n.id !== id)
    },
    updateNotification(id, updates) {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index !== -1) {
        this.notifications[index] = {...this.notifications[index], ...updates}
        if (!updates.isLoading && updates.duration) {
          setTimeout(() => this.removeNotification(id), updates.duration)
        }
      }
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