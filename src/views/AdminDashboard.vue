<template>
  <div class="admin-dashboard">
    <h2>Admin Dashboard</h2>
    <LoadingSpinner v-if="isLoading" message="Loading problems..."/>
    <AdminProblemList
        v-else
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
import {onMounted, ref} from 'vue'
import MdEditor from '../components/MarkdownEditor/MdEditor.vue'
import ConfirmDialog from "@/components/ConfirmDialog.vue"
import AdminProblemList from "@/components/AdminDashboard/AdminProblemList.vue"
import ProblemForm from "@/components/AdminDashboard/ProblemForm.vue"
import {useProblemStore} from "@/stores/problemsStore"
import {useNotification} from "@/composables/useNotification"
import {useConfirm} from "@/composables/useConfirm"
import LoadingSpinner from "@/components/LoadingSpinner.vue"

export default {
  name: 'AdminDashboard',
  components: {
    LoadingSpinner,
    AdminProblemList,
    ProblemForm,
    ConfirmDialog,
    MdEditor
  },
  setup() {
    const {showNotification, updateNotification} = useNotification()
    const {showConfirm} = useConfirm()
    const problemStore = useProblemStore()
    const problems = ref([])
    const showProblemForm = ref(false)
    const editingProblem = ref(null)
    const problemToDelete = ref(null)
    const isLoading = ref(true)

    const fetchProblems = async () => {
      try {
        isLoading.value = true
        problems.value = await problemStore.getFilteredProblems()
      } catch (error) {
        showNotification('Error fetching problems: ' + error.message, 'error')
      } finally {
        isLoading.value = false
      }
    }

    const handleSearch = () => {
      fetchProblems()
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

    const openSolutionForm = (problem) => {
      // To be implemented
      console.log('Open solution form for problem:', problem)
    }

    onMounted(fetchProblems)

    return {
      problems,
      showProblemForm,
      editingProblem,
      isLoading,
      fetchProblems,
      handleSearch,
      openProblemForm,
      editProblem,
      confirmDeleteProblem,
      deleteProblem,
      closeProblemForm,
      openSolutionForm
    }
  }
}
</script>

<style>
.admin-dashboard {
  padding: 5px 20px 20px 20px;
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

</style>