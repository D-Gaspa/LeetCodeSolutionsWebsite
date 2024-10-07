import {computed, ref} from 'vue'
import {useExampleStore} from '@/stores/exampleStore'
import {useNotification} from '@/composables/Common/useNotification'
import type {Example, ExampleSteps, ExampleVisualization, Solution} from '@/types/Problem'
import {
    useExampleImageManagement
} from "@/composables/AdminDashboard/AdminSolutions/ExampleEditor/useExampleImageManagement"

export function useExampleEditor(solution: Solution) {
    const exampleStore = useExampleStore()
    const {showNotification} = useNotification()
    const {handleImageManagement} = useExampleImageManagement(solution.id)

    const input = ref<string>('')
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
            const example = await exampleStore.fetchExampleBySolutionId(solution.id)
            if (example) {
                input.value = example.input
                steps.value = example.steps
                visualizations.value = example.visualizations
                initialState.value = JSON.parse(JSON.stringify(example))
            }
        } catch (error) {
            showNotification(`Error fetching example: ${(error as Error).message}`, 'error')
        }
    }

    const updateInput = (newInput: string) => {
        input.value = newInput
    }

    const updateSteps = (content: string) => {
        steps.value = parseSteps(content)
    }

    const parseSteps = (content: string): ExampleSteps[] => {
        const lines = content.split('\n');
        const parsedSteps: ExampleSteps[] = [];
        let currentStep: ExampleSteps | null = null;

        for (const line of lines) {
            if (/^\s*\d+\./.test(line)) {
                if (currentStep) parsedSteps.push(currentStep);
                currentStep = {
                    step_number: parsedSteps.length + 1,
                    description: line.replace(/^\s*\d+\./, '').trimStart()
                };
            } else if (currentStep) {
                currentStep.description += '\n' + line;
            }
        }

        if (currentStep) parsedSteps.push(currentStep);
        return parsedSteps;
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
                return false
            }

            if (!input.value.trim()) {
                showNotification('Example must have an input', 'error')
                return false
            }

            const unassociatedVisualizations = visualizations.value.filter(v => !v.associatedSteps)

            if (unassociatedVisualizations.length > 0) {
                showNotification('All visualizations must be associated with at least one step', 'error')
                return false
            }

            const {success, updatedImages, error} = await handleImageManagement(
                visualizations.value,
                initialState.value?.visualizations || []
            )

            if (!success) {
                showNotification(`Error processing images: ${error}`, 'error')
                return false
            }

            const exampleData: Example = {
                input: input.value,
                solution_id: solution.id,
                steps: steps.value,
                visualizations: updatedImages || visualizations.value
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

    if (solution.has_example) {
        fetchExample().then(r => r)
    }

    return {
        input,
        steps,
        visualizations,
        updateInput,
        updateSteps,
        addVisualization,
        deleteVisualization,
        associateVisualization,
        saveExample,
        hasUnsavedChanges,
    }
}