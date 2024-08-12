import {inject} from 'vue'
import type {NewNotification, NotificationOptions, NotificationType} from '@/types/Notification'

type ShowNotificationFunction = (message: string, type?: NotificationType, options?: NotificationOptions) => number
type UpdateNotificationFunction = (id: number, updates: Partial<NewNotification>) => void

export function useNotification() {
    const showNotification = inject('showNotification') as ShowNotificationFunction
    const updateNotification = inject('updateNotification') as UpdateNotificationFunction

    if (!showNotification || !updateNotification) {
        throw new Error('Notification functions are not provided')
    }

    return {showNotification, updateNotification}
}