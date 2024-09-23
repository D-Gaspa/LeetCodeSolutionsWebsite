import {computed, ref} from 'vue'
import {useExampleStore} from '@/stores/exampleStore'
import {useNotification} from '@/composables/Common/useNotification'
import type {Example, ExampleSteps, ExampleVisualization} from '@/types/Problem'

export function useExampleEditor(solutionId: number) {
    const exampleStore = useExampleStore()
    const {showNotification} = useNotification()

    const steps = ref<ExampleSteps[]>([])
    const visualizations = ref<ExampleVisualization[]>([])
    const initialState = ref<Example | null>(null)

    const hasUnsavedChanges = computed(() => {
        if (!initialState.value) return steps.value.length > 0 || visualizations.value.length > 0

        const stepsChanged = JSON.stringify(steps.value) !== JSON.stringify(initialState.value.steps)
        const visualizationsChanged = JSON.stringify(visualizations.value) !== JSON.stringify(initialState.value.visualizations)

        return stepsChanged || visualizationsChanged
    })

    const fetchExample = async () => {
        try {
            const example = await exampleStore.fetchExampleBySolutionId(solutionId)
            if (example) {
                steps.value = example.steps
                visualizations.value = example.visualizations
                initialState.value = JSON.parse(JSON.stringify(example))
            }
        } catch (error) {
            showNotification(`Error fetching example: ${(error as Error).message}`, 'error')
        }
    }

    const updateSteps = (content: string) => {
        steps.value = parseSteps(content)
    }

    const parseSteps = (content: string): ExampleSteps[] => {
        const lines = content.split('\n')
        const parsedSteps: ExampleSteps[] = []
        let currentStep: ExampleSteps | null = null

        for (const line of lines) {
            const trimmedLine = line.trim()
            if (/^\d+\./.test(trimmedLine)) {
                if (currentStep) parsedSteps.push(currentStep)
                currentStep = {
                    step_number: parsedSteps.length + 1,
                    description: trimmedLine.replace(/^\d+\./, '').trim()
                }
            } else if (currentStep) {
                currentStep.description += '\n' + trimmedLine
            }
        }

        if (currentStep) parsedSteps.push(currentStep)
        return parsedSteps
    }

    const addVisualization = (visualization: ExampleVisualization) => {
        visualizations.value.push(visualization)
    }

    const deleteVisualization = (index: number) => {
        visualizations.value.splice(index, 1)
    }

    const associateVisualization = (visualizationIndex: number, stepIndices: number[]) => {
        visualizations.value[visualizationIndex].associatedSteps = stepIndices
    }

    const saveExample = async () => {
        try {
            if (steps.value.length === 0) {
                showNotification('Example must have at least one step', 'error')
            }

            const exampleData: Example = {
                solution_id: solutionId,
                steps: steps.value,
                visualizations: visualizations.value
            }

            await exampleStore.saveExample(exampleData)

            initialState.value = JSON.parse(JSON.stringify(exampleData))
            showNotification('Example saved successfully', 'success')
            return true
        } catch (error) {
            showNotification(`Error saving example: ${(error as Error).message}`, 'error')
            return false
        }
    }

    fetchExample().then(r => r)

    return {
        steps,
        visualizations,
        updateSteps,
        addVisualization,
        deleteVisualization,
        associateVisualization,
        saveExample,
        hasUnsavedChanges
    }
}