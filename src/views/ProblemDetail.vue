<template>
  <div v-if="problem">
    <h1>{{ problem.title }}</h1>
    <p>Difficulty: {{ problem.difficulty }}</p>
    <p>Type: {{ problem.problem_type }}</p>
    <p v-if="problem.problem_type === 'daily'">
      Date: {{ formatDate(problem.problem_date) }}
    </p>
    <p v-else>
      Week: {{ problem.problem_week }}, {{ problem.problem_year }}
    </p>
    <div v-html="renderContent(problem.content)"></div>

    <h2>Solutions</h2>
    <div v-for="solution in solutions" :key="solution.id">
      <h3>{{ solution.approach_name }}</h3>
      <pre><code>{{ solution.code }}</code></pre>
      <div v-html="renderContent(solution.explanation)"></div>
      <p>Time Complexity: {{ solution.time_complexity }}</p>
      <p>Space Complexity: {{ solution.space_complexity }}</p>

      <h4>Example</h4>
      <div v-for="example in examplesBySolution[solution.id]" :key="example.id">
        <p>Step {{ example.step_number }}: {{ example.description }}</p>
        <img v-if="example.visualization_url" :src="example.visualization_url" :alt="'Step ' + example.step_number">
      </div>
    </div>
  </div>
</template>

<script>
import {computed, onMounted, ref} from 'vue'
import {useRoute} from 'vue-router'
import {supabase} from '../services/supabase'
import DOMPurify from 'dompurify'
import marked from 'marked'

export default {
  name: 'ProblemDetail',
  setup() {
    const route = useRoute()
    const problem = ref(null)
    const solutions = ref([])
    const examples = ref([])

    const fetchProblem = async () => {
      const {data, error} = await supabase
          .from('problems')
          .select('*')
          .eq('id', route.params.id)
          .single()

      if (error) console.error('Error fetching problem:', error)
      else problem.value = data
    }

    const fetchSolutions = async () => {
      const {data, error} = await supabase
          .from('solutions')
          .select('*')
          .eq('problem_id', route.params.id)

      if (error) console.error('Error fetching solutions:', error)
      else solutions.value = data
    }

    const fetchExamples = async () => {
      const {data, error} = await supabase
          .from('examples')
          .select('*')
          .eq('solution_id', solutions.value.map(s => s.id))

      if (error) console.error('Error fetching examples:', error)
      else examples.value = data
    }

    const examplesBySolution = computed(() => {
      return examples.value.reduce((acc, example) => {
        if (!acc[example.solution_id]) acc[example.solution_id] = []
        acc[example.solution_id].push(example)
        return acc
      }, {})
    })

    const renderContent = (content) => {
      if (typeof content === 'string') {
        return DOMPurify.sanitize(marked(content))
      } else if (typeof content === 'object') {
        // Assuming content is a JSON object with a 'text' field
        return DOMPurify.sanitize(marked(content.text))
      }
      return ''
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})
    }

    onMounted(async () => {
      await fetchProblem()
      await fetchSolutions()
      await fetchExamples()
    })

    return {
      problem,
      solutions,
      examplesBySolution,
      renderContent,
      formatDate
    }
  }
}
</script>

<style scoped>
pre {
  background-color: #f4f4f4;
  padding: 10px;
  border-radius: 5px;
}
</style>