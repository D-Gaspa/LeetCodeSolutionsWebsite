<template>
  <BaseModal v-model="isVisible" :confirm-on-close="true" class="example-editor-modal"
             @close-attempt="handleCloseAttempt">
    <div class="example-editor">
      <h3 class="example-editor-title">
        {{ solution.has_example ? 'Edit' : 'Add' }} Example for: {{ solution.approach_name }}
      </h3>

      <div class="instructions">
        <h4>Instructions:</h4>
        <ul>
          <li>Use numbered lists to define steps</li>
          <li>Each step should start with a number followed by a period (e.g., "1.")</li>
          <li>Content for each step should be indented</li>
          <li>You can use Markdown formatting within steps</li>
        </ul>
      </div>

      <div class="input-section">
        <h4>Input</h4>
        <div class="input-actions">
          <button class="btn-primary btn-icon" @click="openInputEditor">
            <PlusCircle class="icon"/>
            {{ input ? 'Edit' : 'Add' }} Input
          </button>
          <button :disabled="!input" class="btn-danger btn-icon" @click="deleteInput">
            <Trash2 class="icon"/>
            Delete Input
          </button>
        </div>
        <pre v-if="input" class="input-preview"><code>{{ input.substring(0, 100) }}{{
            input.length > 100 ? '...' : ''
          }}</code></pre>
        <p v-else class="no-input">No input added yet.</p>
      </div>

      <div class="steps-section">
        <h4>Steps</h4>
        <div class="step-actions">
          <button class="btn-primary btn-icon" @click="openStepEditor">
            <PlusCircle class="icon"/>
            {{ steps.length > 0 ? 'Edit' : 'Add' }} Steps
          </button>
          <button :disabled="steps.length === 0" class="btn-danger btn-icon" @click="deleteSteps">
            <Trash2 class="icon"/>
            Delete Steps
          </button>
        </div>
        <p v-if="steps.length > 0" class="step-count">{{ steps.length }} step{{ steps.length > 1 ? 's' : '' }} added</p>
        <p v-else class="no-steps">No steps added yet.</p>
      </div>

      <div class="visualizations-section">
        <h4>Visualizations</h4>
        <div class="image-gallery">
          <input
              ref="fileInput"
              accept="image/*"
              multiple
              style="display: none;"
              type="file"
              @change="handleFileUpload"
          >
          <button class="btn-primary btn-icon" @click="triggerFileUpload">
            <Upload class="icon"/>
            Upload Images
          </button>
          <div class="gallery-content">
            <div v-for="(vis, index) in visualizations" :key="vis.id" class="image-item">
              <img
                  :alt="vis.name"
                  :src="vis.url"
                  class="thumbnail"
              >
              <div v-if="steps.length > 0" class="step-association">
                <label :for="`visualization-${index}-steps`">Associated Steps:</label>
                <multiselect
                    v-model="vis.associatedSteps"
                    :clear-on-select="false"
                    :close-on-select="false"
                    :multiple="true"
                    :options="stepOptions"
                    :preserve-search="true"
                    label="label"
                    placeholder="Select steps"
                    track-by="value"
                    @input="updateAssociatedSteps(index, $event)"
                >
                  <template #selection="{ values, isOpen }">
                  <span v-if="values.length && !isOpen" class="multiselect__single">
                    {{ values.length }} step{{ values.length > 1 ? 's' : '' }} selected
                  </span>
                  </template>
                </multiselect>
              </div>
              <p v-else class="no-steps-message">No steps available to associate</p>
              <button class="btn-danger btn-icon delete-image-btn" @click="deleteVisualization(index)">
                <Trash2 class="icon"/>
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn-secondary btn-icon" @click="handleSaveExample">
          <Save class="icon"/>
          Save Example
        </button>
        <button v-if="solution.has_example" class="btn-danger btn-icon" @click="handleDeleteExample">
          <Trash2 class="icon"/>
          Delete Example
        </button>
        <button class="btn-neutral btn-icon" @click="handleCloseAttempt">
          <X class="icon"/>
          Cancel
        </button>
      </div>
    </div>
  </BaseModal>

  <InputEditorModal
      v-if="showInputEditor"
      v-model="showInputEditor"
      :input="input"
      @cancel="showInputEditor = false"
      @save="handleInputSave"
  />

  <StepEditorModal
      v-if="showStepEditor"
      v-model="showStepEditor"
      :steps="steps"
      @cancel="showStepEditor = false"
      @save="handleStepsSave"
  />
</template>

<script lang="ts" setup>
import {computed, ref} from 'vue'
import {PlusCircle, Save, Trash2, Upload, X} from 'lucide-vue-next'
import Multiselect from 'vue-multiselect'
import BaseModal from '@/components/Common/BaseModal.vue'
import InputEditorModal from './InputEditorModal.vue'
import StepEditorModal from './StepEditorModal.vue'
import {useExampleEditor} from '@/composables/AdminDashboard/AdminSolutions/ExampleEditor/useExampleEditor'
import {useNotification} from '@/composables/Common/useNotification'
import {useConfirm} from '@/composables/Common/useConfirm'
import {useExampleStore} from '@/stores/exampleStore'
import {useSolutionStore} from '@/stores/solutionStore'
import type {Solution} from '@/types/Problem'

const props = defineProps<{
  modelValue: boolean
  solution: Solution
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close', exampleUpdated: boolean): void
}>()

const solutionStore = useSolutionStore()
const exampleStore = useExampleStore()
const {showNotification} = useNotification()
const {showConfirm} = useConfirm()
const {
  input,
  steps,
  visualizations,
  updateInput,
  updateSteps,
  addVisualization,
  deleteVisualization,
  associateVisualization,
  saveExample,
  hasUnsavedChanges
} = useExampleEditor(props.solution)

const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const stepOptions = computed(() =>
    steps.value.map(step => ({label: `Step ${step.step_number}`, value: step.step_number}))
)

const showInputEditor = ref(false)
const showStepEditor = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const openInputEditor = () => {
  showInputEditor.value = true
}

const openStepEditor = () => {
  showStepEditor.value = true
}

const handleInputSave = (newInput: string) => {
  updateInput(newInput)
  showInputEditor.value = false
}

const handleStepsSave = (newSteps: string) => {
  updateSteps(newSteps)
  showStepEditor.value = false
}

const deleteInput = async () => {
  const confirmed = await showConfirm(
      'Delete Input',
      'Are you sure you want to delete the input? This action cannot be undone.'
  )
  if (confirmed) {
    updateInput('')
    showNotification('Input deleted', 'success')
  }
}

const deleteSteps = async () => {
  if (steps.value.length === 0) return

  const confirmed = await showConfirm(
      'Delete Steps',
      'Are you sure you want to delete all steps? This action cannot be undone.'
  )
  if (confirmed) {
    steps.value = []
    showNotification('All steps deleted', 'success')
  }
}

const updateAssociatedSteps = (index: number, selectedOptions: { value: number }[]) => {
  const stepIndices = selectedOptions.map(option => option.value)
  associateVisualization(index, stepIndices)
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileUpload = (event: Event) => {
  const files = (event.target as HTMLInputElement).files
  if (files) {
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        addVisualization({
          id: Date.now().toString(), // Temporary ID
          name: file.name,
          url: e.target?.result as string,
          file: file,
          associatedSteps: []
        })
      }
      reader.readAsDataURL(file)
    })
  }
}

const handleCloseAttempt = async () => {
  if (hasUnsavedChanges.value) {
    const shouldClose = await showConfirm(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to close the editor?'
    )
    if (shouldClose) {
      emit('close', false)
    }
  } else {
    emit('close', false)
  }
}

const handleSaveExample = async () => {
  const success = await saveExample()
  if (success) {
    await solutionStore.updateSolutionExampleStatus(props.solution.id, true)
    emit('close', true)
  }
}

const handleDeleteExample = async () => {
  const confirmed = await showConfirm(
      'Delete Example',
      'Are you sure you want to delete this example? This action cannot be undone.'
  )
  if (confirmed) {
    try {
      await exampleStore.deleteExample(props.solution.id)
      await solutionStore.updateSolutionExampleStatus(props.solution.id, false)
      showNotification('Example deleted successfully', 'success')
      emit('close', true)
    } catch (error) {
      showNotification(`Error deleting example: ${(error as Error).message}`, 'error')
    }
  }
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>

<style scoped>
.example-editor-modal :deep(.base-modal-content) {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: var(--border-radius);
  padding: var(--spacing-medium);
  width: 60%;
  max-width: 90vw;
  max-height: 90vh;
  transition: all var(--transition-base);
}

.example-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-medium);
}

.example-editor-title {
  font-size: var(--font-size-large);
  color: var(--text-color-primary);
}

.instructions {
  background-color: var(--bg-color-secondary);
  border: 1px solid var(--border-color-primary);
  border-radius: var(--border-radius);
  padding: var(--spacing-medium);
  transition: all var(--transition-base);
}

.instructions h4 {
  font-size: var(--font-size-base);
  margin-top: 0;
  color: var(--text-color-primary);
  transition: all var(--transition-base);
}

.instructions ul {
  text-align: left;
  padding-left: var(--spacing-large);
  color: var(--text-color-secondary);
  transition: all var(--transition-base);
}

h4 {
  font-size: var(--font-size-large);
  margin: 0;
  color: var(--text-color-primary);
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-small);
}

.input-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-small);
}

.input-preview {
  color: var(--text-color-secondary);
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-input {
  color: var(--text-color-muted);
  font-style: italic;
}

.steps-section,
.visualizations-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-medium);
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-small);
}

.step-count {
  color: var(--text-color-secondary);
  margin: 0;
  font-style: italic;
}

.no-steps {
  color: var(--text-color-muted);
  font-style: italic;
}

.image-gallery {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-small);
}

.gallery-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--spacing-small);
}

.image-item {
  display: flex;
  flex-direction: column;
  border: var(--border-width) solid var(--border-color-secondary);
  border-radius: var(--border-radius);
  background-color: var(--button-bg-neutral);
  padding: var(--spacing-small);
  align-items: center;
  transition: all var(--transition-base);
}

.image-item:hover {
  border-color: var(--input-focus);
  box-shadow: 0 0 0 2px rgba(var(--input-focus), 0.2);
}

.thumbnail {
  max-width: 100%;
  height: auto;
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-small);
}

.image-item select {
  width: 100%;
  margin-bottom: var(--spacing-small);
}

.delete-image-btn {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-medium);
}

.image-gallery > .btn-primary {
  align-self: center;
  margin-bottom: var(--spacing-small);
}

.no-steps-message {
  width: 100%;
  font-size: var(--font-size-small);
  text-align: center;
  color: var(--text-color-muted);
  font-style: italic;
  margin: var(--spacing-small) 0;
}

.delete-image-btn {
  width: 100%;
}

.step-association {
  width: 100%;
  margin-bottom: var(--spacing-small);
}

.step-association label {
  display: block;
  margin-bottom: var(--spacing-small);
  color: var(--text-color-secondary);
}
</style>