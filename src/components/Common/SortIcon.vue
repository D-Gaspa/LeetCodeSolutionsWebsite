<template>
  <svg :class="iconClass" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
    <path v-if="direction === 'desc'" d="M8 4l4 4H4z"/>
    <path v-else-if="direction === 'asc'" d="M8 12l4-4H4z"/>
    <path v-else d="M4 8h8L8 4z M4 9h8l-4 4z"/>
  </svg>
</template>

<script lang="ts" setup>
import {computed} from 'vue';

const props = defineProps<{
  direction: 'asc' | 'desc' | 'none'
}>();

const iconClass = computed(() => ({
  'sort-icon': true,
  'sort-icon--active': props.direction !== 'none',
  [`sort-icon--${props.direction}`]: true,
}));
</script>

<style scoped>
.sort-icon {
  fill: var(--text-color-muted);
  transition: all var(--transition-base);
}

.sort-icon--active {
  fill: var(--text-color-primary);
  transition: all var(--transition-base);
}
</style>