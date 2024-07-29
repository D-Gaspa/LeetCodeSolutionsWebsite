<template>
  <div>
    <h1>LeetCode Problems</h1>
    <div class="filters">
      <select v-model="selectedDifficulty">
        <option value="">All Difficulties</option>
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
      </select>
      <select v-model="selectedType">
        <option value="">All Types</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
      </select>
    </div>
    <ul>
      <li v-for="problem in filteredProblems" :key="problem.id">
        <router-link :to="{ name: 'ProblemDetail', params: { id: problem.id } }">
          {{ problem.title }} - {{ problem.difficulty }}
          <span v-if="problem.problem_type === 'daily'">
            ({{ formatDate(problem.problem_date) }})
          </span>
          <span v-else>
            (Week {{ problem.problem_week }}, {{ problem.problem_year }})
          </span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script>
import {computed, onMounted, ref} from 'vue'
import {supabase} from '../services/supabase'

export default {
  name: 'ProblemList',
  setup() {
    const problems = ref([])
    const selectedDifficulty = ref('')
    const selectedType = ref('')

    const fetchProblems = async () => {
      const {data, error} = await supabase
          .from('problems')
          .select('*')
          .order('problem_year', {ascending: false})
          .order('problem_date', {ascending: false})
          .order('problem_week', {ascending: false})

      if (error) console.error('Error fetching problems:', error)
      else problems.value = data
    }

    const filteredProblems = computed(() => {
      return problems.value.filter(problem => {
        const difficultyMatch = !selectedDifficulty.value || problem.difficulty === selectedDifficulty.value
        const typeMatch = !selectedType.value || problem.problem_type === selectedType.value
        return difficultyMatch && typeMatch
      })
    })

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})
    }

    onMounted(fetchProblems)

    return {
      problems,
      filteredProblems,
      selectedDifficulty,
      selectedType,
      formatDate
    }
  }
}
</script>

<style scoped>
.filters {
  margin-bottom: 20px;
}

select {
  margin-right: 10px;
}
</style>