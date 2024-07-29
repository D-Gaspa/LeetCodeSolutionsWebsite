<template>
  <div class="admin-dashboard">
    <h1>Admin Dashboard</h1>

    <!-- Search and Add Problem -->
    <div class="actions">
      <input v-model="searchQuery" @input="searchProblems" placeholder="Search problems...">
      <button @click="showProblemForm = true">Add New Problem</button>
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
    <div v-if="showProblemForm" class="modal" @click.self="showProblemForm = false">
      <div class="modal-content">
        <h2>{{ editingProblem ? 'Edit' : 'Add' }} Problem</h2>
        <form @submit.prevent="saveProblem">
          <label>
            Problem Number:
            <input v-model.number="problemForm.id" type="number" required min="1" @blur="checkProblemIdExists">
          </label>
          <p v-if="idError" class="error-message">{{ idError }}</p>
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
            <input type="date" v-model="problemForm.problem_date" required>
          </label>
          <label v-else>
            Week:
            <select v-model="problemForm.problem_week" required>
              <option v-for="week in 5" :key="week" :value="week">Week {{ week }}</option>
            </select>
          </label>
          <label v-if="problemForm.problem_type === 'weekly'">
            Year:
            <input type="number" v-model="problemForm.problem_year" required>
          </label>
          <label>
            Content:
            <rich-text-editor v-model="problemForm.content"></rich-text-editor>
          </label>
          <div class="form-actions">
            <button type="submit">Save Problem</button>
            <button type="button" @click="showProblemForm = false">Cancel</button>
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
            <rich-text-editor v-model="solutionForm.explanation"></rich-text-editor>
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
import {computed, onMounted, reactive, ref} from 'vue'
import {supabase} from '../services/supabase'
import RichTextEditor from '../components/RichTextEditor.vue'

export default {
  name: 'AdminDashboard',
  components: {
    RichTextEditor
  },
  setup() {
    const problems = ref([])
    const showProblemForm = ref(false)
    const showSolutionForm = ref(false)
    const showConfirmDialog = ref(false)
    const editingProblem = ref(null)
    const editingSolution = ref(null)
    const problemToDelete = ref(null)
    const searchQuery = ref('')
    const currentPage = ref(1)
    const itemsPerPage = 10

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

    const idError = ref('')

    const checkProblemIdExists = async () => {
      if (!problemForm.id) return

      const {data, error} = await supabase
          .from('problems')
          .select('id')
          .eq('id', problemForm.id)
          .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking problem ID:', error)
        return
      }

      if (data) {
        if (!editingProblem.value || (editingProblem.value && editingProblem.value.id !== problemForm.id)) {
          idError.value = 'This problem number already exists. Please choose a different one.'
        } else {
          idError.value = ''
        }
      } else {
        idError.value = ''
      }
    }

    const fetchProblems = async () => {
      const {data, error} = await supabase
          .from('problems')
          .select('*')
          .order('created_at', {ascending: false})

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

    const editProblem = (problem) => {
      editingProblem.value = problem
      const [id, ...nameParts] = problem.title.split('.')

      problemForm.id = parseInt(id)
      problemForm.name = nameParts.join('.').trim()
      Object.assign(problemForm, {
        ...problem,
        name: nameParts.join('.').trim(),
      })
      showProblemForm.value = true
      idError.value = ''
    }

    const openSolutionForm = (problem) => {
      solutionForm.problem_id = problem.id
      showSolutionForm.value = true
    }

    const saveProblem = async () => {
      await checkProblemIdExists()
      if (idError.value) {
        // Don't proceed if there's an ID error
        return
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
      delete formData.name  // Remove the separate name field

      const {error} = editingProblem.value
          ? await supabase
              .from('problems')
              .update(formData)
              .eq('id', editingProblem.value.id)
          : await supabase
              .from('problems')
              .insert([formData])

      if (error) {
        console.error('Error saving problem:', error)
        // Handle the error, maybe show a message to the user
      } else {
        await fetchProblems()
        showProblemForm.value = false
        editingProblem.value = null
        idError.value = ''
      }
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
      }
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
      searchQuery,
      currentPage,
      totalPages,
      paginatedProblems,
      idError,
      checkProblemIdExists,
      editProblem,
      openSolutionForm,
      saveProblem,
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

.actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
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

form {
  display: flex;
  flex-direction: column;
}

label {
  margin-bottom: 10px;
}

input, select, textarea {
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