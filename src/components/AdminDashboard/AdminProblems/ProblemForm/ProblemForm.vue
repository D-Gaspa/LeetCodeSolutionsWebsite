<template>
  <div class="problem-form">
    <h4>{{ editingProblem ? 'Edit' : 'Add' }} Problem</h4>
    <form class="form-container" @submit.prevent="handleSubmit">
      <label>
        Problem Number:
        <input id="problem-number" v-model.number="problemForm.id" autocomplete="off" min="1" required step="1"
               type="number">
      </label>
      <label>
        Problem Name:
        <input id="problem-name" v-model="problemForm.name" autocomplete="off" required>
      </label>
      <label>
        Difficulty:
        <select id="problem-difficulty" v-model="problemForm.difficulty" autocomplete="off" required>
          <option v-for="option in DifficultyOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <label>
        Type:
        <select id="problem-type" v-model="problemForm.problem_type" autocomplete="off" required>
          <option v-for="option in ProblemTypeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <label v-if="problemForm.problem_type === 'daily'">
        Date:
        <CustomDatePicker v-model="problemForm.problem_date" class="date-picker" placeholder="mm/dd/yyyy" type="daily"/>
      </label>
      <div v-else class="weekly-form-options">
        <label>
          Month/Year:
          <CustomDatePicker v-model="problemForm.problem_date" class="date-picker" placeholder="mm/yyyy"
                            type="monthly"/>
        </label>
        <label>
          Week:
          <select v-model="weekNumber" required>
            <option v-for="option in WeekOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
      </div>
      <ProblemContentActions
          :has-content="!!problemForm.content?.text"
          @open-editor="openContentEditor"
          @delete-content="deleteContent"
      />
      <div class="form-actions-container">
        <div class="form-actions">
          <button class="btn-secondary btn-icon" type="submit">
            <Save class="icon"/>
            Save Problem
          </button>
          <button class="btn-danger btn-icon" type="button" @click="$emit('close')">
            <X class="icon"/>
            Cancel
          </button>
        </div>
      </div>
    </form>

    <BaseModal
        v-model="showContentEditor"
        :confirm-on-close="true"
        class="content-editor-modal"
        @close-attempt="handleCloseAttempt"
    >
      <h4>Edit Problem Content</h4>
      <ProblemContentEditor
          ref="contentEditorRef"
          v-model="problemForm.content"
          :initial-content="problemForm.content"
      />
      <div class="form-actions-container">
        <div class="form-actions">
          <button class="btn-secondary btn-icon" @click="saveContent">
            <Save class="icon"/>
            Save Content
          </button>
          <button class="btn-danger btn-icon" @click="handleCloseAttempt">
            <X class="icon"/>
            Close
          </button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import ProblemContentEditor from "@/components/AdminDashboard/AdminProblems/ProblemForm/ProblemContentEditor.vue"
import CustomDatePicker from "@/components/Common/CustomDatePicker.vue"
import BaseModal from "@/components/Common/BaseModal.vue"
import ProblemContentActions from "@/components/AdminDashboard/AdminProblems/ProblemForm/ProblemContentActions.vue"
import {useProblemForm} from "@/composables/AdminDashboard/AdminProblems/ProblemForm/useProblemForm"
import {useNotification} from "@/composables/Common/useNotification"
import {useConfirm} from "@/composables/Common/useConfirm"
import {MdContent, Problem} from '@/types/Problem'
import {Save, X} from 'lucide-vue-next'
import {DifficultyOptions, ProblemTypeOptions, WeekOptions} from '@/utils/problemUtils'

interface Props {
  editingProblem: Problem | null
}

const props = withDefaults(defineProps<Props>(), {
  editingProblem: null
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'problem-saved'): void
}>()

const {showNotification} = useNotification()
const {showConfirm} = useConfirm()

const {
  problemForm,
  weekNumber,
  hasUnsavedChanges,
  initializeForm,
  validateAndSaveProblem
} = useProblemForm(props.editingProblem)

const showContentEditor = ref(false)
const contentEditorRef = ref<InstanceType<typeof ProblemContentEditor> | null>(null)

const openContentEditor = () => {
  showContentEditor.value = true
}

const handleCloseAttempt = async () => {
  let shouldClose = true

  if (contentEditorRef.value && contentEditorRef.value.hasUnsavedChanges()) {
    shouldClose = await showConfirm(
        'Unsaved Changes',
        'Are you sure you want to close? Any unsaved changes will be lost.'
    )
  }

  if (shouldClose) {
    showContentEditor.value = false
  }
}

const saveContent = () => {
  if (contentEditorRef.value) {
    const newContent = contentEditorRef.value.getContent() as MdContent

    const hasChanges = contentEditorRef.value.hasUnsavedChanges()

    if (hasChanges) {
      problemForm.content = newContent
      showNotification('Content saved successfully', 'success')
    } else {
      showNotification('No changes to save', 'info')
    }
    showContentEditor.value = false
  } else {
    showNotification('Error saving content. Please try again.', 'error')
  }
}

const deleteContent = async () => {
  const confirmed = await showConfirm('Delete Content', 'Are you sure you want to delete the content?')
  if (confirmed) {
    problemForm.content = {text: '', images: []}
    showNotification('Content deleted successfully', 'success')
  }
}

const handleSubmit = async () => {
  const success = await validateAndSaveProblem()
  if (success) {
    emit('problem-saved')
    emit('close')
  }
}

onMounted(initializeForm)

defineExpose({
  hasUnsavedChanges
})
</script>

<style scoped>
input, select {
  width: 100%;
  box-sizing: border-box;
}

h4 {
  margin: 5px;
}

.form-container, .weekly-form-options {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.content-editor-modal :deep(.base-modal-content) {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: var(--border-radius);
  padding: var(--spacing-medium);
  width: 80%;
  max-width: 90vw;
  max-height: 90vh;
  transition: all var(--transition-base);
}

.form-actions-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.form-actions {
  margin: 0;
  display: flex;
  justify-content: center;
  gap: 10px;
}
</style>