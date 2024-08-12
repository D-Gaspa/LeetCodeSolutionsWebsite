import {computed, ref, Ref} from 'vue'
import {useNotification} from "@/composables/useNotification";
import type {Problem} from '@/types/Problem'

export function useProblemsFilter(problems: Ref<Problem[]>) {
    const searchQuery = ref('')
    const difficultyFilter = ref('')
    const typeFilter = ref('')
    const dateFilter = ref('')
    const sortField = ref<keyof Problem>('title')
    const sortOrder = ref<'asc' | 'desc'>('asc')
    const {showNotification} = useNotification()

    const filteredProblems = computed(() => {
        return problems.value.filter(problem =>
            problem.title.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
            (difficultyFilter.value === '' || problem.difficulty === difficultyFilter.value) &&
            (typeFilter.value === '' || problem.problem_type === typeFilter.value) &&
            (dateFilter.value === '' || problem.problem_date === dateFilter.value)
        )
    })

    const sortedProblems = computed(() => {
        return [...filteredProblems.value].sort((a, b) => {
            let aValue = a[sortField.value] as string | number
            let bValue = b[sortField.value] as string | number

            // Special handling for difficulty
            if (sortField.value === 'difficulty') {
                const difficultyOrder = {'Easy': 1, 'Medium': 2, 'Hard': 3}
                aValue = difficultyOrder[aValue as "Easy" | "Medium" | "Hard"] || 0
                bValue = difficultyOrder[bValue as "Easy" | "Medium" | "Hard"] || 0
            }

            // Special handling for problem_date
            if (sortField.value === 'problem_date') {
                return compareDates(a, b)
            }

            if (aValue < bValue) return sortOrder.value === 'asc' ? -1 : 1
            if (aValue > bValue) return sortOrder.value === 'asc' ? 1 : -1
            return 0
        })
    })

    const compareDates = (a: Problem, b: Problem): number => {
        const aDate = getComparableDate(a)
        const bDate = getComparableDate(b)

        if (aDate < bDate) return sortOrder.value === 'asc' ? -1 : 1
        if (aDate > bDate) return sortOrder.value === 'asc' ? 1 : -1
        return 0
    }

    const getComparableDate = (problem: Problem): number => {
        const [year, month, dayOrWeek] = problem.problem_date.split('-').map(Number)

        if (problem.problem_type === 'daily') {
            return new Date(year, month - 1, dayOrWeek).getTime()
        } else {
            // For weekly problems, we consider the first day of the week as the date,
            // and prioritize it over a normal daily problem with the same date
            // i.e.: January 7, 2024 → January W2, 2024 → January 8, 2024
            const firstDayOfWeek = new Date(year, month - 1, dayOrWeek * 7 - 6)
            firstDayOfWeek.setHours(-12)
            return firstDayOfWeek.getTime()
        }
    }

    const toggleSort = (field: string) => {
        try {
            if (field in problems.value[0]) {
                const typedField = field as keyof Problem
                if (sortField.value === typedField) {
                    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
                } else {
                    sortField.value = typedField
                    sortOrder.value = 'asc'
                }
            }
        } catch (error) {
            showNotification(`Error toggling sort for field ${field}`, 'error')
        }
    }

    return {
        searchQuery,
        difficultyFilter,
        typeFilter,
        dateFilter,
        sortField,
        sortOrder,
        filteredProblems,
        sortedProblems,
        toggleSort
    }
}