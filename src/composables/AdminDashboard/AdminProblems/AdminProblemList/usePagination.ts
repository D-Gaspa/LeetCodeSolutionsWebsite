import {computed, ref, Ref} from 'vue'

export function usePagination<T>(items: Ref<T[]>, itemsPerPage: number) {
    const currentPage = ref(1)

    const totalPages = computed(() => Math.ceil(items.value.length / itemsPerPage))

    const paginatedItems = computed(() => {
        const start = (currentPage.value - 1) * itemsPerPage
        const end = start + itemsPerPage
        return items.value.slice(start, end)
    })

    const goToPage = (page: number) => {
        currentPage.value = page
    }

    return {
        currentPage,
        totalPages,
        paginatedItems,
        goToPage
    }
}