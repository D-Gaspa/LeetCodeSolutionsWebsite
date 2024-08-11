<template>
  <th :class="{ 'active': isActive }" @click="$emit('sort', field)">
    <div class="sortable-header">
      <slot></slot>
      <SortIcon :direction="sortDirection"/>
    </div>
  </th>
</template>

<script lang="ts" setup>
import {computed} from 'vue';
import SortIcon from './SortIcon.vue';

const props = defineProps<{
  field: string;
  currentSortField: string;
  currentSortOrder: 'asc' | 'desc';
}>();

const emit = defineEmits<{
  (e: 'sort', field: string): void;
}>();

const isActive = computed(() => props.field === props.currentSortField);

const sortDirection = computed(() => {
  if (!isActive.value) return 'none';
  return props.currentSortOrder;
});
</script>

<style scoped>
.sortable-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

th:hover {
  background-color: var(--bg-color-tertiary);
}

th.active {
  background-color: var(--bg-color-secondary);
}
</style>