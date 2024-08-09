import {inject} from 'vue'

export function useNotification() {
    const showNotification = inject('showNotification') as (message: string, type: string, options?: object) => number;
    const updateNotification = inject('updateNotification') as (id: number, updates: object) => void;

    return {showNotification, updateNotification}
}