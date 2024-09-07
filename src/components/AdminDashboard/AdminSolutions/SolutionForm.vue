<template>
  <form class="solution-form" @submit.prevent="handleSubmit">
    <h3 class="form-title">{{ isEditing ? 'Edit Solution' : 'Add New Solution' }}</h3>

    <div class="form-group">
      <label for="approachName">Approach Name:</label>
      <input id="approachName" v-model="form.approach_name" autocomplete="off" required>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="timeComplexity">Time Complexity:</label>
        <input id="timeComplexity" v-model="form.time_complexity" autocomplete="off" required>
      </div>

      <div class="form-group">
        <label for="spaceComplexity">Space Complexity:</label>
        <input id="spaceComplexity" v-model="form.space_complexity" autocomplete="off" required>
      </div>
    </div>

    <div class="content-actions-wrapper">
      <div class="content-actions">
        <div class="content-action-group">
          <button class="btn-primary btn-icon action-btn" type="button" @click="openCodeEditor">
            <Code2 class="icon"/>
            {{ form.code ? 'Edit' : 'Add' }} Code
          </button>
          <button :disabled="!form.code" class="btn-danger btn-icon delete-btn" type="button" @click="deleteCode">
            <Trash2 class="icon"/>
            Delete
          </button>
        </div>
        <div v-for="field in contentFields" :key="field" class="content-action-group">
          <button class="btn-primary btn-icon action-btn" type="button" @click="openContentEditor(field)">
            <component :is="getIcon(field)" class="icon"/>
            {{ form[field].text ? 'Edit' : 'Add' }} {{ getLabel(field) }}
          </button>
          <button :disabled="!form[field].text" class="btn-danger btn-icon delete-btn" type="button"
                  @click="deleteContent(field)">
            <Trash2 class="icon"/>
            Delete
          </button>
        </div>
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

  <BaseModal
      v-model="showCodeEditor"
      :confirm-on-close="true"
      class="code-editor-modal"
      @close-attempt="handleCodeEditorCloseAttempt"
  >
    <PythonCodeEditor
        ref="codeEditorRef"
        :model-value="form.code"
        :theme="currentTheme"
    />
    <div class="form-actions-container">
      <div class="code-form-actions">
        <button class="btn-secondary btn-icon" @click="saveCode">
          <Save class="icon"/>
          Save Content
        </button>
        <button class="btn-danger btn-icon" @click="handleCodeEditorCloseAttempt">
          <X class="icon"/>
          Close
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script lang="ts" setup>
import {computed, reactive, ref} from 'vue'
import {Box, Clock, Code2, Lightbulb, Save, Split, Trash2, X} from 'lucide-vue-next'
import SolutionContentEditorModal from './SolutionContentEditorModal.vue'
import BaseModal from "@/components/Common/BaseModal.vue"
import PythonCodeEditor from "@/components/Common/PythonCodeEditor.vue";
import {useSolutionStore} from '@/stores/solutionStore'
import type {MdContentNoImages, Solution} from '@/types/Problem'
import {useNotification} from '@/composables/Common/useNotification'
import {useConfirm} from '@/composables/Common/useConfirm'
import {useTheme} from '@/composables/Common/useTheme'

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
const {showNotification} = useNotification()
const {showConfirm} = useConfirm()
const {theme} = useTheme()
const currentTheme = computed(() => theme.value === 'dark' ? 'dark' : 'light')
const codeEditorRef = ref<InstanceType<typeof PythonCodeEditor> | null>(null)
const showContentEditor = ref(false)
const currentEditingField = ref<keyof SolutionFormType | null>(null)
const isEditing = computed(() => !!props.editingSolution)
const contentFields = ['code_idea', 'code_breakdown', 'time_complexity_explanation', 'space_complexity_explanation'] as const

const getIcon = (field: string) => {
  switch (field) {
    case 'code_idea':
      return Lightbulb
    case 'code_breakdown':
      return Split
    case 'time_complexity_explanation':
      return Clock
    case 'space_complexity_explanation':
      return Box
    default:
      return Box
  }
}

const getLabel = (field: string) => {
  switch (field) {
    case 'code_idea':
      return 'Code Idea'
    case 'code_breakdown':
      return 'Code Breakdown'
    case 'time_complexity_explanation':
      return 'Time Complexity Explanation'
    case 'space_complexity_explanation':
      return 'Space Complexity Explanation'
    default:
      return 'Content'
  }
}

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
  approach_name: 'Test Approach',
  code: '',
  code_idea: {text: ''},
  code_breakdown: {text: ''},
  time_complexity: 'O(n)',
  space_complexity: 'O(n)',
  time_complexity_explanation: {text: ''},
  space_complexity_explanation: {text: ''}
})

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

const saveCode = () => {
  if (codeEditorRef.value) {
    const newContent = codeEditorRef.value.getContent()
    const hasChanges = codeEditorRef.value.checkUnsavedChanges()

    if (hasChanges) {
      form.code = newContent
      showNotification('Code saved successfully', 'success')
    } else {
      showNotification('No changes to save', 'info')
    }
    showCodeEditor.value = false
  } else {
    showNotification('Error saving code. Please try again.', 'error')
  }
}

const handleCodeEditorCloseAttempt = async () => {
  let shouldClose = true
  if (codeEditorRef.value?.checkUnsavedChanges()) {
    shouldClose = await showConfirm(
        'Close Code Editor',
        'Are you sure you want to close the code editor? Any unsaved changes will be lost.'
    )
  }
  if (shouldClose) {
    showCodeEditor.value = false
  }
}

const handleContentSave = () => {
  showContentEditor.value = false
}

const deleteContent = async (field: keyof SolutionFormType) => {
  const confirmed = await showConfirm('Delete Content', `Are you sure you want to delete the ${getLabel(field)}?`)
  if (confirmed) {
    if (field === 'code_idea' || field === 'code_breakdown' ||
        field === 'time_complexity_explanation' || field === 'space_complexity_explanation') {
      form[field] = {text: ''}
      showNotification(`${getLabel(field)} deleted successfully`, 'success')
    }
  }
}

const deleteCode = async () => {
  const confirmed = await showConfirm('Delete Code', 'Are you sure you want to delete the code?')
  if (confirmed) {
    form.code = ''
    showNotification('Code deleted successfully', 'success')
  }
}

const handleSubmit = async () => {
  try {
    await solutionStore.saveSolution(form, isEditing.value)
    emit('solution-saved')
    showNotification('Solution saved successfully', 'success')
  } catch (error) {
    console.error('Error saving solution:', error)
    showNotification(`Error saving solution: ${(error as Error).message}`, 'error')
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
  align-items: stretch;
  gap: var(--spacing-medium);
  width: 100%;
}

.content-action-group {
  display: flex;
  gap: var(--spacing-small);
  width: 100%;
}

.action-btn {
  flex: 3;
  justify-content: center;
  padding-left: var(--spacing-medium);
}

.delete-btn {
  flex: 1;
}

.content-action-group button {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-medium);
}

.code-editor-modal :deep(.base-modal-content) {
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: var(--border-radius);
  padding: var(--spacing-medium);
  width: 80%;
  height: 80%;
  max-width: 90vw;
  max-height: 90vh;
  transition: all var(--transition-base);
}

.form-actions-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.code-form-actions {
  margin: 0;
  display: flex;
  justify-content: center;
  gap: 10px;
}
</style>