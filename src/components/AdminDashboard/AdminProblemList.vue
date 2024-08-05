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
        <input
            v-model="dateFilter"
            placeholder="Filter by date"
            type="date"
        >
      </div>
      <button class="add-problem-btn" @click="$emit('add')">Add Problem</button>
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
          <button @click="$emit('edit', problem)">Edit</button>
          <button @click="$emit('delete', problem)">Delete</button>
          <button @click="$emit('add-solution', problem)">Add Solution</button>
        </td>
      </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button :disabled="currentPage === 1" @click="currentPage--">Previous</button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
    </div>
  </div>
</template>

<script>
import {computed, ref, watch} from 'vue'
import debounce from 'lodash/debounce'
import {formatDate} from '@/utils/dateFormatters.js'

export default {
  name: 'ProblemList',
  props: {
    problems: {
      type: Array,
      required: true
    }
  },
  emits: ['search', 'edit', 'delete', 'add-solution', 'add'],
  setup(props, {emit}) {
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

    watch([difficultyFilter, typeFilter, dateFilter], debouncedSearch)

    return {
      searchQuery,
      difficultyFilter,
      typeFilter,
      dateFilter,
      currentPage,
      totalPages,
      paginatedProblems,
      debouncedSearch,
      formatDate
    }
  }
}
</script>

<style scoped>
.dashboard-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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

.add-problem-btn {
  margin-left: 10px;
  padding: 10px 20px;
  background-color: var(--color-primary-dark);
  color: white;
  border: 1px solid var(--color-primary-dark);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-problem-btn:hover {
  filter: brightness(0.9);
  background-color: var(--color-primary);
}

input, select, textarea {
  resize: none;
  box-sizing: border-box;
  width: 100%;
}
</style>