<template>
  <div class="content-actions-wrapper">
    <div class="content-actions">
      <div class="content-action-group">
        <button class="btn-primary btn-icon action-btn" type="button" @click="$emit('open-code-editor')">
          <Code2 class="icon"/>
          {{ hasCode ? 'Edit' : 'Add' }} Code
        </button>
        <button :disabled="!hasCode" class="btn-danger btn-icon delete-btn" type="button" @click="$emit('delete-code')">
          <Trash2 class="icon"/>
          Delete
        </button>
      </div>
      <div v-for="field in contentFields" :key="field" class="content-action-group">
        <button class="btn-primary btn-icon action-btn" type="button" @click="$emit('open-content-editor', field)">
          <component :is="getIcon(field)" class="icon"/>
          {{ form[field].text ? 'Edit' : 'Add' }} {{ getLabel(field) }}
        </button>
        <button :disabled="!form[field].text" class="btn-danger btn-icon delete-btn" type="button"
                @click="$emit('delete-content', field)">
          <Trash2 class="icon"/>
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {Code2, Trash2} from 'lucide-vue-next'
import {contentFields, getIcon, getLabel} from '@/utils/solutionUtils'
import type {SolutionFormType} from '@/types/Problem'

defineProps<{
  form: SolutionFormType
  hasCode: boolean
}>()

defineEmits<{
  (e: 'open-code-editor'): void
  (e: 'delete-code'): void
  (e: 'open-content-editor', field: keyof SolutionFormType): void
  (e: 'delete-content', field: keyof SolutionFormType): void
}>()
</script>

<style scoped>
.content-actions-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-large);
}

.content-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--spacing-medium);
  width: 100%;
}

.content-action-group {
  display: flex;
  gap: var(--spacing-small);
  width: 100%;
}

.action-btn {
  flex: 3;
  justify-content: center;
  padding-left: var(--spacing-medium);
}

.delete-btn {
  flex: 1;
}</style>