<template>
  <div class="content-actions">
    <button class="btn-primary btn-icon" type="button" @click="$emit('open-editor')">
      <Edit class="icon"/>
      {{ hasContent ? 'Edit' : 'Add' }} Content
    </button>
    <button v-if="hasContent" class="btn-danger btn-icon" type="button" @click="$emit('delete-content')">
      <Trash2 class="icon"/>
      Delete Content
    </button>
  </div>
</template>

<script lang="ts" setup>
import {Edit, Trash2} from 'lucide-vue-next'

defineProps<{
  hasContent: boolean
}>()

defineEmits<{
  (e: 'open-editor'): void
  (e: 'delete-content'): void
}>()
</script>

<style scoped>
.content-actions {
  margin: 10px 0;
  display: flex;
  justify-content: center;
  gap: 10px;
}
</style>