<template>
  <div class="problem-list">
    <h2>Problem List</h2>
    <LoadingSpinner v-if="isLoading" message="Loading problems..."/>
    <AdminProblemList
        v-else
        :isAdmin="false"
        :problems="problems"
        @search="handleSearch"
        @view-problem="viewProblem"
    />
  </div>
</template>

<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import AdminProblemList from "@/components/Common/ProblemList/BaseProblemList.vue"
import LoadingSpinner from "@/components/Common/LoadingSpinner.vue"
import {useNotification} from "@/composables/Common/useNotification"
import {useProblemStore} from "@/stores/problemStore"
import type {Problem} from '@/types/Problem'

const {showNotification} = useNotification()
const problemStore = useProblemStore()
const router = useRouter()

const problems = ref<Problem[]>([])
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

const handleSearch = async () => {
  try {
    problems.value = await problemStore.getFilteredProblems()
  } catch (error) {
    showNotification(`Error fetching problems: ${(error as Error).message}`, 'error')
  }
}

const viewProblem = (problem: Problem) => {
  router.push({name: 'ProblemDetail', params: {id: problem.id.toString()}})
}

onMounted(fetchAllProblems)
</script>

<style scoped>
.problem-list {
  padding: 5px 20px 20px 20px;
}
</style>