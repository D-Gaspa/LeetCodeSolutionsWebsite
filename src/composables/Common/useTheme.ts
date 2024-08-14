import {ref, watch} from 'vue'

type Theme = 'light' | 'dark'

const theme = ref<Theme>(localStorage.getItem('theme') as Theme || 'light')

export function useTheme() {
    const applyTheme = (newTheme: Theme): void => {
        document.documentElement.setAttribute('data-theme', newTheme)
        localStorage.setItem('theme', newTheme)
    }

    watch(theme, (newTheme) => {
        applyTheme(newTheme)
    }, {immediate: true})

    const toggleTheme = (): void => {
        theme.value = theme.value === 'light' ? 'dark' : 'light'
    }

    return {
        theme,
        toggleTheme
    }
}