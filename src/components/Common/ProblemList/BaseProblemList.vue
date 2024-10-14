Copy
<template>
  <div class="base-problem-list">
    <DashboardHeader
        :dateFilter="problemStore.filters.date"
        :difficultyFilter="problemStore.filters.difficulty"
        :isAdmin="isAdmin"
        :isResetDisabled="problemStore.areDefaultFilters()"
        :searchQuery="problemStore.filters.query"
        :typeFilter="problemStore.filters.type"
        @add="$emit('add')"
        @update:searchQuery="updateFilter('query', $event)"
        @update:difficultyFilter="updateFilter('difficulty', $event)"
        @update:typeFilter="updateFilter('type', $event)"
        @update:dateFilter="updateFilter('date', $event)"
        @reset-filters="resetFilters"
    />

    <ProblemTable
        :isAdmin="isAdmin"
        :problems="paginatedProblems"
        :sortField="sortField"
        :sortOrder="sortOrder"
        @delete="deleteProblem"
        @edit="$emit('edit', $event)"
        @sort="toggleSort"
        @view-problem="$emit('view-problem', $event)"
        @show-solutions="$emit('show-solutions', $event)"
    />

    <Pagination
        v-if="totalPages > 0"
        v-model:currentPage="currentPage"
        :totalPages="totalPages"
    />
  </div>
</template>

<script lang="ts" setup>
import {computed, watch} from 'vue'
import debounce from 'lodash/debounce'
import DashboardHeader from "@/components/Common/ProblemList/DashboardHeader.vue"
import Pagination from "@/components/Common/ProblemList/Pagination.vue"
import ProblemTable from "@/components/Common/ProblemList/ProblemTable.vue"
import {useProblemsFilter} from '@/composables/AdminDashboard/AdminProblems/AdminProblemList/useProblemsFilter'
import {usePagination} from '@/composables/AdminDashboard/AdminProblems/AdminProblemList/usePagination'
import {useNotification} from "@/composables/Common/useNotification"
import {useProblemStore} from "@/stores/problemStore"
import type {Problem} from '@/types/Problem'

const props = defineProps<{
  problems: Problem[]
  isAdmin: boolean
}>()

const emit = defineEmits<{
  (e: 'search'): void
  (e: 'edit', problem: Problem): void
  (e: 'delete', problem: Problem): void
  (e: 'show-solutions', problem: Problem): void
  (e: 'view-problem', problem: Problem): void
  (e: 'add'): void
}>()

const problemStore = useProblemStore()
const {showNotification} = useNotification()

const {
  sortField,
  sortOrder,
  sortedProblems,
  toggleSort
} = useProblemsFilter(computed(() => props.problems))

const memoizedSortedProblems = computed(() => {
  return sortedProblems.value
})

const {currentPage, totalPages, paginatedItems: paginatedProblems} = usePagination(memoizedSortedProblems, 10)

const debouncedSearch = debounce(() => emit('search'), 300)

const updateFilter = (filterName: keyof typeof problemStore.filters, value: string | null) => {
  if (value === null) {
    showNotification('Invalid date format', 'error')
    return
  }
  problemStore.filters[filterName] = value
  debouncedSearch()
}

const resetFilters = () => {
  problemStore.resetFilters()
  emit('search')
}

const deleteProblem = (problem: Problem) => {
  emit('delete', problem)
}

watch([() => problemStore.filters, sortField, sortOrder], () => {
  debouncedSearch()
  currentPage.value = 1
})
</script>