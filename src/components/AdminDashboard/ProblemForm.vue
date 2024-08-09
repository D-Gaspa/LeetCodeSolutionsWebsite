<template>
  <div class="problem-form">
    <h2>{{ editingProblem ? 'Edit' : 'Add' }} Problem</h2>
    <form @submit.prevent="validateAndSaveProblem">
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
        />
      </label>
      <label v-else>
        Week:
        <select v-model="problemForm.problem_week" required>
          <option v-for="week in 5" :key="week" :value="week">Week {{ week }}</option>
        </select>
      </label>
      <label v-if="problemForm.problem_type === 'weekly'">
        Year:
        <input v-model="problemForm.problem_year" required type="number">
      </label>
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

    <!-- Content Editor Modal -->
    <div v-if="showContentEditor" class="modal" @click.self="closeContentEditor">
      <div class="modal-content large">
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
      </div>
    </div>
  </div>
</template>

<script>
import {inject, onMounted, reactive, ref} from 'vue'

import ContentEditor from './ContentEditor.vue'
import {useImageManagement} from '@/composables/useImageManagement.js'
import {useProblemStore} from "@/stores/problemsStore.js";
import CustomDatePicker from "@/components/CustomDatePicker.vue";

export default {
  name: 'ProblemForm',
  components: {CustomDatePicker, ContentEditor},
  props: {
    editingProblem: Object,
  },
  emits: ['close', 'problem-saved'],
  setup(props, {emit}) {
    const showNotification = inject('showNotification')
    const updateNotification = inject('updateNotification')
    const showConfirm = inject('showConfirm')
    const problemStore = useProblemStore()
    const {areImagesChanged, handleImageManagement} = useImageManagement()
    const showContentEditor = ref(false)
    const contentEditorRef = ref(null)
    const editingProblem = ref(props.editingProblem)
    const originalImages = ref([])

    const problemForm = reactive({
      id: 1,
      name: 'Test Problem',
      difficulty: 'Easy',
      problem_type: 'daily',
      problem_date: new Date().toISOString().split('T')[0],
      problem_week: 1,
      problem_year: new Date().getFullYear(),
      content: {}
    })

    const initializeForm = () => {
      if (props.editingProblem) {
        Object.assign(problemForm, props.editingProblem)
        const [id, ...nameParts] = props.editingProblem.title.split('.')
        problemForm.id = parseInt(id)
        problemForm.name = nameParts.join('.').trim()
        originalImages.value = props.editingProblem.content.images || []
      }
    }

    const openContentEditor = () => {
      showContentEditor.value = true
    }

    const closeContentEditor = async () => {
      let shouldClose = true;

      if (contentEditorRef.value && contentEditorRef.value.hasUnsavedChanges()) {
        shouldClose = await showConfirm(
            'Unsaved Changes',
            'Are you sure you want to close? Any unsaved changes will be lost.'
        );
      }

      if (shouldClose) {
        showContentEditor.value = false;
      }
    };

    const saveContent = () => {
      if (contentEditorRef.value) {
        const newContent = contentEditorRef.value.getContent()

        const hasChanges = contentEditorRef.value.hasUnsavedChanges()

        if (hasChanges) {
          problemForm.content = newContent;
          showNotification('Content saved successfully', 'success');
        } else {
          showNotification('No changes to save', 'info');
        }
        showContentEditor.value = false;
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
        showNotification('An error occurred while validating the problem number: ' + error.message, 'error')
      }
    }

    const saveProblem = async () => {
      const notificationId = showNotification('Initializing problem save...', 'loading', {isLoading: true})

      try {
        const imagesChanged = areImagesChanged(problemForm.content.images, originalImages.value)

        if (imagesChanged) {
          updateNotification(notificationId, {message: 'Processing image changes...'})

          const result = await handleImageManagement(
              problemForm.content.images,
              originalImages.value,
              problemForm.id,
              problemForm.content.text,
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
          problemForm.content.text = result.updatedContent
          problemForm.content.images = result.renamedImages

          updateNotification(notificationId, {message: 'Image processing complete. Preparing to save problem...'})
        } else {
          updateNotification(notificationId, {message: 'No image changes detected. Preparing to save problem...'})
        }

        const formData = {...problemForm}

        if (formData.problem_type === 'daily') {
          formData.problem_year = new Date(formData.problem_date).getFullYear()
          formData.problem_week = null
        } else {
          formData.problem_date = null
        }

        formData.title = `${formData.id}. ${formData.name}`

        // Remove the separate name field and the file property from images
        delete formData.name
        formData.content.images = formData.content.images.map(img => ({
          id: img.id,
          name: img.name,
          url: img.url
        }))

        updateNotification(notificationId, {message: 'Saving problem to database...'})

        const result = await problemStore.saveProblem(formData, !!editingProblem.value)

        if (result.error) {
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
          message: `Unexpected error saving problem: ${error.message}`,
          type: 'error',
          isLoading: false,
        })
      }
    }

    onMounted(initializeForm)

    return {
      problemForm,
      showContentEditor,
      contentEditorRef,
      editingProblem,
      openContentEditor,
      closeContentEditor,
      saveContent,
      deleteContent,
      validateAndSaveProblem
    }
  }
}
</script>

<style scoped>
.problem-form {
  background-color: var(--bg-color-secondary);
  border: var(--border-width) solid var(--border-color-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-small);
  padding: 1rem;
}

h4 {
  margin: 5px;
}

.content-actions {
  margin-top: 5px;
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

.modal-content.large {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: var(--bg-color-secondary);
  border: var(--border-width) solid var(--border-color-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-small);
  padding: 1rem;
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