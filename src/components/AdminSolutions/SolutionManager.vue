<template>
  <BaseModal v-model="isVisible" class="solution-manager">
    <div class="solution-manager-content">
      <h3 class="solution-manager-title">Solutions for Problem: {{ props.problem.title }}</h3>
      <div v-if="solutions.length > 0" class="solution-list">
        <div v-for="solution in solutions" :key="solution.id" class="solution-item">
          <h4 class="solution-approach">{{ solution.approach_name }}</h4>
          <div class="solution-actions">
            <button class="btn-neutral btn-icon-transparent" @click="editSolution(solution)">
              <Edit2 class="icon"/>
              Edit
            </button>
            <button class="btn-danger btn-icon-transparent" @click="deleteSolution(solution)">
              <Trash2 class="icon"/>
              Delete
            </button>
          </div>
        </div>
      </div>
      <div v-else class="no-solutions">
        No solutions available for this problem.
      </div>
      <button class="btn-primary btn-icon add-solution-btn" @click="addNewSolution">
        <PlusCircle class="icon"/>
        Add New Solution
      </button>
    </div>
  </BaseModal>
</template>

<script lang="ts" setup>
import {onMounted, ref, watch} from 'vue'
import {Edit2, PlusCircle, Trash2} from 'lucide-vue-next'
import BaseModal from '@/components/Common/BaseModal.vue'
import type {Problem, Solution} from '@/types/Problem'
import {useSolutionStore} from '@/stores/solutionStore'
import {useNotification} from '@/composables/Common/useNotification'

const props = defineProps<{
  modelValue: boolean
  problem: Problem
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'solutions-updated'): void
}>()

const solutionStore = useSolutionStore()
const {showNotification} = useNotification()

const isVisible = ref(props.modelValue)
const solutions = ref<Solution[]>([])

watch(() => props.modelValue, (newValue) => {
  isVisible.value = newValue
})

watch(isVisible, (newValue) => {
  emit('update:modelValue', newValue)
})

onMounted(async () => {
  await fetchSolutions()
})

const fetchSolutions = async () => {
  try {
    solutions.value = await solutionStore.fetchSolutionsForProblem(props.problem.id)
  } catch (error) {
    showNotification(`Error fetching solutions: ${(error as Error).message}`, 'error')
  }
}

const editSolution = (solution: Solution) => {
  // Implement edit logic (e.g., open a form to edit the solution)
  console.log('Edit solution:', solution)
}

const deleteSolution = async (solution: Solution) => {
  try {
    await solutionStore.deleteSolution(solution.id, props.problem.id)
    await solutionStore.updateSolutionCount(props.problem.id)
    showNotification('Solution deleted successfully', 'success')
    emit('solutions-updated')
  } catch (error) {
    showNotification(`Error deleting solution: ${(error as Error).message}`, 'error')
  }
}

const addNewSolution = () => {

}
</script>

<style scoped>
.solution-manager :deep(.base-modal-content) {
  max-width: 600px;
  width: 90%;
}

.solution-manager-content {
  background-color: var(--bg-color-primary);
  color: var(--text-color-primary);
  border-radius: var(--border-radius);
  padding: var(--spacing-large);
}

.solution-manager-title {
  font-size: var(--font-size-large);
  margin-bottom: var(--spacing-medium);
  color: var(--text-color-primary);
}

.solution-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-medium);
  margin-bottom: var(--spacing-large);
}

.solution-item {
  background-color: var(--bg-color-secondary);
  border: var(--border-width) solid var(--border-color-secondary);
  border-radius: var(--border-radius);
  padding: var(--spacing-medium);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all var(--transition-base);
}

.solution-item:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-small);
}

.solution-approach {
  font-size: var(--font-size-base);
  margin: 0;
  color: var(--text-color-primary);
}

.solution-actions {
  display: flex;
  gap: var(--spacing-small);
}

.no-solutions {
  background-color: var(--bg-color-secondary);
  border: var(--border-width) solid var(--border-color-secondary);
  border-radius: var(--border-radius);
  padding: var(--spacing-large);
  text-align: center;
  color: var(--text-color-secondary);
  margin-bottom: var(--spacing-large);
}

.add-solution-btn {
  width: 100%;
  justify-content: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .solution-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .solution-actions {
    margin-top: var(--spacing-small);
  }
}
</style>