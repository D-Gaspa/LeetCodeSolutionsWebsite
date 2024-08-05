import {ref, watch} from 'vue'

const theme = ref(localStorage.getItem('theme') || 'light')

export function useTheme() {
    const applyTheme = (newTheme) => {
        document.documentElement.setAttribute('data-theme', newTheme)
        localStorage.setItem('theme', newTheme)
    }

    watch(theme, (newTheme) => {
        applyTheme(newTheme)
    }, {immediate: true})

    function toggleTheme() {
        theme.value = theme.value === 'light' ? 'dark' : 'light'
    }

    return {theme, toggleTheme}
}