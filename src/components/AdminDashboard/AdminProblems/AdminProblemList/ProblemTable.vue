<template>
  <table>
    <thead>
    <tr>
      <SortableTableHeader
          v-for="header in headers"
          :key="header.field"
          :currentSortField="props.sortField"
          :currentSortOrder="props.sortOrder"
          :field="header.field"
          @sort="$emit('sort', header.field)"
      >
        {{ header.label }}
      </SortableTableHeader>
      <th>Solutions</th>
      <th>Actions</th>
    </tr>
    </thead>
    <tbody>
    <tr v-for="problem in props.problems" :key="problem.id">
      <td>{{ problem.title }}</td>
      <td>{{ problem.difficulty }}</td>
      <td>{{ problem.problem_type }}</td>
      <td>{{ formatDate(problem) }}</td>
      <td>{{ problem.solution_count }}</td>
      <td>
        <div class="actions">
          <button class="btn-neutral btn-icon-transparent" @click="$emit('edit', problem)">
            <Edit2 class="icon"/>
            Edit
          </button>
          <button class="btn-danger btn-icon-transparent" @click="$emit('delete', problem)">
            <Trash2 class="icon"/>
            Delete
          </button>
          <button class="btn-neutral btn-icon-transparent" @click="$emit('show-solutions', problem)">
            <FileText class="icon"/>
            Show Solutions
          </button>
        </div>
      </td>
    </tr>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
import {Edit2, FileText, Trash2} from 'lucide-vue-next'
import SortableTableHeader from "@/components/Common/SortableTableHeader.vue"
import {formatDate} from '@/utils/dateFormatters'
import type {Problem} from '@/types/Problem'

interface Props {
  problems: Problem[]
  sortField: keyof Problem
  sortOrder: 'asc' | 'desc'
}

const props = defineProps<Props>()

const headers = [
  {field: 'title' as keyof Problem, label: 'Title'},
  {field: 'difficulty' as keyof Problem, label: 'Difficulty'},
  {field: 'problem_type' as keyof Problem, label: 'Type'},
  {field: 'problem_date' as keyof Problem, label: 'Date'},
]

defineEmits<{
  (e: 'edit', problem: Problem): void
  (e: 'delete', problem: Problem): void
  (e: 'show-solutions', problem: Problem): void
  (e: 'sort', field: keyof Problem): void
}>()

</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 8px;
  text-align: left;
}

.actions {
  display: flex;
  gap: 5px;
}
</style>