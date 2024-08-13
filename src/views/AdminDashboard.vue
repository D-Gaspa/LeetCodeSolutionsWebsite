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
    <BaseModal v-model="showProblemForm" class="problem-form-modal">
      <ProblemForm
          :editingProblem="editingProblem"
          @close="closeProblemForm"
          @problem-saved="fetchAllProblems"
      />
    </BaseModal>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import AdminProblemList from "@/components/AdminDashboard/AdminProblemList.vue"
import ProblemForm from "@/components/AdminDashboard/ProblemForm.vue"
import LoadingSpinner from "@/components/LoadingSpinner.vue"
import {useNotification} from "@/composables/useNotification"
import {useConfirm} from "@/composables/useConfirm"
import {useProblemStore} from "@/stores/problemsStore"
import type {Problem} from '@/types/Problem'
import BaseModal from "@/components/BaseModal.vue";

const {showNotification, updateNotification} = useNotification()
const {showConfirm} = useConfirm()
const problemStore = useProblemStore()

const problems = ref<Problem[]>([])
const showProblemForm = ref(false)
const editingProblem = ref<Problem | null>(null)
const problemToDelete = ref<Problem | null>(null)
const isLoading = ref(true)

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

const openSolutionForm = (problem: Problem) => {
  // To be implemented
  console.log('Open solution form for problem:', problem)
}

onMounted(fetchAllProblems)
</script>

<style scoped>
.admin-dashboard {
  padding: 5px 20px 20px 20px;
}
</style>