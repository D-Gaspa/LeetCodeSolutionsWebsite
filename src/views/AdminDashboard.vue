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
        @show-solutions="showSolutions"
    />
    <BaseModal
        v-model="showProblemForm"
        :confirm-on-close="true"
        class="problem-form-modal"
        @close-attempt="handleProblemFormCloseAttempt"
    >
      <ProblemForm
          ref="problemFormRef"
          :editingProblem="editingProblemComputed"
          @close="handleProblemFormCloseAttempt"
          @problem-saved="handleProblemSaved"
      />
    </BaseModal>
    <SolutionManager
        v-if="selectedProblem"
        v-model="showSolutionManager"
        :problem="selectedProblem"
        @solutions-updated="handleSolutionsUpdated"
    />
  </div>
</template>

<script lang="ts" setup>
import {computed, onMounted, ref} from 'vue'
import AdminProblemList from "@/components/AdminDashboard/AdminProblemList/AdminProblemList.vue"
import ProblemForm from "@/components/AdminDashboard/AdminProblems/ProblemForm.vue"
import LoadingSpinner from "@/components/Common/LoadingSpinner.vue"
import {useNotification} from "@/composables/Common/useNotification"
import {useConfirm} from "@/composables/Common/useConfirm"
import {useProblemStore} from "@/stores/problemStore"
import type {Problem} from '@/types/Problem'
import BaseModal from "@/components/Common/BaseModal.vue";
import SolutionManager from "@/components/AdminDashboard/AdminSolutions/SolutionManager.vue";

const {showNotification, updateNotification} = useNotification()
const {showConfirm} = useConfirm()
const problemStore = useProblemStore()

const problems = ref<Problem[]>([])
const showProblemForm = ref(false)
const showSolutionManager = ref(false)
const editingProblem = ref<Problem | null>(null)
const problemToDelete = ref<Problem | null>(null)
const selectedProblem = ref<Problem | null>(null)
const isLoading = ref(true)
const problemFormRef = ref<InstanceType<typeof ProblemForm> | null>(null)

const editingProblemComputed = computed(() =>
    editingProblem.value === null ? undefined : editingProblem.value
)

const fetchAllProblems = async () => {
  try {
    isLoading.value = true
    problems.value = await problemStore.fetchAllProblems()
  } catch (error) {
    showNotification(`Error fetching problems: ${(error as Error).message}`, 'error')
  } finally {
    isLoading.value = false
  }
}

const fetchFilteredProblems = async () => {
  try {
    problems.value = await problemStore.getFilteredProblems()
  } catch (error) {
    showNotification(`Error fetching problems: ${(error as Error).message}`, 'error')
  }
}

const handleSearch = async () => {
  await fetchFilteredProblems()
}

const openProblemForm = () => {
  editingProblem.value = null
  showProblemForm.value = true
}

const handleProblemFormCloseAttempt = async () => {
  if (problemFormRef.value?.hasUnsavedChanges) {
    const shouldClose = await showConfirm(
        'Unsaved Changes',
        'You have unsaved changes in the problem form. Are you sure you want to close it?'
    )
    if (shouldClose) {
      closeProblemForm()
    }
  } else {
    closeProblemForm()
  }
}

const handleProblemSaved = () => {
  closeProblemForm()
  fetchAllProblems()
}

const closeProblemForm = () => {
  showProblemForm.value = false
  editingProblem.value = null
}

const editProblem = (problem: Problem) => {
  editingProblem.value = problem
  showProblemForm.value = true
}

const confirmDeleteProblem = async (problem: Problem) => {
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
      message: (error as Error).message,
      type: 'error',
      isLoading: false,
    })
  } finally {
    await fetchAllProblems()
    problemToDelete.value = null
  }
}

const showSolutions = (problem: Problem) => {
  selectedProblem.value = problem
  showSolutionManager.value = true
}

const handleSolutionsUpdated = async () => {
  // Refresh the problem list or update the solution count
  await fetchAllProblems()
}

onMounted(fetchAllProblems)
</script>

<style scoped>
.admin-dashboard {
  padding: 5px 20px 20px 20px;
}
</style>