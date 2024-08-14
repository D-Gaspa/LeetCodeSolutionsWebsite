<template>
  <div class="admin-problem-list">
    <DashboardHeader
        :dateFilter="problemStore.filters.date"
        :difficultyFilter="problemStore.filters.difficulty"
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
        :problems="paginatedProblems"
        :sortField="sortField"
        :sortOrder="sortOrder"
        @delete="confirmDelete"
        @edit="$emit('edit', $event)"
        @sort="toggleSort"
        @add-solution="$emit('add-solution', $event)"
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
import DashboardHeader from "@/components/ProblemList/DashboardHeader.vue"
import Pagination from "@/components/ProblemList/Pagination.vue"
import ProblemTable from "@/components/ProblemList/ProblemTable.vue"
import {useProblemsFilter} from '@/composables/ProblemList/useProblemsFilter'
import {usePagination} from '@/composables/ProblemList/usePagination'
import {useConfirm} from "@/composables/Common/useConfirm"
import {useNotification} from "@/composables/Common/useNotification";
import {useProblemStore} from "@/stores/problemsStore"
import type {Problem} from '@/types/Problem'

const props = defineProps<{
  problems: Problem[]
}>()

const emit = defineEmits<{
  (e: 'search'): void
  (e: 'edit', problem: Problem): void
  (e: 'delete', problem: Problem): void
  (e: 'add-solution', problem: Problem): void
  (e: 'add'): void
}>()

const {showConfirm} = useConfirm()
const problemStore = useProblemStore()
const {showNotification} = useNotification()

const {
  sortField,
  sortOrder,
  sortedProblems,
  toggleSort
} = useProblemsFilter(computed(() => props.problems))

const memoizedSortedProblems = computed(() => {
  // This will only recompute when the inputs change
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

const confirmDelete = async (problem: Problem) => {
  const isConfirmed = await showConfirm('Delete Problem', 'Are you sure you want to delete this problem?')
  if (isConfirmed) {
    emit('delete', problem)
  }
}

watch([() => problemStore.filters, sortField, sortOrder], () => {
  debouncedSearch()
  currentPage.value = 1
})
</script>

<style scoped>
</style>