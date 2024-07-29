<template>
  <div>
    <h1>Admin Dashboard</h1>
    <button @click="showProblemForm = true">Add New Problem</button>
    <h2>Problems</h2>
    <ul>
      <li v-for="problem in problems" :key="problem.id">
        {{ problem.title }}
        <button @click="editProblem(problem)">Edit</button>
        <button @click="openSolutionForm(problem)">Add Solution</button>
      </li>
    </ul>

    <!-- Problem Form Modal -->
    <div v-if="showProblemForm" class="modal">
      <h2>{{ editingProblem ? 'Edit' : 'Add' }} Problem</h2>
      <form @submit.prevent="saveProblem">
        <label>
          Title:
          <input v-model="problemForm.title" required>
        </label>
        <label>
          Difficulty:
          <select v-model="problemForm.difficulty" required>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </label>
        <label>
          Type:
          <select v-model="problemForm.problem_type" required>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </label>
        <label v-if="problemForm.problem_type === 'daily'">
          Date:
          <input type="date" v-model="problemForm.problem_date" required>
        </label>
        <label v-else>
          Week:
          <input type="number" v-model="problemForm.problem_week" required>
        </label>
        <label>
          Year:
          <input type="number" v-model="problemForm.problem_year" required>
        </label>
        <label>
          Content:
          <rich-text-editor v-model="problemForm.content"></rich-text-editor>
        </label>
        <button type="submit">Save Problem</button>
        <button @click="showProblemForm = false">Cancel</button>
      </form>
    </div>

    <!-- Solution Form Modal -->
    <div v-if="showSolutionForm" class="modal">
      <h2>{{ editingSolution ? 'Edit' : 'Add' }} Solution</h2>
      <form @submit.prevent="saveSolution">
        <label>
          Approach Name:
          <input v-model="solutionForm.approach_name" required>
        </label>
        <label>
          Code:
          <textarea v-model="solutionForm.code" required></textarea>
        </label>
        <label>
          Explanation:
          <rich-text-editor v-model="solutionForm.explanation"></rich-text-editor>
        </label>
        <label>
          Time Complexity:
          <input v-model="solutionForm.time_complexity">
        </label>
        <label>
          Space Complexity:
          <input v-model="solutionForm.space_complexity">
        </label>
        <button type="submit">Save Solution</button>
        <button @click="showSolutionForm = false">Cancel</button>
      </form>
    </div>
  </div>
</template>

<script>
import {onMounted, reactive, ref} from 'vue'
import {supabase} from '../services/supabase'
import RichTextEditor from '../components/RichTextEditor.vue'

export default {
  name: 'AdminDashboard',
  components: {
    RichTextEditor
  },
  setup() {
    const problems = ref([])
    const showProblemForm = ref(false)
    const showSolutionForm = ref(false)
    const editingProblem = ref(null)
    const editingSolution = ref(null)

    const problemForm = reactive({
      title: '',
      difficulty: 'Easy',
      problem_type: 'daily',
      problem_date: '',
      problem_week: null,
      problem_year: new Date().getFullYear(),
      content: {}
    })

    const solutionForm = reactive({
      problem_id: null,
      approach_name: '',
      code: '',
      explanation: {},
      time_complexity: '',
      space_complexity: ''
    })

    const fetchProblems = async () => {
      const {data, error} = await supabase
          .from('problems')
          .select('*')
          .order('created_at', {ascending: false})

      if (error) console.error('Error fetching problems:', error)
      else problems.value = data
    }

    const editProblem = (problem) => {
      editingProblem.value = problem
      Object.assign(problemForm, problem)
      showProblemForm.value = true
    }

    const openSolutionForm = (problem) => {
      solutionForm.problem_id = problem.id
      showSolutionForm.value = true
    }

    const saveProblem = async () => {
      const {data, error} = editingProblem.value
          ? await supabase
              .from('problems')
              .update(problemForm)
              .eq('id', editingProblem.value.id)
          : await supabase
              .from('problems')
              .insert([problemForm])

      if (error) console.error('Error saving problem:', error)
      else {
        fetchProblems()
        showProblemForm.value = false
        editingProblem.value = null
      }
    }

    const saveSolution = async () => {
      const {data, error} = editingSolution.value
          ? await supabase
              .from('solutions')
              .update(solutionForm)
              .eq('id', editingSolution.value.id)
          : await supabase
              .from('solutions')
              .insert([solutionForm])

      if (error) console.error('Error saving solution:', error)
      else {
        showSolutionForm.value = false
        editingSolution.value = null
      }
    }

    onMounted(fetchProblems)

    return {
      problems,
      showProblemForm,
      showSolutionForm,
      problemForm,
      solutionForm,
      editingProblem,
      editingSolution,
      editProblem,
      openSolutionForm,  // Changed from showSolutionForm to openSolutionForm
      saveProblem,
      saveSolution
    }
  }
}
</script>

<style scoped>
/* ... (styles remain the same) ... */
</style>