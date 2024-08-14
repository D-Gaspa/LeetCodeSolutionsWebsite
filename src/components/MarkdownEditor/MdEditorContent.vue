<template>
  <div class="editor-container">
    <h3 class="editor-title">Markdown Editor</h3>
    <div
        class="editor-wrapper"
        @drop.prevent="handleDrop"
        @dragover.prevent
        @dragenter.prevent
    >
      <Codemirror
          v-model="localContent"
          :extensions="extensions"
          @change="handleChange"
          @ready="handleReady"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import {onBeforeUnmount, ref, watch} from 'vue'
import {Codemirror} from 'vue-codemirror'
import type {EditorView} from '@codemirror/view'
import type {Extension} from '@codemirror/state'

const props = defineProps<{
  modelValue: string
  extensions: Extension[]
  enableImages: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'ready', payload: { view: EditorView }): void
  (e: 'drop-image', file: File): void
  (e: 'paste-image', file: File): void
}>()

const localContent = ref(props.modelValue)
const editorView = ref<EditorView | null>(null)

watch(() => props.modelValue, (newValue) => {
  if (newValue !== localContent.value) {
    localContent.value = newValue
  }
})

const handleReady = (payload: { view: EditorView }) => {
  editorView.value = payload.view
  emit('ready', payload)

  if (props.enableImages) {
    editorView.value.dom.addEventListener('paste', handlePaste)
  }
}

const handleChange = (value: string) => {
  localContent.value = value
  emit('update:modelValue', value)
}

const handleDrop = (event: DragEvent) => {
  if (props.enableImages && event.dataTransfer?.files.length) {
    const file = event.dataTransfer.files[0]
    if (file.type.startsWith('image/')) {
      emit('drop-image', file)
    }
  }
}

const handlePaste = (event: ClipboardEvent) => {
  if (props.enableImages && event.clipboardData) {
    const items = event.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          emit('paste-image', file)
          event.preventDefault() // Prevent default paste behavior
          break
        }
      }
    }
  }
}

onBeforeUnmount(() => {
  if (editorView.value) {
    editorView.value.dom.removeEventListener('paste', handlePaste)
  }
})
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  transition: all var(--transition-base);
}

.editor-title {
  font-size: var(--font-size-base);
  padding: var(--spacing-small) var(--spacing-medium);
  margin: 0;
  background-color: var(--bg-color-tertiary);
  border-bottom: var(--border-width) solid var(--border-color-secondary);
  color: var(--text-color-secondary);
  font-weight: var(--font-weight-bold);
  transition: all var(--transition-base);
}

.editor-wrapper {
  text-align: left;
  flex: 1;
  overflow: auto;
}

:deep(.cm-editor),
:deep(.cm-scroller),
:deep(.cm-content),
:deep(.cm-line),
:deep(.cm-gutters),
:deep(.cm-gutterElement) {
  transition: background-color var(--transition-base);
}

:deep(.cm-editor) {
  height: 100%;
  background-color: var(--bg-color-secondary);
}

:deep(.cm-gutters) {
  border-right: none;
}

:deep(.cm-foldPlaceholder) {
  background-color: var(--bg-color-secondary);
  border: var(--border-width) solid var(--border-color-secondary);
  border-radius: var(--border-radius);
  transition: all var(--transition-base);
}
</style>