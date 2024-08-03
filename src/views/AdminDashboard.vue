<template>
  <div class="admin-dashboard">
    <h1>Admin Dashboard</h1>

    <ProblemList
        :problems="problems"
        @add="openProblemForm"
        @delete="confirmDeleteProblem"
        @edit="editProblem"
        @search="handleSearch"
        @add-solution="openSolutionForm"
    />

    <!-- Problem Form Modal -->
    <div v-if="showProblemForm" class="modal" @click.self="closeProblemForm">
      <div class="modal-content">
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
            <input v-model="problemForm.problem_date" required type="date">
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
            <button type="button" @click="openContentEditor">
              {{ problemForm.content && problemForm.content.text ? 'Edit' : 'Add' }} Content
            </button>
            <button v-if="problemForm.content && problemForm.content.text" type="button" @click="deleteContent">
              Delete Content
            </button>
          </div>
          <div class="form-actions">
            <button type="submit">Save Problem</button>
            <button type="button" @click="closeProblemForm">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Solution Form Modal -->
    <div v-if="showSolutionForm" class="modal" @click.self="showSolutionForm = false">
      <div class="modal-content">
        <h2>{{ editingSolution ? 'Edit' : 'Add' }} Solution</h2>
        <form @submit.prevent="saveSolution">
          <label>
            Approach Name:
            <input v-model="solutionForm.approach_name" required>
          </label>
          <label>
            Code:
            <textarea v-model="solutionForm.code" required></textarea>
          </label>
          <label>
            Explanation:
            <markdown-editor v-model="solutionForm.explanation"></markdown-editor>
          </label>
          <label>
            Time Complexity:
            <input v-model="solutionForm.time_complexity">
          </label>
          <label>
            Space Complexity:
            <input v-model="solutionForm.space_complexity">
          </label>
          <div class="form-actions">
            <button type="submit">Save Solution</button>
            <button type="button" @click="showSolutionForm = false">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Content Editor Modal -->
    <div v-if="showContentEditor" class="modal" @click.self="closeContentEditor">
      <div class="modal-content large">
        <h2>Edit Problem Content</h2>
        <markdown-editor
            ref="markdownEditor"
            :initialContent="problemForm.content"
            :modelValue="problemForm.content"
        ></markdown-editor>
        <div class="form-actions">
          <button @click="saveContent">Save Content</button>
          <button @click="closeContentEditor">Close</button>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <ConfirmDialog
        ref="confirmDialog"
        v-model:show="showConfirmDialog"
        @confirm="deleteProblem"
        @dismiss="showConfirmDialog = false"
    />
  </div>
</template>

<script>
import {inject, onMounted, reactive, ref} from 'vue'
import {supabase} from '../services/supabase'
import MarkdownEditor from '../components/AdminDashboard/MarkdownEditor.vue'
import ProblemList from "@/components/AdminDashboard/ProblemList.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";

export default {
  name: 'AdminDashboard',
  components: {
    ConfirmDialog,
    ProblemList,
    MarkdownEditor
  },
  setup() {
    const showNotification = inject('showNotification')
    const updateNotification = inject('updateNotification')
    const showConfirmDialog = ref(false)
    const confirmDialog = ref(null)
    const problems = ref([])
    const showProblemForm = ref(false)
    const showSolutionForm = ref(false)
    const showContentEditor = ref(false)
    const editingProblem = ref(null)
    const editingSolution = ref(null)
    const problemToDelete = ref(null)
    const searchQuery = ref('')
    const difficultyFilter = ref('')
    const typeFilter = ref('')
    const dateFilter = ref('')
    const currentPage = ref(1)
    const markdownEditor = ref(null)
    const originalImages = ref([])

    const problemForm = reactive({
      id: null,
      name: '',
      difficulty: 'Easy',
      problem_type: 'daily',
      problem_date: '',
      problem_week: 1,
      problem_year: new Date().getFullYear(),
      content: {}
    })

    const solutionForm = reactive({
      problem_id: null,
      approach_name: '',
      code: '',
      explanation: {},
      time_complexity: '',
      space_complexity: ''
    })

    const fetchProblems = async (filters = {}) => {
      let query = supabase
          .from('problems')
          .select('*')
          .order('created_at', {ascending: false})

      if (filters.query) {
        query = query.ilike('title', `%${filters.query}%`)
      }
      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty)
      }
      if (filters.type) {
        query = query.eq('problem_type', filters.type)
      }
      if (filters.date) {
        query = query.eq('problem_date', filters.date)
      }

      const {data, error} = await query

      if (error) {
        showNotification('An error occurred while fetching problems', 'error')
      } else problems.value = data
    }

    const handleSearch = (filters) => {
      fetchProblems(filters)
    }

    const openProblemForm = () => {
      originalImages.value = problemForm.content.images || []
      showProblemForm.value = true
    }

    const closeProblemForm = () => {
      showProblemForm.value = false
      editingProblem.value = null
      clearProblemForm()
      originalImages.value = []
    }

    const editProblem = (problem) => {
      editingProblem.value = problem
      const [id, ...nameParts] = problem.title.split('.')

      Object.assign(problemForm, {
        ...problem,
        id: parseInt(id),
        name: nameParts.join('.').trim(),
      })
      openProblemForm()
    }

    const confirmDeleteProblem = (problem) => {
      problemToDelete.value = problem
      confirmDialog.value.open(
          "Confirm Delete",
          `Are you sure you want to delete the problem "${problem.title}"?`
      )
    }

    const deleteProblem = async () => {
      if (!problemToDelete.value) return

      const notificationId = showNotification('Initializing problem deletion...', 'loading', {isLoading: true})

      try {
        // Fetch problem data
        updateNotification(notificationId, {
          message: 'Fetching problem data...'
        })

        const {data: problemData, error: problemError} = await supabase
            .from('problems')
            .select('content')
            .eq('id', problemToDelete.value.id)
            .single()

        if (problemError) {
          updateNotification(notificationId, {
            message: `Error fetching problem data: ${problemError.message}`,
            type: 'error',
            isLoading: false,
            duration: 3000
          })
          return
        }

        const content = problemData.content
        const imagesToDelete = content.images || []

        // Delete the problem from the database
        updateNotification(notificationId, {
          message: 'Deleting problem from database...'
        })

        const {error: deleteError} = await supabase
            .from('problems')
            .delete()
            .eq('id', problemToDelete.value.id)

        if (deleteError) {
          updateNotification(notificationId, {
            message: `Error deleting problem from database: ${deleteError.message}`,
            type: 'error',
            isLoading: false,
            duration: 3000
          })
          return
        }

        // Delete images associated with the problem
        if (imagesToDelete.length > 0) {
          updateNotification(notificationId, {
            message: `Deleting ${imagesToDelete.length} associated image(s)...`
          })

          const deleteImageResults = await Promise.all(
              imagesToDelete.map(image => deleteImageFromStorage(image.name))
          )

          const failedDeletes = deleteImageResults.filter(result => !result.success)
          if (failedDeletes.length > 0) {
            updateNotification(notificationId, {
              message: `Error deleting ${failedDeletes.length} image(s). Problem deleted, but some images may remain.`,
              type: 'warning',
              isLoading: false,
              duration: 5000
            })
            console.error('Failed image deletes:', failedDeletes)
          } else {
            updateNotification(notificationId, {
              message: 'All associated images deleted successfully'
            })
          }
        }

        // Refresh the problem list
        updateNotification(notificationId, {
          message: 'Refreshing problems list...'
        })

        await fetchProblems()

        // Clean up
        showConfirmDialog.value = false
        problemToDelete.value = null

        // Final success notification
        updateNotification(notificationId, {
          message: 'Problem and associated images deleted successfully',
          type: 'success',
          isLoading: false,
          duration: 3000
        })
      } catch (error) {
        updateNotification(notificationId, {
          message: `Unexpected error during problem deletion: ${error.message}`,
          type: 'error',
          isLoading: false,
          duration: 3000
        })
      }
    }


    const openContentEditor = () => {
      showContentEditor.value = true
    }

    const closeContentEditor = () => {
      let unsavedChanges = false

      if (markdownEditor.value) {
        const newContent = markdownEditor.value.getContent()
        unsavedChanges = newContent.text !== problemForm.content.text
            || newContent.images.length !== problemForm.content.images.length
      }

      if (!unsavedChanges || confirm('Are you sure you want to close? Any unsaved changes will be lost.')) {
        showContentEditor.value = false
      }
    }

    const updateContent = (newContent) => {
      problemForm.content = newContent
    }

    const saveContent = () => {
      let unsavedChanges = false

      if (markdownEditor.value) {
        const newContent = markdownEditor.value.getContent()

        unsavedChanges = newContent.text !== problemForm.content.text
            || newContent.images.length !== problemForm.content.images.length

        if (!unsavedChanges) {
          showContentEditor.value = false
          return
        }

        problemForm.content = {
          text: newContent.text,
          images: newContent.images
        }
        showContentEditor.value = false

        showNotification('Content saved successfully', 'success')
      } else {
        showNotification('An error occurred while saving the content', 'error')
      }
    }

    const deleteContent = () => {
      if (confirm('Are you sure you want to delete the content?')) {
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

      // Check if problem ID exists (for both new and edited problems)
      const {data, error} = await supabase
          .from('problems')
          .select('id')
          .eq('id', problemForm.id)

      if (error) {
        showNotification('An error occurred while validating the problem number', 'error')
        return
      }

      if (data && data.length > 0 && (!editingProblem.value || data[0].id !== editingProblem.value.id)) {
        showNotification('This problem number already exists. Please choose a different one.', 'warning')
        return
      }

      // If all validations pass, proceed with saving
      await saveProblem()
    }

    const saveProblem = async () => {
      const notificationId = showNotification('Initializing problem save...', 'loading', {isLoading: true})

      try {
        const imagesChanged = areImagesChanged(problemForm.content.images, originalImages.value)

        if (imagesChanged) {
          updateNotification(notificationId, {
            message: 'Processing image changes...'
          })

          const result = await handleImageManagement(
              problemForm.content.images,
              problemForm.id,
              problemForm.content.text,
              notificationId
          )

          if (!result.success) {
            updateNotification(notificationId, {
              message: result.error,
              type: 'error',
              isLoading: false,
              duration: 3000
            })
            return
          }

          // Update the problem form with the new content and images
          problemForm.content.text = result.updatedContent
          problemForm.content.images = result.renamedImages

          updateNotification(notificationId, {
            message: 'Image processing complete. Preparing to save problem...'
          })
        } else {
          updateNotification(notificationId, {
            message: 'No image changes detected. Preparing to save problem...'
          })
        }

        const formData = {...problemForm}

        if (formData.problem_type === 'daily') {
          formData.problem_year = new Date(formData.problem_date).getFullYear()
          formData.problem_week = null
        } else {
          formData.problem_date = null
        }

        // Combine problem number and name into title
        formData.title = `${formData.id}. ${formData.name}`

        // Remove the separate name field and the file property from images
        delete formData.name
        formData.content.images = formData.content.images.map(img => ({
          id: img.id,
          name: img.name,
          url: img.url
        }))

        updateNotification(notificationId, {
          message: 'Saving problem to database...'
        })

        // Save problem
        const {error} = editingProblem.value
            ? await supabase
                .from('problems')
                .update(formData)
                .eq('id', editingProblem.value.id)
            : await supabase
                .from('problems')
                .insert([formData])

        if (error) {
          updateNotification(notificationId, {
            message: 'Error saving problem to database',
            type: 'error',
            isLoading: false,
            duration: 3000
          })
        } else {
          updateNotification(notificationId, {
            message: 'Problem saved successfully. Refreshing problem list...'
          })

          await fetchProblems()

          updateNotification(notificationId, {
            message: 'Problem saved and list refreshed successfully',
            type: 'success',
            isLoading: false,
            duration: 3000
          })
          closeProblemForm()
        }
      } catch (error) {
        updateNotification(notificationId, {
          message: `Unexpected error saving problem: ${error.message}`,
          type: 'error',
          isLoading: false,
          duration: 3000
        })
      }
    }

    const areImagesChanged = (newImages, originalImages) => {
      if (newImages.length !== originalImages.length) return true
      return newImages.some((newImg, index) => {
        const origImg = originalImages[index]
        return newImg.id !== origImg.id || newImg.name !== origImg.name || newImg.url !== origImg.url
      })
    }


    const handleImageManagement = async (currentImages, problemNumber, content, notificationId) => {
      // Order the current images based on their appearance in the content
      const orderedCurrentImages = getOrderedImages(content, currentImages)

      const imagesToDelete = originalImages.value.filter(
          orig => !orderedCurrentImages.some(curr => curr.url === orig.url)
      )

      if (imagesToDelete.length > 0) {
        updateNotification(notificationId, {
          message: `Deleting ${imagesToDelete.length} removed image(s)...`
        })

        // Delete removed images
        for (const image of imagesToDelete) {
          const deleteResult = await deleteImageFromStorage(image.name)
          if (!deleteResult.success) {
            return {success: false, error: deleteResult.error}
          }
        }

        updateNotification(notificationId, {
          message: 'Removed images deleted successfully. Processing remaining images...'
        })
      }

      // Rename and upload all images (existing and new) based on their new order
      updateNotification(notificationId, {
        message: `Processing ${orderedCurrentImages.length} image(s)...`
      })

      const renameResult = await renameAndUploadImages(orderedCurrentImages, problemNumber, content, notificationId)
      if (!renameResult.success) {
        return {success: false, error: renameResult.error}
      }

      updateNotification(notificationId, {
        message: 'Image processing completed successfully'
      })

      return {
        success: true,
        renamedImages: renameResult.renamedImages,
        updatedContent: renameResult.updatedContent
      }
    }

    const getOrderedImages = (content, images) => {
      const imageRegex = /!\[([^\]]*)]\(([^)]+)\)/g
      const orderedImages = []
      let match

      while ((match = imageRegex.exec(content)) !== null) {
        const [, , src] = match
        const image = images.find(img => img.id === src || img.url === src)
        if (image && !orderedImages.includes(image)) {
          orderedImages.push(image)
        }
      }
      return orderedImages
    }

    const deleteImageFromStorage = async (imageName) => {
      const {error} = await supabase.storage
          .from('problem-images')
          .remove([imageName])

      if (error) {
        return {success: false, error: `Error deleting image ${imageName}: ${error.message}`}
      }
      return {success: true}
    }

    const renameAndUploadImages = async (orderedImages, problemNumber, content, notificationId) => {
      const renamedImages = []
      let imageCounter = 1
      let updatedContent = content

      for (const image of orderedImages) {
        const fileExtension = image.name.split('.').pop()
        const newFileName = `${problemNumber}-problem-${imageCounter}.${fileExtension}`

        let newUrl

        if (image.name !== newFileName) {
          if (image.file instanceof File) {
            // Upload new image
            const uploadResult = await uploadNewImage(image.file, newFileName)
            if (!uploadResult.success) {
              updateNotification(notificationId, {
                message: uploadResult.error,
                type: 'error',
                isLoading: false,
                duration: 3000
              })
              return {success: false, error: uploadResult.error}
            }
          } else {
            // Rename existing image
            const renameResult = await renameExistingImage(image.name, newFileName)
            if (!renameResult.success) {
              updateNotification(notificationId, {
                message: renameResult.error,
                type: 'error',
                isLoading: false,
                duration: 3000
              })
              return {success: false, error: renameResult.error}
            }
          }

          // Get the public URL for the new or renamed image
          const urlResult = await getPublicUrl(newFileName)
          if (!urlResult.success) {
            updateNotification(notificationId, {
              message: urlResult.error,
              type: 'error',
              isLoading: false,
              duration: 3000
            })
            return {success: false, error: urlResult.error}
          }
          newUrl = urlResult.url

          // Update content
          try {
            if (image.file instanceof File) {
              let newImagePattern = new RegExp(`!\\[([^\\]]*)]\\(${escapeRegExp(image.id)}\\)`, 'g')
              updatedContent = updatedContent.replace(newImagePattern, `![${newFileName}](${newUrl})`)
            } else {
              let existingImagePattern = new RegExp(`!\\[([^\\]]*)]\\(${escapeRegExp(image.url)}\\)`, 'g')
              updatedContent = updatedContent.replace(existingImagePattern, `![${newFileName}](${newUrl})`)
            }
          } catch (error) {
            updateNotification(notificationId, {
              message: 'Error updating content',
              type: 'error',
              isLoading: false,
              duration: 3000
            })
            return {success: false, error: 'Error updating content'}
          }
        } else {
          newUrl = image.url // Keep the existing URL if the image name hasn't changed
        }

        renamedImages.push({
          id: newFileName,
          name: newFileName,
          url: newUrl,
          file: image.file // Preserve the file object for new images
        })

        imageCounter++
      }

      return {success: true, renamedImages, updatedContent}
    }

    const uploadNewImage = async (file, fileName) => {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const {error} = await supabase.storage
            .from('problem-images')
            .upload(fileName, arrayBuffer, {
              contentType: file.type,
              cacheControl: '3600',
              upsert: true
            })

        if (error) {
          return {success: false, error: 'Error uploading image'}
        }
        return {success: true}
      } catch (error) {
        return {success: false, error: 'Error uploading image'}
      }
    }

    const renameExistingImage = async (oldName, newName) => {
      try {
        const {error} = await supabase.storage
            .from('problem-images')
            .move(oldName, newName)

        if (error) {
          return {success: false, error: 'Error renaming image'}
        }
        return {success: true}
      } catch (error) {
        return {success: false, error: 'Error renaming image'}
      }
    }

    const getPublicUrl = async (fileName) => {
      try {
        const {data: urlData, error} = supabase.storage
            .from('problem-images')
            .getPublicUrl(fileName)
        if (error) {
          return {success: false, error: 'Error getting public URL'}
        }
        return {success: true, url: urlData.publicUrl}
      } catch (error) {
        return {success: false, error: 'Error getting public URL'}
      }
    }

    function escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    const saveSolution = async () => {
      const {error} = editingSolution.value
          ? await supabase
              .from('solutions')
              .update(solutionForm)
              .eq('id', editingSolution.value.id)
          : await supabase
              .from('solutions')
              .insert([solutionForm])

      if (error) console.error('Error saving solution:', error)
      else {
        showSolutionForm.value = false
        editingSolution.value = null
        clearSolutionForm()
      }
    }

    const openSolutionForm = (problem) => {
      solutionForm.problem_id = problem.id
      showSolutionForm.value = true
    }

    const clearProblemForm = () => {
      problemForm.id = null
      problemForm.name = ''
      problemForm.difficulty = 'Easy'
      problemForm.problem_type = 'daily'
      problemForm.problem_date = ''
      problemForm.problem_week = 1
      problemForm.problem_year = new Date().getFullYear()
      problemForm.content = {}
    }

    const clearSolutionForm = () => {
      solutionForm.problem_id = null
      solutionForm.approach_name = ''
      solutionForm.code = ''
      solutionForm.explanation = {}
      solutionForm.time_complexity = ''
      solutionForm.space_complexity = ''
    }

    onMounted(fetchProblems)

    return {
      problems,
      showProblemForm,
      showSolutionForm,
      showContentEditor,
      showConfirmDialog,
      confirmDialog,
      editingProblem,
      editingSolution,
      problemForm,
      solutionForm,
      searchQuery,
      difficultyFilter,
      typeFilter,
      dateFilter,
      currentPage,
      markdownEditor,
      handleSearch,
      openProblemForm,
      editProblem,
      saveProblem,
      validateAndSaveProblem,
      confirmDeleteProblem,
      deleteProblem,
      closeProblemForm,
      openContentEditor,
      updateContent,
      saveContent,
      deleteContent,
      closeContentEditor,
      openSolutionForm,
      saveSolution,
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  max-width: 500px;
  width: 100%;
}

.modal-content.large {
  max-width: 90%;
  width: 90%;
  height: 90%;
}

form {
  display: flex;
  flex-direction: column;
}

label {
  margin-bottom: 10px;
}

input, select, textarea {
  resize: none;
  box-sizing: border-box;
  width: 100%;
  padding: 5px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.form-actions button {
  margin-left: 10px;
}

</style>