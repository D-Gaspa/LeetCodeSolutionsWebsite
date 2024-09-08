import {computed, reactive} from 'vue'
import {isEqual} from 'lodash'
import type {Solution, SolutionFormType} from '@/types/Problem'
import {useSolutionStore} from '@/stores/solutionStore'
import {useNotification} from '@/composables/Common/useNotification'

export function useSolutionForm(problemId: number, editingSolution?: Solution) {
    const solutionStore = useSolutionStore()
    const {showNotification} = useNotification()

    const initialFormState = reactive<SolutionFormType>({
        problem_id: problemId,
        approach_name: 'Test Approach',
        code: '',
        code_idea: {text: ''},
        code_breakdown: {text: ''},
        time_complexity: 'O(n)',
        space_complexity: 'O(n)',
        time_complexity_explanation: {text: ''},
        space_complexity_explanation: {text: ''}
    })

    if (editingSolution) {
        Object.assign(initialFormState, editingSolution)
    }

    const form = reactive<SolutionFormType>(JSON.parse(JSON.stringify(initialFormState)))

    const hasUnsavedChanges = computed(() => !isEqual(form, initialFormState))

    const handleSubmit = async () => {
        if (!form.code) {
            showNotification('Please add code before saving the solution', 'warning')
            return
        }
        try {
            await solutionStore.saveSolution(form, !!editingSolution)
            showNotification('Solution saved successfully', 'success')
            return true
        } catch (error) {
            console.error('Error saving solution:', error)
            showNotification(`Error saving solution: ${(error as Error).message}`, 'error')
            return false
        }
    }

    return {
        form,
        hasUnsavedChanges,
        handleSubmit
    }
}