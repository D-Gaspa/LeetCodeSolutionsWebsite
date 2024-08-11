export type NotificationType = 'info' | 'success' | 'error' | 'warning' | 'loading';

export interface Notification {
    id: number;
    message: string;
    type: NotificationType;
    duration: number;
    isLoading: boolean;
    isRemoving?: boolean;
}

export interface NotificationUpdate {
    message?: string;
    type?: NotificationType;
    duration?: number;
    isLoading?: boolean;
}