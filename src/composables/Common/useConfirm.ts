import {inject} from 'vue'

type ShowConfirmFunction = (title: string, message: string) => Promise<boolean>

export function useConfirm() {
    const showConfirm = inject('showConfirm') as ShowConfirmFunction

    if (!showConfirm) {
        throw new Error('showConfirm is not provided')
    }

    return {showConfirm}
}