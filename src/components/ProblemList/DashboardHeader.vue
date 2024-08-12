<template>
  <div class="dashboard-header">
    <div>
      <button
          :disabled="isResetDisabled"
          class="btn-danger"
          @click="$emit('reset-filters')"
      >
        Reset Filters
      </button>
    </div>
    <div class="search-filters">
      <input
          :value="searchQuery"
          placeholder="Search problems..."
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      >
      <select :value="difficultyFilter"
              @change="$emit('update:difficultyFilter', ($event.target as HTMLSelectElement).value)">
        <option value="">All Difficulties</option>
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
      </select>
      <select :value="typeFilter" @change="$emit('update:typeFilter', ($event.target as HTMLSelectElement).value)">
        <option value="">All Types</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
      </select>
      <CustomDatePicker
          :modelValue="dateFilter"
          class="date-picker"
          placeholder="Filter by date"
          type="daily"
          @update:modelValue="$emit('update:dateFilter', $event)"
      />
    </div>
    <button class="btn-primary btn-icon" title="Add Problem" @click="$emit('add')">
      <PlusCircle class="icon"/>
      Add Problem
    </button>
  </div>
</template>

<script lang="ts" setup>
import {PlusCircle} from 'lucide-vue-next'
import CustomDatePicker from "@/components/CustomDatePicker.vue"

defineProps<{
  searchQuery: string
  difficultyFilter: string
  typeFilter: string
  dateFilter: string
  isResetDisabled: boolean
}>()

defineEmits<{
  (e: 'reset-filters'): void
  (e: 'update:searchQuery', value: string): void
  (e: 'update:difficultyFilter', value: string): void
  (e: 'update:typeFilter', value: string): void
  (e: 'update:dateFilter', value: string | null): void
  (e: 'add'): void
}>()
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
</style>