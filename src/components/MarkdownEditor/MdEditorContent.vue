<template>
  <div
      class="editor-container"
      @drop.prevent="handleDrop"
      @dragover.prevent
      @dragenter.prevent
  >
    <h3 class="editor-title">Markdown Editor</h3>
    <div class="editor-wrapper">
      <Codemirror
          v-model="modelValue"
          :extensions="extensions"
          @ready="handleReady"
      />
    </div>
  </div>
</template>

<script lang="ts">
import {computed, defineComponent} from 'vue'
import {Codemirror} from 'vue-codemirror'
import {markdown} from '@codemirror/lang-markdown'
import {oneDark} from '@codemirror/theme-one-dark'
import {EditorView} from '@codemirror/view'

export default defineComponent({
  name: 'MdEditorContent',
  components: {
    Codemirror
  },
  props: {
    modelValue: {
      type: String,
      required: true
    },
    theme: {
      type: String,
      required: true
    },
    enableImages: {
      type: Boolean,
      required: true
    }
  },
  emits: ['update:modelValue', 'editor-ready', 'image-drop'],
  setup(props, {emit}) {
    const extensions = computed(() => [
      markdown(),
      props.theme === 'dark' ? oneDark : [],
      EditorView.lineWrapping,
    ])

    const handleReady = (payload: { view: EditorView }) => {
      emit('editor-ready', payload)
    }

    const handleDrop = (event: DragEvent) => {
      if (props.enableImages && event.dataTransfer?.files.length) {
        const file = event.dataTransfer.files[0]
        if (file.type.startsWith('image/')) {
          emit('image-drop', file)
        }
      }
    }

    return {
      extensions,
      handleReady,
      handleDrop
    }
  }
})
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.editor-title {
  font-size: var(--font-size-base);
  padding: var(--spacing-small) var(--spacing-medium);
  margin: 0;
  background-color: var(--bg-color-tertiary);
  border-bottom: var(--border-width) solid var(--border-color-secondary);
  color: var(--text-color-secondary);
  font-weight: var(--font-weight-bold);
}

.editor-wrapper {
  text-align: left;
  flex: 1;
  overflow: auto;
}

.editor-content.split-view .editor-container {
  width: 50%;
}
</style>