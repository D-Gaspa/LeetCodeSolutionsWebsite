<template>
  <div class="admin-dashboard">
    <h2>Admin Dashboard</h2>

    <ProblemList
        :problems="problems"
        @add="openProblemForm"
        @delete="confirmDeleteProblem"
        @edit="editProblem"
        @search="handleSearch"
        @add-solution="openSolutionForm"
    />

    <div v-if="showProblemForm" class="modal" @click.self="closeProblemForm">
      <ProblemForm
          :editingProblem="editingProblem"
          @close="closeProblemForm"
          @problem-saved="fetchProblems"
      />
    </div>
  </div>
</template>

<script>
import {inject, onMounted, reactive, ref} from 'vue'
import {supabase} from '../services/supabase'
import MdEditor from '../components/MarkdownEditor/MdEditor.vue'
import ProblemList from "@/components/AdminDashboard/AdminProblemList.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import ProblemForm from "@/components/AdminDashboard/ProblemForm.vue";
import {useProblemStore} from "@/stores/problemsStore.js";

export default {
  name: 'AdminDashboard',
  components: {
    ProblemForm,
    ConfirmDialog,
    ProblemList,
    MdEditor
  },
  setup() {
    const showNotification = inject('showNotification')
    const updateNotification = inject('updateNotification')
    const showConfirm = inject('showConfirm')
    const problemStore = useProblemStore()
    const problems = ref([])
    const showProblemForm = ref(false)
    const showSolutionForm = ref(false)
    const showContentEditor = ref(false)
    const editingProblem = ref(null)
    const editingSolution = ref(null)
    const problemToDelete = ref(null)

    const solutionForm = reactive({
      problem_id: null,
      approach_name: '',
      code: '',
      explanation: {},
      time_complexity: '',
      space_complexity: ''
    })

    const fetchProblems = async (filters = {}) => {
      try {
        problems.value = await problemStore.fetchProblems(filters)
      } catch (error) {
        showNotification({
          message: 'Error fetching problems: ' + error.message,
          type: 'error',
        })
      }
    }

    const handleSearch = (filters) => {
      fetchProblems(filters)
    }

    const openProblemForm = () => {
      editingProblem.value = null
      showProblemForm.value = true
    }

    const closeProblemForm = () => {
      showProblemForm.value = false
      editingProblem.value = null
    }

    const editProblem = (problem) => {
      editingProblem.value = problem
      showProblemForm.value = true
    }

    const confirmDeleteProblem = async (problem) => {
      problemToDelete.value = problem
      const confirmed = await showConfirm(
          "Confirm Delete",
          `Are you sure you want to delete the problem "${problem.title}"?`
      )
      if (confirmed) {
        await deleteProblem()
      }
    }

    const deleteProblem = async () => {
      if (!problemToDelete.value) return

      const notificationId = showNotification('Deleting problem...', 'loading', {isLoading: true})

      try {
        await problemStore.deleteProblem(problemToDelete.value.id)

        updateNotification(notificationId, {
          message: 'Problem and associated images deleted successfully',
          type: 'success',
          isLoading: false,
        })
      } catch (error) {
        updateNotification(notificationId, {
          message: error.message,
          type: 'error',
          isLoading: false,
        })
      } finally {
        await fetchProblems()
        problemToDelete.value = null
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
        clearSolutionForm()
      }
    }

    const openSolutionForm = (problem) => {
      solutionForm.problem_id = problem.id
      showSolutionForm.value = true
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
      editingProblem,
      editingSolution,
      solutionForm,
      fetchProblems,
      handleSearch,
      openProblemForm,
      editProblem,
      confirmDeleteProblem,
      deleteProblem,
      closeProblemForm,
      openSolutionForm,
      saveSolution,
    }
  }
}
</script>

<style>
.admin-dashboard {
  padding: 20px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
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

</style>