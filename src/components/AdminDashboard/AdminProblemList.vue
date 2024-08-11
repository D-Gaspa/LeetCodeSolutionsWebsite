<template>
  <div class="problem-list">
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
        <CustomDatePicker v-model="dateFilter"
                          class="date-picker"
                          placeholder="Filter by date"
        />
      </div>
      <button class="btn-primary btn-icon" title="Add Problem" @click="$emit('add')">
        <PlusCircle class="icon"/>
        Add Problem
      </button>
    </div>

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
          <div class="actions">
            <button class="btn-neutral btn-icon-transparent" title="Edit" @click="$emit('edit', problem)">
              <Edit2 class="icon"/>
              Edit
            </button>
            <button class="btn-danger btn-icon-transparent" title="Delete" @click="confirmDelete(problem)">
              <Trash2 class="icon"/>
              Delete
            </button>
            <button class="btn-neutral btn-icon-transparent" title="Add Solution"
                    @click="$emit('add-solution', problem)">
              <FileText class="icon"/>
              Add Solution
            </button>
          </div>
        </td>
      </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button :disabled="currentPage === 1" class="btn-neutral" @click="currentPage--">
        <ChevronLeft class="icon"/>
        Previous
      </button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button :disabled="currentPage === totalPages" class="btn-neutral" @click="currentPage++">
        Next
        <ChevronRight class="icon"/>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed, ref, watch} from 'vue'
import debounce from 'lodash/debounce'
import {formatDate} from '@/utils/dateFormatters'
import CustomDatePicker from "@/components/CustomDatePicker.vue"
import {useConfirm} from "@/composables/useConfirm";
import {ChevronLeft, ChevronRight, Edit2, FileText, PlusCircle, Trash2} from 'lucide-vue-next'

interface Problem {
  id: number
  title: string
  difficulty: string
  problem_type: string
  problem_date?: string
  problem_week?: number
  problem_year?: number
}

interface Props {
  problems: Problem[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'search', filters: { query: string, difficulty: string, type: string, date: string }): void
  (e: 'edit', problem: Problem): void
  (e: 'delete', problem: Problem): void
  (e: 'add-solution', problem: Problem): void
  (e: 'add'): void
}>()

const {showConfirm} = useConfirm()
const searchQuery = ref('')
const difficultyFilter = ref('')
const typeFilter = ref('')
const dateFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const filteredProblems = computed(() => {
  return props.problems.filter(problem =>
      problem.title.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
      (difficultyFilter.value === '' || problem.difficulty === difficultyFilter.value) &&
      (typeFilter.value === '' || problem.problem_type === typeFilter.value) &&
      (dateFilter.value === '' || problem.problem_date === dateFilter.value)
  )
})

const totalPages = computed(() => Math.ceil(filteredProblems.value.length / itemsPerPage))

const paginatedProblems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredProblems.value.slice(start, end)
})

const debouncedSearch = debounce(() => {
  emit('search', {
    query: searchQuery.value,
    difficulty: difficultyFilter.value,
    type: typeFilter.value,
    date: dateFilter.value
  })
}, 300)

const confirmDelete = async (problem: Problem) => {
  const isConfirmed = await showConfirm('Delete Problem', 'Are you sure you want to delete this problem?')
  if (isConfirmed) {
    emit('delete', problem)
  }
}

watch([searchQuery, difficultyFilter, typeFilter, dateFilter], debouncedSearch)
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

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 8px;
  text-align: left;
}

.pagination button {
  margin: 0 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
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

.actions {
  display: flex;
  gap: 5px;
}
</style>