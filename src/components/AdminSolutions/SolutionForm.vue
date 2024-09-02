<template>
  <form @submit.prevent="handleSubmit">
    <h3>{{ isEditing ? 'Edit Solution' : 'Add New Solution' }}</h3>

    <!-- Basic form fields -->
    <div class="form-group">
      <label for="approachName">Approach Name:</label>
      <input id="approachName" v-model="form.approach_name" required>
    </div>

    <div class="form-group">
      <label for="timeComplexity">Time Complexity:</label>
      <input id="timeComplexity" v-model="form.time_complexity" required>
    </div>

    <div class="form-group">
      <label for="spaceComplexity">Space Complexity:</label>
      <input id="spaceComplexity" v-model="form.space_complexity" required>
    </div>

    <!-- Code Editor Button -->
    <button type="button" @click="openCodeEditor">
      {{ form.code ? 'Edit Code' : 'Add Code' }}
    </button>

    <!-- Markdown Editors -->
    <div class="form-group">
      <label>Code Idea:</label>
      <SolutionContentEditor ref="codeIdeaRef" v-model="form.code_idea" :enable-images="false"/>
    </div>

    <div class="form-group">
      <label>Code Breakdown:</label>
      <SolutionContentEditor ref="codeBreakdownRef" v-model="form.code_breakdown" :enable-images="false"/>
    </div>

    <div class="form-group">
      <label>Time Complexity Explanation:</label>
      <SolutionContentEditor ref="timeComplexityExplanationRef" v-model="form.time_complexity_explanation"
                             :enable-images="false"/>
    </div>

    <div class="form-group">
      <label>Space Complexity Explanation:</label>
      <SolutionContentEditor ref="spaceComplexityExplanationRef" v-model="form.space_complexity_explanation"
                             :enable-images="false"/>
    </div>

    <!-- Examples Placeholder -->
    <button disabled type="button" @click="manageExamples">
      Manage Examples (Coming Soon)
    </button>

    <button type="submit">{{ isEditing ? 'Update Solution' : 'Add Solution' }}</button>
  </form>

  <!-- Code Editor Modal (placeholder) -->
  <BaseModal v-model="showCodeEditor">
    <!-- Integrate your code editor here -->
  </BaseModal>
</template>

<script lang="ts" setup>
import {computed, ref} from 'vue'
import SolutionContentEditor from './SolutionContentEditor.vue'
import BaseModal from '@/components/Common/BaseModal.vue'
import {useSolutionStore} from '@/stores/solutionStore'
import type {Solution} from '@/types/Problem'

const props = defineProps<{
  problemId: number
  editingSolution?: Solution
}>()

const emit = defineEmits<{
  (e: 'solution-saved'): void
  (e: 'cancel'): void
}>()

const solutionStore = useSolutionStore()
const showCodeEditor = ref(false)

const isEditing = computed(() => !!props.editingSolution)

const form = ref({
  problem_id: props.problemId,
  approach_name: '',
  code: '',
  code_idea: '',
  code_breakdown: '',
  time_complexity: 'O(n)',
  space_complexity: 'O(n)',
  time_complexity_explanation: '',
  space_complexity_explanation: ''
})

const codeIdeaRef = ref<InstanceType<typeof SolutionContentEditor> | null>(null)
const codeBreakdownRef = ref<InstanceType<typeof SolutionContentEditor> | null>(null)
const timeComplexityExplanationRef = ref<InstanceType<typeof SolutionContentEditor> | null>(null)
const spaceComplexityExplanationRef = ref<InstanceType<typeof SolutionContentEditor> | null>(null)

// If editing, populate form with existing data
if (isEditing.value) {
  Object.assign(form.value, props.editingSolution)
}

const openCodeEditor = () => {
  showCodeEditor.value = true
}

const manageExamples = () => {
  // To be implemented later
  console.log('Manage examples')
}

const hasUnsavedChanges = (): boolean => {
  if (!codeIdeaRef.value || !codeBreakdownRef.value || !timeComplexityExplanationRef.value || !spaceComplexityExplanationRef.value) {
    return false
  }
  return (
      codeIdeaRef.value?.hasUnsavedChanges() ||
      codeBreakdownRef.value?.hasUnsavedChanges() ||
      timeComplexityExplanationRef.value?.hasUnsavedChanges() ||
      spaceComplexityExplanationRef.value?.hasUnsavedChanges()
  )
}

const handleSubmit = async () => {
  try {
    const solutionData = {
      ...form.value,
      code_idea: codeIdeaRef.value?.getContent() || '',
      code_breakdown: codeBreakdownRef.value?.getContent() || '',
      time_complexity_explanation: timeComplexityExplanationRef.value?.getContent() || '',
      space_complexity_explanation: spaceComplexityExplanationRef.value?.getContent() || '',
    }
    await solutionStore.saveSolution(solutionData, isEditing.value)
    emit('solution-saved')
  } catch (error) {
    console.error('Error saving solution:', error)
    // Handle error (e.g., show notification)
  }
}

defineExpose({
  hasUnsavedChanges
})
</script>