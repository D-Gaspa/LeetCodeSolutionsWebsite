<template>
  <div class="python-editor-container">
    <h3 class="editor-title">Python Code Editor</h3>
    <div class="editor-wrapper">
      <Codemirror
          v-model="localContent"
          :extensions="computedExtensions"
          @change="handleChange"
          @ready="handleReady"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed, ref, watch} from 'vue'
import {Codemirror} from 'vue-codemirror'
import {python} from '@codemirror/lang-python'
import {EditorView} from '@codemirror/view'
import {Extension} from '@codemirror/state'
import {oneDark} from '@codemirror/theme-one-dark'
import {basicSetup} from 'codemirror'

const props = defineProps<{
  modelValue: string
  theme: 'light' | 'dark'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'ready', payload: { view: EditorView }): void
}>()

const localContent = ref(props.modelValue)
const editorView = ref<EditorView | null>(null)

const baseExtensions: Extension[] = [
  basicSetup,
  python(),
  EditorView.lineWrapping,
]

const computedExtensions = computed(() => {
  return props.theme === 'dark'
      ? [...baseExtensions, oneDark]
      : baseExtensions
})

watch(() => props.modelValue, (newValue) => {
  if (newValue !== localContent.value) {
    localContent.value = newValue
  }
})

const handleReady = (payload: { view: EditorView }) => {
  editorView.value = payload.view
  emit('ready', payload)
}

const handleChange = (value: string) => {
  localContent.value = value
  emit('update:modelValue', value)
}
</script>

<style scoped>
.python-editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
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
  flex: 1;
  overflow: auto;
}

:deep(.cm-editor) {
  height: 100%;
}

:deep(.cm-scroller) {
  overflow: auto;
}

:deep(.cm-gutters) {
  border-right: 1px solid var(--border-color-secondary);
}

:deep(.cm-activeLineGutter) {
  background-color: var(--bg-color-tertiary);
}
</style>