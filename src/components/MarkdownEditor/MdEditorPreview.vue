<template>
  <div class="preview-container">
    <h3 class="preview-title">Preview</h3>
    <div class="preview" v-html="content"></div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  content: string
}>()
</script>

<style scoped>
.preview-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  transition: all var(--transition-base);
}

.preview-title {
  font-size: var(--font-size-base);
  padding: var(--spacing-small) var(--spacing-medium);
  margin: 0;
  background-color: var(--bg-color-tertiary);
  border-bottom: var(--border-width) solid var(--border-color-secondary);
  color: var(--text-color-secondary);
  font-weight: var(--font-weight-bold);
  transition: all var(--transition-base);
}

.preview {
  text-align: left;
  flex: 1;
  padding: var(--spacing-medium);
  padding-top: 0;
  border-left: var(--border-width) solid var(--border-color-secondary);
  overflow-y: auto;
  background-color: var(--bg-color-secondary);
  color: var(--text-color-primary);
  font-size: var(--font-size-small);
  line-height: var(--line-height-base);
  transition: all var(--transition-base);
}

</style>