<template>
  <form @submit.prevent="handleSubmit">
    <h3>{{ isEditing ? 'Edit Solution' : 'Add New Solution' }}</h3>

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

    <div class="content-actions">
      <button class="btn-primary btn-icon" type="button" @click="openCodeEditor">
        <Edit class="icon"/>
        {{ form.code ? 'Edit' : 'Add' }} Code
      </button>
      <button class="btn-primary btn-icon" type="button" @click="openContentEditor('code_idea')">
        <Edit class="icon"/>
        {{ form.code_idea.text ? 'Edit' : 'Add' }} Code Idea
      </button>
      <button class="btn-primary btn-icon" type="button" @click="openContentEditor('code_breakdown')">
        <Edit class="icon"/>
        {{ form.code_breakdown.text ? 'Edit' : 'Add' }} Code Breakdown
      </button>
      <button class="btn-primary btn-icon" type="button" @click="openContentEditor('time_complexity_explanation')">
        <Edit class="icon"/>
        {{ form.time_complexity_explanation.text ? 'Edit' : 'Add' }} Time Complexity Explanation
      </button>
      <button class="btn-primary btn-icon" type="button" @click="openContentEditor('space_complexity_explanation')">
        <Edit class="icon"/>
        {{ form.space_complexity_explanation.text ? 'Edit' : 'Add' }} Space Complexity Explanation
      </button>
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
      v-model="solutionContent"
      :show="showContentEditor"
      content-label="Solution Content"
      @save="handleContentSave"
      @update:show="showContentEditor = $event"
  />

  <!-- Code Editor Modal (placeholder) -->
  <BaseModal v-model="showCodeEditor">
    <!-- TODO: Add Code Editor component here -->
  </BaseModal>
</template>

<script lang="ts" setup>
import {computed, ref} from 'vue'
import {Edit, Save, X} from 'lucide-vue-next'
import SolutionContentEditorModal from './SolutionContentEditorModal.vue'
import {useSolutionStore} from '@/stores/solutionStore'
import type {MdContentNoImages, Solution} from '@/types/Problem'
import BaseModal from "@/components/Common/BaseModal.vue";

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
  code_idea: {text: ''} as MdContentNoImages,
  code_breakdown: {text: ''} as MdContentNoImages,
  time_complexity: 'O(n)',
  space_complexity: 'O(n)',
  time_complexity_explanation: {text: ''} as MdContentNoImages,
  space_complexity_explanation: {text: ''} as MdContentNoImages
})

const showContentEditor = ref(false)
const currentEditingField = ref<string | null>(null)
const solutionContent = ref<MdContentNoImages>({text: ''})

// If editing, populate form with existing data
if (isEditing.value && props.editingSolution) {
  Object.assign(form.value, props.editingSolution)
}

const openCodeEditor = () => {
  showCodeEditor.value = true
}

const openContentEditor = (field: string) => {
  currentEditingField.value = field
  showContentEditor.value = true
}

const handleContentSave = () => {
  showContentEditor.value = false
}

const handleSubmit = async () => {
  try {
    await solutionStore.saveSolution(form.value, isEditing.value)
    emit('solution-saved')
  } catch (error) {
    console.error('Error saving solution:', error)
    // Handle error (e.g., show notification)
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: var(--spacing-medium);
}

label {
  display: block;
  margin-bottom: var(--spacing-small);
}

input, textarea {
  width: 100%;
  padding: var(--spacing-small);
  border: var(--border-width) solid var(--border-color-secondary);
  border-radius: var(--border-radius);
}

.content-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-small);
  margin-bottom: var(--spacing-medium);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-small);
  margin-top: var(--spacing-medium);
}
</style>