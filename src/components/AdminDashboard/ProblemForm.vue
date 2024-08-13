<template>
  <div class="problem-form">
    <h4>{{ editingProblem ? 'Edit' : 'Add' }} Problem</h4>
    <form class="form-container" @submit.prevent="validateAndSaveProblem">
      <label>
        Problem Number:
        <input v-model.number="problemForm.id" min="1" required step="1" type="number">
      </label>
      <label>
        Problem Name:
        <input v-model="problemForm.name" required>
      </label>
      <label>
        Difficulty:
        <select v-model="problemForm.difficulty" required>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </label>
      <label>
        Type:
        <select v-model="problemForm.problem_type" required>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </label>
      <label v-if="problemForm.problem_type === 'daily'">
        Date:
        <CustomDatePicker v-model="problemForm.problem_date"
                          class="date-picker"
                          placeholder="mm/dd/yyyy"
                          type="daily"
        />
      </label>
      <div v-else class="weekly-form-options">
        <label>
          Month/Year:
          <CustomDatePicker v-model="problemForm.problem_date"
                            class="date-picker"
                            placeholder="mm/yyyy"
                            type="monthly"
          />
        </label>
        <label>
          Week:
          <select v-model="weekNumber" required>
            <option v-for="week in 5" :key="week" :value="week">Week {{ week }}</option>
          </select>
        </label>
      </div>
      <div>
        <div class="content-actions">
          <button class="btn-primary" type="button" @click="openContentEditor">
            {{ problemForm.content && problemForm.content.text ? 'Edit' : 'Add' }} Content
          </button>
          <button v-if="problemForm.content && problemForm.content.text" class="btn-danger" type="button"
                  @click="deleteContent">
            Delete Content
          </button>
        </div>
      </div>
      <div class="form-actions-container">
        <div class="form-actions">
          <button class="btn-secondary" type="submit">Save Problem</button>
          <button class="btn-danger" type="button" @click="$emit('close')">Cancel</button>
        </div>
      </div>
    </form>

    <BaseModal v-model="showContentEditor" class="content-editor-modal">
      <h4>Edit Problem Content</h4>
      <ContentEditor
          ref="contentEditorRef"
          v-model="problemForm.content"
          :initial-content="problemForm.content"
      />
      <div class="form-actions-container">
        <div class="form-actions">
          <button class="btn-secondary" @click="saveContent">Save Content</button>
          <button class="btn-danger" @click="closeContentEditor">Close</button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, reactive, ref} from 'vue'
import ContentEditor from './ContentEditor.vue'
import CustomDatePicker from "@/components/CustomDatePicker.vue"
import BaseModal from "@/components/BaseModal.vue"
import {useImageManagement} from '@/composables/AdminDashboard/useImageManagement'
import {useNotification} from "@/composables/useNotification"
import {useProblemStore} from "@/stores/problemsStore"
import {useConfirm} from "@/composables/useConfirm"
import type {MdImage, Problem, ProblemContent} from '@/types/Problem'

interface Props {
  editingProblem?: Problem
}

const props = withDefaults(defineProps<Props>(), {
  editingProblem: undefined
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'problem-saved'): void
}>()


const {showNotification, updateNotification} = useNotification()
const {areImagesChanged, handleImageManagement} = useImageManagement()
const {showConfirm} = useConfirm()

const problemStore = useProblemStore()
const showContentEditor = ref(false)
const contentEditorRef = ref<InstanceType<typeof ContentEditor> | null>(null)
const originalImages = ref<ProblemContent['images']>([])
const weekNumber = ref(1)

interface ProblemForm {
  id: number
  name?: string
  title?: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  problem_type: 'daily' | 'weekly'
  problem_date: string
  content: ProblemContent
}

const problemForm = reactive<ProblemForm>({
  id: 1,
  name: 'Test Problem',
  difficulty: 'Easy',
  problem_type: 'daily',
  problem_date: new Date().toISOString().split('T')[0],
  content: {
    text: '',
    images: []
  }
})

const initializeForm = () => {
  if (props.editingProblem) {
    problemForm.id = props.editingProblem.id
    const [_, ...nameParts] = props.editingProblem.title.split('.')
    problemForm.name = nameParts.join('.').trim()
    problemForm.difficulty = props.editingProblem.difficulty
    problemForm.problem_type = props.editingProblem.problem_type
    problemForm.problem_date = props.editingProblem.problem_date
    problemForm.content = {
      text: props.editingProblem.content.text || '',
      images: props.editingProblem.content.images || []
    }
    originalImages.value = props.editingProblem.content.images || []
    weekNumber.value = parseInt(props.editingProblem.problem_date.split('-')[2])
  }
}

const openContentEditor = () => {
  showContentEditor.value = true
}

const closeContentEditor = async () => {
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
    const newContent = contentEditorRef.value.getContent() as ProblemContent

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

const validateAndSaveProblem = async () => {
  // Validate problem number
  if (!Number.isInteger(problemForm.id) || problemForm.id < 1) {
    showNotification('Problem number must be a positive integer', 'warning')
    return
  }

  // Validate content
  if (!problemForm.content || !problemForm.content.text || problemForm.content.text.trim() === '') {
    showNotification('Problem content cannot be empty', 'warning')
    return
  }

  try {
    // Check if problem ID exists (for both new and edited problems)
    const existingProblem = await problemStore.checkProblemIdExists(problemForm.id)

    if (existingProblem && (!props.editingProblem || existingProblem.id !== props.editingProblem.id)) {
      showNotification('This problem number already exists. Please choose a different one.', 'warning')
      return
    }

    // If all validations pass, proceed with saving
    await saveProblem()
  } catch (error) {
    showNotification(`An error occurred while validating the problem number: ${(error as Error).message}`, 'error')
  }
}

const saveProblem = async () => {
  const notificationId = showNotification('Initializing problem save...', 'loading')

  try {
    const imagesChanged = areImagesChanged(problemForm.content.images || [], originalImages.value)

    if (imagesChanged) {
      updateNotification(notificationId, {message: 'Processing image changes...'})

      const result = await handleImageManagement(
          problemForm.content.images || [],
          originalImages.value,
          problemForm.id,
          problemForm.content.text || '',
          notificationId
      )

      if (!result.success) {
        updateNotification(notificationId, {
          message: result.error,
          type: 'error',
          isLoading: false,
        })
        return
      }

      // Update the problem form with the new content and images
      problemForm.content.text = result.updatedContent || problemForm.content.text
      problemForm.content.images = result.renamedImages as MdImage[]

      updateNotification(notificationId, {message: 'Image processing complete. Preparing to save problem...'})
    } else {
      updateNotification(notificationId, {message: 'No image changes detected. Preparing to save problem...'})
    }

    const formData = {...problemForm}

    if (formData.problem_type === 'daily') {
      // Ensure the date is in the correct format (YYYY-MM-DD)
      formData.problem_date = new Date(formData.problem_date).toISOString().split('T')[0]
    } else {
      // For weekly problems, format the date as YYYY-MM-W
      const [year, month] = formData.problem_date.split('-')
      formData.problem_date = `${year}-${month}-${weekNumber.value}`
    }

    formData.title = `${formData.id}. ${formData.name}`

    // Remove the separate name field and the file property from images
    delete formData.name
    formData.content.images = formData.content.images?.map(img => ({
      id: img.id,
      name: img.name,
      url: img.url
    }))

    updateNotification(notificationId, {message: 'Saving problem to database...'})

    const result = await problemStore.saveProblem(formData, !!props.editingProblem)

    if ('error' in result) {
      updateNotification(notificationId, {
        message: 'Error saving problem to database',
        type: 'error',
        isLoading: false,
      })
    } else {
      updateNotification(notificationId, {
        message: 'Problem saved successfully',
        type: 'success',
        isLoading: false,
      })
      emit('problem-saved')
      emit('close')
    }
  } catch (error) {
    updateNotification(notificationId, {
      message: `Unexpected error saving problem: ${(error as Error).message}`,
      type: 'error',
      isLoading: false,
    })
  }
}

onMounted(initializeForm)

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

.content-actions {
  margin-top: 5px;
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
  gap: 10px;
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