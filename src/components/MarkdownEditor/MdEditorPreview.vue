<template>
  <div class="preview-container">
    <h3 class="preview-title">Preview</h3>
    <div class="preview" v-html="content"></div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue'

export default defineComponent({
  name: 'MdEditorPreview',
  props: {
    content: {
      type: String,
      required: true,
    },
  },
})
</script>

<style scoped>
.preview-container {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.preview-title {
  font-size: var(--font-size-base);
  padding: var(--spacing-small) var(--spacing-medium);
  margin: 0;
  background-color: var(--bg-color-tertiary);
  border-bottom: var(--border-width) solid var(--border-color-secondary);
  color: var(--text-color-secondary);
  font-weight: var(--font-weight-bold);
}

.preview {
  text-align: left;
  flex: 1;
  padding: var(--spacing-medium);
  border-left: var(--border-width) solid var(--border-color-secondary);
  overflow-y: auto;
  background-color: var(--bg-color-secondary);
  color: var(--text-color-primary);
  font-size: var(--font-size-small);
  line-height: var(--line-height-base);
}

</style>