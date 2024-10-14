<template>
  <div class="pagination">
    <button :disabled="currentPage === 1 || noItems" class="btn-neutral"
            @click="$emit('update:currentPage', currentPage - 1)">
      <ChevronLeft class="icon"/>
      Previous
    </button>
    <span>Page {{ noItems ? 0 : currentPage }} of {{ totalPages }}</span>
    <button :disabled="currentPage === totalPages || noItems" class="btn-neutral"
            @click="$emit('update:currentPage', currentPage + 1)">
      Next
      <ChevronRight class="icon"/>
    </button>
  </div>
</template>

<script lang="ts" setup>
import {ChevronLeft, ChevronRight} from 'lucide-vue-next';
import {computed} from 'vue';

const props = defineProps<{
  currentPage: number;
  totalPages: number;
}>();

const noItems = computed(() => props.totalPages === 0);

defineEmits<(e: 'update:currentPage', page: number) => void>();
</script>

<style scoped>
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pagination button {
  margin: 0 10px;
}
</style>