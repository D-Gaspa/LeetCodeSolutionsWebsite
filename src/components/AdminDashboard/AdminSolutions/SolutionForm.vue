<template>
  <form class="solution-form" @submit.prevent="handleSubmit">
    <h3 class="form-title">{{ isEditing ? 'Edit Solution' : 'Add New Solution' }}</h3>

    <div class="form-group">
      <label for="approachName">Approach Name:</label>
      <input id="approachName" v-model="form.approach_name" required>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="timeComplexity">Time Complexity:</label>
        <input id="timeComplexity" v-model="form.time_complexity" required>
      </div>

      <div class="form-group">
        <label for="spaceComplexity">Space Complexity:</label>
        <input id="spaceComplexity" v-model="form.space_complexity" required>
      </div>
    </div>

    <div class="content-actions-wrapper">
      <div class="content-actions">
        <button class="btn-primary btn-icon" type="button" @click="openCodeEditor">
          <Code2 class="icon"/>
          {{ form.code ? 'Edit' : 'Add' }} Code
        </button>
        <button class="btn-primary btn-icon" type="button" @click="openContentEditor('code_idea')">
          <Lightbulb class="icon"/>
          {{ form.code_idea.text ? 'Edit' : 'Add' }} Code Idea
        </button>
        <button class="btn-primary btn-icon" type="button" @click="openContentEditor('code_breakdown')">
          <Split class="icon"/>
          {{ form.code_breakdown.text ? 'Edit' : 'Add' }} Code Breakdown
        </button>
        <button class="btn-primary btn-icon" type="button" @click="openContentEditor('time_complexity_explanation')">
          <Clock class="icon"/>
          {{ form.time_complexity_explanation.text ? 'Edit' : 'Add' }} Time Complexity Explanation
        </button>
        <button class="btn-primary btn-icon" type="button" @click="openContentEditor('space_complexity_explanation')">
          <Box class="icon"/>
          {{ form.space_complexity_explanation.text ? 'Edit' : 'Add' }} Space Complexity Explanation
        </button>
      </div>
    </div>

    <div class="form-actions">
      <button class="btn-secondary btn-icon" type="submit">
        <Save class="icon"/>
        {{ isEditing ? 'Update Solution' : 'Add Solution' }}
      </button>
      <button class="btn-danger btn-icon" type="button" @click="$emit('cancel')">
        <X class="icon"/>
        Cancel
      </button>
    </div>
  </form>

  <SolutionContentEditorModal
      v-model="currentContent"
      :content-label="currentContentLabel"
      :initial-content="currentInitialContent"
      :show="showContentEditor"
      @save="handleContentSave"
      @update:show="showContentEditor = $event"
  />

  <BaseModal v-model="showCodeEditor">
    <!-- TODO: Add Code Editor component here -->
  </BaseModal>
</template>

<script lang="ts" setup>
import {computed, reactive, ref} from 'vue'
import {Box, Clock, Code2, Lightbulb, Save, Split, X} from 'lucide-vue-next'
import SolutionContentEditorModal from './SolutionContentEditorModal.vue'
import BaseModal from "@/components/Common/BaseModal.vue"
import {useSolutionStore} from '@/stores/solutionStore'
import type {MdContentNoImages, Solution} from '@/types/Problem'

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

type SolutionFormType = {
  problem_id: number;
  approach_name: string;
  code: string;
  code_idea: MdContentNoImages;
  code_breakdown: MdContentNoImages;
  time_complexity: string;
  space_complexity: string;
  time_complexity_explanation: MdContentNoImages;
  space_complexity_explanation: MdContentNoImages;
}

const form = reactive<SolutionFormType>({
  problem_id: props.problemId,
  approach_name: '',
  code: '',
  code_idea: {text: ''},
  code_breakdown: {text: ''},
  time_complexity: 'O(n)',
  space_complexity: 'O(n)',
  time_complexity_explanation: {text: ''},
  space_complexity_explanation: {text: ''}
})

const showContentEditor = ref(false)
const currentEditingField = ref<keyof SolutionFormType | null>(null)

// If editing, populate form with existing data
if (isEditing.value && props.editingSolution) {
  Object.assign(form, props.editingSolution)
}

const openCodeEditor = () => {
  showCodeEditor.value = true
}

const openContentEditor = (field: keyof SolutionFormType) => {
  currentEditingField.value = field
  showContentEditor.value = true
}

const currentContent = computed({
  get: () => currentEditingField.value ? form[currentEditingField.value] as MdContentNoImages : {text: ''},
  set: (value: MdContentNoImages) => {
    if (currentEditingField.value) {
      const field = currentEditingField.value
      if (field === 'code_idea' || field === 'code_breakdown' ||
          field === 'time_complexity_explanation' || field === 'space_complexity_explanation') {
        form[field] = value
      }
    }
  }
})

const currentInitialContent = computed(() =>
    currentEditingField.value && props.editingSolution
        ? (props.editingSolution[currentEditingField.value] as MdContentNoImages) || {text: ''}
        : {text: ''}
)

const currentContentLabel = computed(() => {
  switch (currentEditingField.value) {
    case 'code_idea':
      return 'Code Idea'
    case 'code_breakdown':
      return 'Code Breakdown'
    case 'time_complexity_explanation':
      return 'Time Complexity Explanation'
    case 'space_complexity_explanation':
      return 'Space Complexity Explanation'
    default:
      return 'Solution Content'
  }
})

const handleContentSave = () => {
  showContentEditor.value = false
}

const handleSubmit = async () => {
  try {
    await solutionStore.saveSolution(form, isEditing.value)
    emit('solution-saved')
  } catch (error) {
    console.error('Error saving solution:', error)
    // Handle error (e.g., show notification)
  }
}
</script>

<style scoped>

.form-title {
  color: var(--text-color-primary);
  margin-bottom: var(--spacing-large);
  text-align: center;
}

.form-row {
  display: flex;
  gap: var(--spacing-medium);
}

.form-row .form-group {
  flex: 1;
}

label {
  display: inline-block;
  margin-bottom: var(--spacing-small);
  color: var(--text-color-secondary);
  font-weight: var(--font-weight-bold);
  width: auto;
}

input, select, .form-actions button {
  width: 100%;
  box-sizing: border-box;
}

.content-actions-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-large);
}

.content-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-medium);
}

.content-actions button {
  width: 100%;
  white-space: nowrap;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-medium);
}
</style>