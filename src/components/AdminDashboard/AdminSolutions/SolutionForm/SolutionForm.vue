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

    <SolutionContentActions
        :form="form"
        :has-code="!!form.code"
        @open-code-editor="openCodeEditor"
        @delete-code="deleteCode"
        @open-content-editor="openContentEditor"
        @delete-content="deleteContent"
    />

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
import {computed, ref} from 'vue'
import {Save, X} from 'lucide-vue-next'
import SolutionContentEditorModal from './SolutionContentEditorModal.vue'
import BaseModal from "@/components/Common/BaseModal.vue"
import PythonCodeEditor from "@/components/Common/PythonCodeEditor.vue"
import SolutionContentActions from "@/components/AdminDashboard/AdminSolutions/SolutionForm/SolutionContentActions.vue";
import {useSolutionForm} from "@/composables/AdminDashboard/AdminSolutions/SolutionForm/useSolutionForm";
import {useNotification} from '@/composables/Common/useNotification'
import {useConfirm} from '@/composables/Common/useConfirm'
import {useTheme} from '@/composables/Common/useTheme'
import {getLabel} from '@/utils/solutionUtils'
import type {MdContentNoImages, Solution, SolutionFormType} from '@/types/Problem'

const props = defineProps<{
  problemId: number
  editingSolution?: Solution
}>()

const emit = defineEmits<{
  (e: 'solution-saved'): void
  (e: 'cancel'): void
}>()

const {form, hasUnsavedChanges, handleSubmit: submitForm} = useSolutionForm(props.problemId, props.editingSolution)
const {showNotification} = useNotification()
const {showConfirm} = useConfirm()
const {theme} = useTheme()

const showCodeEditor = ref(false)
const currentTheme = computed(() => theme.value === 'dark' ? 'dark' : 'light')
const codeEditorRef = ref<InstanceType<typeof PythonCodeEditor> | null>(null)
const showContentEditor = ref(false)
const currentEditingField = ref<keyof SolutionFormType | null>(null)
const isEditing = computed(() => !!props.editingSolution)

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

const currentContentLabel = computed(() =>
    currentEditingField.value ? getLabel(currentEditingField.value) : 'Solution Content'
)

const openCodeEditor = () => {
  showCodeEditor.value = true
}

const openContentEditor = (field: keyof SolutionFormType) => {
  currentEditingField.value = field
  showContentEditor.value = true
}

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
  const success = await submitForm()
  if (success) {
    emit('solution-saved')
  }
}

defineExpose({
  hasUnsavedChanges
})
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