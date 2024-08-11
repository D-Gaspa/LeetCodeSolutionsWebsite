<template>
  <div class="notification-container">
    <Notification
        v-for="notification in notifications"
        :key="notification.id"
        :duration="notification.duration"
        :isLoading="notification.isLoading"
        :message="notification.message"
        :type="notification.type"
        @close="initiateNotificationRemoval(notification.id)"
        @hide-complete="removeNotification(notification.id)"
    />
  </div>
</template>

<script lang="ts" setup>
import {ref} from 'vue'
import Notification from './Notification.vue'
import type {Notification as NotificationType, NotificationUpdate} from '@/types/notification'

const notifications = ref<NotificationType[]>([])

const addNotification = (notification: Omit<NotificationType, 'id'>): number => {
  const id = Date.now() + Math.random()
  notifications.value.push({...notification, id})
  return id
}

const initiateNotificationRemoval = (id: number): void => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index !== -1) {
    notifications.value[index] = {...notifications.value[index], isRemoving: true}
  }
}

const removeNotification = (id: number): void => {
  notifications.value = notifications.value.filter(n => n.id !== id)
}

const updateNotification = (id: number, updates: NotificationUpdate): void => {
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

defineExpose({
  addNotification,
  removeNotification,
  updateNotification
})
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}
</style>