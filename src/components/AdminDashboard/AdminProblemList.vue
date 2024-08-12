<template>
  <div class="admin-problem-list">
    <div class="dashboard-header">
      <div>
        <button
            :disabled="problemStore.areDefaultFilters()"
            class="btn-danger"
            @click="resetFilters"
        >Reset Filters
        </button>
      </div>
      <div class="search-filters">
        <input
            v-model="problemStore.filters.query"
            placeholder="Search problems..."
            @input="debouncedSearch"
        >
        <select v-model="problemStore.filters.difficulty" @change="handleFilterChange">
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <select v-model="problemStore.filters.type" @change="handleFilterChange">
          <option value="">All Types</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        <CustomDatePicker
            v-model="problemStore.filters.date"
            class="date-picker"
            placeholder="Filter by date"
            type="daily"
            @update:modelValue="handleFilterChange"
        />
      </div>
      <button class="btn-primary btn-icon" title="Add Problem" @click="$emit('add')">
        <PlusCircle class="icon"/>
        Add Problem
      </button>
    </div>

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
import {computed, ref, toRef, watch} from 'vue'
import debounce from 'lodash/debounce'
import CustomDatePicker from "@/components/CustomDatePicker.vue"
import {useConfirm} from "@/composables/useConfirm"
import {PlusCircle} from 'lucide-vue-next'
import Pagination from "@/components/Pagination.vue"
import ProblemTable from "@/components/ProblemTable.vue"
import {useProblemsFilter} from '@/composables/useProblemsFilter'
import type {Problem} from '@/types/Problem'
import {useProblemStore} from "@/stores/problemsStore";

interface Props {
  problems: Problem[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'search'): void
  (e: 'edit', problem: Problem): void
  (e: 'delete', problem: Problem): void
  (e: 'add-solution', problem: Problem): void
  (e: 'add'): void
}>()

const {showConfirm} = useConfirm()
const problemStore = useProblemStore()
const problemsRef = toRef(props, 'problems')
const currentPage = ref(1)
const itemsPerPage = 10

const {
  searchQuery,
  difficultyFilter,
  typeFilter,
  dateFilter,
  sortField,
  sortOrder,
  sortedProblems,
  toggleSort
} = useProblemsFilter(problemsRef)

const totalPages = computed(() => Math.ceil(sortedProblems.value.length / itemsPerPage))

const paginatedProblems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return sortedProblems.value.slice(start, end)
})

const debouncedSearch = debounce(() => {
  handleFilterChange()
}, 300)

const handleFilterChange = () => {
  emit('search')
}

const resetFilters = async () => {
  problemStore.resetFilters()
  emit('search')
}

const confirmDelete = async (problem: Problem) => {
  const isConfirmed = await showConfirm('Delete Problem', 'Are you sure you want to delete this problem?')
  if (isConfirmed) {
    emit('delete', problem)
  }
}

watch([searchQuery, difficultyFilter, typeFilter, dateFilter], debouncedSearch)

// Reset to first page when sorting or filtering changes
watch([sortField, sortOrder, searchQuery, difficultyFilter, typeFilter, dateFilter], () => {
  currentPage.value = 1
})
</script>

<style scoped>
.dashboard-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}

.search-filters {
  display: flex;
  gap: 10px;
  flex: 1;
}

.date-picker {
  box-sizing: border-box;
  width: 100%;
}

input, select, textarea {
  resize: none;
  box-sizing: border-box;
  width: 100%;
}
</style>