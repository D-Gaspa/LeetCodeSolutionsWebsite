import {inject} from 'vue'

export function useConfirm() {
    const showConfirm = inject('showConfirm') as (message: string, options: string) => Promise<boolean>;

    return {showConfirm}
}