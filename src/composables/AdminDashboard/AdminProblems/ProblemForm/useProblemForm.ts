import {computed, reactive, ref} from 'vue'
import {isEqual} from 'lodash'
import {useNotification} from '@/composables/Common/useNotification'
import {useProblemStore} from '@/stores/problemStore'
import {useImageManagement} from '@/composables/AdminDashboard/AdminProblems/ProblemForm/useImageManagement'
import {MdContent, Problem, ProblemDifficulty, ProblemFormType, ProblemType} from '@/types/Problem'
import {formatProblemDate} from '@/utils/problemUtils'

export function useProblemForm(editingProblem: Problem | null) {
    const {showNotification, updateNotification} = useNotification()
    const problemStore = useProblemStore()
    const {areImagesChanged, handleImageManagement} = useImageManagement()

    const initialFormState = ref<ProblemFormType>({
        id: 1,
        name: 'Test Problem',
        difficulty: ProblemDifficulty.Easy,
        problem_type: ProblemType.Daily,
        problem_date: new Date().toISOString().split('T')[0],
        content: {
            text: '',
            images: []
        }
    })

    const problemForm = reactive<ProblemFormType>(JSON.parse(JSON.stringify(initialFormState.value)))
    const weekNumber = ref(1)
    const originalImages = ref<MdContent['images']>([])

    const hasUnsavedChanges = computed(() => !isEqual(problemForm, initialFormState.value))

    const initializeForm = () => {
        if (editingProblem) {
            const formData = {
                id: editingProblem.id,
                name: editingProblem.title.split('.').slice(1).join('.').trim(),
                difficulty: editingProblem.difficulty,
                problem_type: editingProblem.problem_type,
                problem_date: editingProblem.problem_date,
                content: {
                    text: editingProblem.content.text || '',
                    images: editingProblem.content.images || []
                }
            }
            Object.assign(initialFormState.value, formData)
            Object.assign(problemForm, JSON.parse(JSON.stringify(formData)))
            weekNumber.value = parseInt(editingProblem.problem_date.split('-')[2])
            originalImages.value = editingProblem.content.images || []
        }
    }

    const validateAndSaveProblem = async (): Promise<boolean> => {
        if (!Number.isInteger(problemForm.id) || problemForm.id < 1) {
            showNotification('Problem number must be a positive integer', 'warning')
            return false
        }

        if (!problemForm.content || !problemForm.content.text || problemForm.content.text.trim() === '') {
            showNotification('Problem content cannot be empty', 'warning')
            return false
        }

        try {
            const existingProblem = await problemStore.checkProblemIdExists(problemForm.id)

            if (existingProblem && (!editingProblem || existingProblem.id !== editingProblem.id)) {
                showNotification('This problem number already exists. Please choose a different one.', 'warning')
                return false
            }

            return await saveProblem()
        } catch (error) {
            showNotification(`An error occurred while validating the problem number: ${(error as Error).message}`, 'error')
            return false
        }
    }

    const saveProblem = async () => {
        const notificationId = showNotification('Initializing problem save...', 'loading')

        try {
            const imagesChanged = areImagesChanged(problemForm.content.images || [], originalImages.value || [])

            if (imagesChanged) {
                updateNotification(notificationId, {message: 'Processing image changes...'})

                const result = await handleImageManagement(
                    problemForm.content.images || [],
                    originalImages.value || [],
                    problemForm.id,
                    problemForm.content.text || '',
                    notificationId
                )

                if (!result.success) {
                    updateNotification(notificationId, {
                        message: result.error,
                        type: 'error',
                        isLoading: false,
                    })
                    return false
                }

                problemForm.content.text = result.updatedContent || problemForm.content.text
                problemForm.content.images = result.renamedImages as MdContent['images']

                updateNotification(notificationId, {message: 'Image processing complete. Preparing to save problem...'})
            } else {
                updateNotification(notificationId, {message: 'No image changes detected. Preparing to save problem...'})
            }

            const formData = {...problemForm}

            formData.problem_date = formatProblemDate(formData.problem_date, formData.problem_type, weekNumber.value)
            formData.title = `${formData.id}. ${formData.name}`

            delete formData.name
            formData.content.images = formData.content.images?.map(img => ({
                id: img.id,
                name: img.name,
                url: img.url
            }))

            updateNotification(notificationId, {message: 'Saving problem to database...'})

            const result = await problemStore.saveProblem(formData, !!editingProblem)

            if ('error' in result) {
                updateNotification(notificationId, {
                    message: 'Error saving problem to database',
                    type: 'error',
                    isLoading: false,
                })
                return false
            } else {
                updateNotification(notificationId, {
                    message: 'Problem saved successfully',
                    type: 'success',
                    isLoading: false,
                })
                return true
            }
        } catch (error) {
            updateNotification(notificationId, {
                message: `Unexpected error saving problem: ${(error as Error).message}`,
                type: 'error',
                isLoading: false,
            })
            return false
        }
    }

    return {
        problemForm,
        weekNumber,
        hasUnsavedChanges,
        initializeForm,
        validateAndSaveProblem
    }
}