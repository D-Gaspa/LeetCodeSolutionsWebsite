<template>
  <div class="admin-dashboard">
    <h1>Admin Dashboard</h1>

    <!-- Search, Filters, and Add Problem -->
    <div class="dashboard-header">
      <div class="search-filters">
        <input
            v-model="searchQuery"
            placeholder="Search problems..."
            @input="debouncedSearch"
        >
        <select v-model="difficultyFilter">
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <select v-model="typeFilter">
          <option value="">All Types</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        <input
            v-model="dateFilter"
            placeholder="Filter by date"
            type="date"
        >
      </div>
      <button class="add-problem-btn" @click="showProblemForm = true">Add New Problem</button>
    </div>

    <!-- Problem List -->
    <table>
      <thead>
      <tr>
        <th>Title</th>
        <th>Difficulty</th>
        <th>Type</th>
        <th>Date/Week</th>
        <th>Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="problem in paginatedProblems" :key="problem.id">
        <td>{{ problem.title }}</td>
        <td>{{ problem.difficulty }}</td>
        <td>{{ problem.problem_type }}</td>
        <td>
          {{
            problem.problem_type === 'daily'
                ? formatDate(problem.problem_date)
                : `Week ${problem.problem_week}, ${problem.problem_year}`
          }}
        </td>
        <td>
          <button @click="editProblem(problem)">Edit</button>
          <button @click="confirmDeleteProblem(problem)">Delete</button>
          <button @click="openSolutionForm(problem)">Add Solution</button>
        </td>
      </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div class="pagination">
      <button :disabled="currentPage === 1" @click="currentPage--">Previous</button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
    </div>

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
          <p v-if="formError" class="error-message">{{ formError }}</p>
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
            :modelValue="tempContent"
        ></markdown-editor>
        <div class="form-actions">
          <button @click="saveContent">Save Content</button>
          <button @click="closeContentEditor">Close</button>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <div v-if="showConfirmDialog" class="modal">
      <div class="modal-content">
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete this problem?</p>
        <div class="form-actions">
          <button @click="deleteProblem">Yes, Delete</button>
          <button @click="showConfirmDialog = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {computed, onMounted, reactive, ref, watch} from 'vue'
import {supabase} from '../services/supabase'
import debounce from 'lodash/debounce'
import MarkdownEditor from '../components/MarkdownEditor.vue'

export default {
  name: 'AdminDashboard',
  components: {
    MarkdownEditor
  },
  setup() {
    const problems = ref([])
    const showProblemForm = ref(false)
    const showSolutionForm = ref(false)
    const showContentEditor = ref(false)
    const showConfirmDialog = ref(false)
    const editingProblem = ref(null)
    const editingSolution = ref(null)
    const problemToDelete = ref(null)
    const searchQuery = ref('')
    const difficultyFilter = ref('')
    const typeFilter = ref('')
    const dateFilter = ref('')
    const currentPage = ref(1)
    const itemsPerPage = 10
    const formError = ref('')
    const tempContent = ref({text: '', images: []})
    const markdownEditor = ref(null)

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

    const openContentEditor = () => {
      tempContent.value = JSON.parse(JSON.stringify(problemForm.content))
      showContentEditor.value = true
    }

    const closeContentEditor = () => {
      if (confirm('Are you sure you want to close? Any unsaved changes will be lost.')) {
        showContentEditor.value = false
      }
    }

    const updateTempContent = (newContent) => {
      tempContent.value = newContent
    }

    const updateContent = (newContent) => {
      problemForm.content = newContent
    }

    const saveContent = () => {
      if (markdownEditor.value) {
        const newContent = markdownEditor.value.getContent()
        problemForm.content = JSON.parse(JSON.stringify(newContent))
        showContentEditor.value = false
      } else {
        console.error('Markdown editor reference not found')
      }
    }

    const deleteContent = () => {
      if (confirm('Are you sure you want to delete the content?')) {
        problemForm.content = {text: '', images: []}
      }
    }

    const handleImageSave = async (images) => {
      const uploadedImages = []
      for (const image of images) {
        if (image.file) {  // Only upload new images
          const {data, error} = await supabase.storage
              .from('problem-images')
              .upload(`${Date.now()}_${image.name}`, image.file)

          if (error) {
            console.error('Error uploading image:', error)
            continue
          }

          const {publicURL, error: urlError} = supabase.storage
              .from('problem-images')
              .getPublicUrl(data.path)

          if (urlError) {
            console.error('Error getting public URL:', urlError)
            continue
          }

          uploadedImages.push({
            name: image.name,
            url: publicURL
          })
        } else {
          uploadedImages.push(image)  // Keep existing images
        }
      }
      return uploadedImages
    }

    const validateAndSaveProblem = async () => {
      formError.value = ''

      // Validate problem number
      if (!Number.isInteger(problemForm.id) || problemForm.id < 1) {
        formError.value = 'Problem number must be a positive integer.'
        return
      }

      // Validate content
      if (!problemForm.content || !problemForm.content.text || problemForm.content.text.trim() === '') {
        formError.value = 'Problem content cannot be empty.'
        return
      }

      // Check if problem ID exists (for both new and edited problems)
      const {data} = await supabase
          .from('problems')
          .select('id')
          .eq('id', problemForm.id)
          .single()

      if (data && (!editingProblem.value || data.id !== editingProblem.value.id)) {
        formError.value = 'This problem number already exists. Please choose a different one.'
        return
      }

      // If all validations pass, proceed with saving
      await saveProblem()
    }

    const debouncedSearch = debounce(() => {
      fetchProblems()
    }, 300)

    const fetchProblems = async () => {
      let query = supabase
          .from('problems')
          .select('*')
          .order('created_at', {ascending: false})

      if (searchQuery.value) {
        query = query.ilike('title', `%${searchQuery.value}%`)
      }

      if (difficultyFilter.value) {
        query = query.eq('difficulty', difficultyFilter.value)
      }

      if (typeFilter.value) {
        query = query.eq('problem_type', typeFilter.value)
      }

      if (dateFilter.value) {
        query = query.eq('problem_date', dateFilter.value)
      }

      const {data, error} = await query

      if (error) console.error('Error fetching problems:', error)
      else problems.value = data
    }

    const searchProblems = () => {
      currentPage.value = 1 // Reset to first page when searching
    }

    const filteredProblems = computed(() => {
      return problems.value.filter(problem =>
          problem.title.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    })

    const totalPages = computed(() => Math.ceil(filteredProblems.value.length / itemsPerPage))

    const paginatedProblems = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return filteredProblems.value.slice(start, end)
    })

    const closeProblemForm = () => {
      showProblemForm.value = false
      editingProblem.value = null
      clearProblemForm()
      formError.value = ''
    }

    const editProblem = (problem) => {
      editingProblem.value = problem
      const [id, ...nameParts] = problem.title.split('.')

      Object.assign(problemForm, {
        ...problem,
        id: parseInt(id),
        name: nameParts.join('.').trim(),
      })
      showProblemForm.value = true
    }

    const saveProblem = async () => {
      // Handle image uploads
      const uploadedImages = await handleImageUploads(problemForm.content.images)

      // Update image URLs in the content
      problemForm.content.text = updateImageUrls(problemForm.content.text, uploadedImages)
      problemForm.content.images = uploadedImages

      // Save problem
      const {error} = editingProblem.value
          ? await supabase
              .from('problems')
              .update(problemForm)
              .eq('id', editingProblem.value.id)
          : await supabase
              .from('problems')
              .insert([problemForm])

      if (error) {
        console.error('Error saving problem:', error)
        formError.value = 'An error occurred while saving the problem. Please try again.'
      } else {
        await fetchProblems()
        closeProblemForm()
      }
    }

    const handleImageUploads = async (images) => {
      const uploadedImages = []
      for (const image of images) {
        if (image.file) {  // Only upload new images
          const {data, error} = await supabase.storage
              .from('problem-images')
              .upload(`${Date.now()}_${image.name}`, image.file)

          if (error) {
            console.error('Error uploading image:', error)
            continue
          }

          const {publicURL, error: urlError} = supabase.storage
              .from('problem-images')
              .getPublicUrl(data.path)

          if (urlError) {
            console.error('Error getting public URL:', urlError)
            continue
          }

          uploadedImages.push({
            id: image.id,
            name: image.name,
            url: publicURL
          })
        } else {
          uploadedImages.push(image)  // Keep existing images
        }
      }
      return uploadedImages
    }

    const updateImageUrls = (content, uploadedImages) => {
      let updatedContent = content
      uploadedImages.forEach(image => {
        const regex = new RegExp(`\\]\\(${image.id}\\)`, 'g')
        updatedContent = updatedContent.replace(regex, `](${image.url})`)
      })
      return updatedContent
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

    const confirmDeleteProblem = (problem) => {
      problemToDelete.value = problem
      showConfirmDialog.value = true
    }

    const deleteProblem = async () => {
      if (!problemToDelete.value) return

      const {error} = await supabase
          .from('problems')
          .delete()
          .eq('id', problemToDelete.value.id)

      if (error) console.error('Error deleting problem:', error)
      else {
        await fetchProblems()
        showConfirmDialog.value = false
        problemToDelete.value = null
      }
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})
    }

    watch([difficultyFilter, typeFilter, dateFilter], fetchProblems)

    onMounted(fetchProblems)

    return {
      problems,
      showProblemForm,
      showSolutionForm,
      showConfirmDialog,
      problemForm,
      solutionForm,
      editingProblem,
      editingSolution,
      debouncedSearch,
      searchQuery,
      difficultyFilter,
      typeFilter,
      dateFilter,
      currentPage,
      totalPages,
      paginatedProblems,
      formError,
      tempContent,
      showContentEditor,
      markdownEditor,
      openContentEditor,
      closeContentEditor,
      updateTempContent,
      updateContent,
      saveContent,
      deleteContent,
      validateAndSaveProblem,
      handleImageSave,
      editProblem,
      closeProblemForm,
      saveProblem,
      openSolutionForm,
      saveSolution,
      confirmDeleteProblem,
      deleteProblem,
      formatDate,
      searchProblems
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
}

.dashboard-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-filters {
  display: flex;
  gap: 10px;
  flex: 1;
}

.add-problem-btn {
  margin-left: 10px;
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: 1px solid #4CAF50;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-problem-btn:hover {
  filter: brightness(0.9);
  background-color: #3f9442;
}

.search-filters input,
.search-filters select {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.search-filters input:hover,
.search-filters select:hover {
  border-color: #333;
  filter: brightness(0.95);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pagination button {
  margin: 0 10px;
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

.error-message {
  color: red;
  font-size: 0.9em;
  margin-top: 5px;
}

</style>