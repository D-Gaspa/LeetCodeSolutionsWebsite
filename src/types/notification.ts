export type NotificationType = 'info' | 'success' | 'error' | 'warning' | 'loading';

export interface Notification {
    id: number;
    message: string;
    type: NotificationType;
    duration: number;
    isLoading: boolean;
}

export type NewNotification = Omit<Notification, 'id'>;

export interface NotificationOptions {
    duration?: number;
    isLoading?: boolean;
}