<template>
  <div class="md-editor">
    <div class="editor-layout">
      <MdEditorToolbar
          :actions="toolbarActions"
          :enable-images="enableImages"
          :show-preview="showPreview"
          :theme="theme"
          @toggle-preview="togglePreview"
          @toggle-image-gallery="toggleImageGallery"
          @toggle-theme="toggleTheme"
          @clear-content="clearContent"
      />
      <div class="editor-content">
        <MdEditorContent
            v-model="localContent"
            :enable-images="enableImages"
            :extensions="extensions"
            @ready="handleReady"
            @drop-image="handleDropImage"
            @paste-image="handlePasteImage"
        />
        <MdEditorPreview
            v-if="showPreview"
            :content="renderedContent"
        />
      </div>
      <transition name="gallery-slide">
        <MdEditorImageGallery
            v-if="enableImages && showImageGallery"
            :images="tempImages"
            @insert="insertImageToEditor"
            @remove="removeImage"
            @upload="handleImageUpload"
        />
      </transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, ref, watch} from 'vue'
import MdEditorImageGallery from './MdEditorImageGallery.vue'
import MdEditorToolbar from './MdEditorToolbar.vue'
import MdEditorContent from './MdEditorContent.vue'
import MdEditorPreview from './MdEditorPreview.vue'
import {useMdImageManagement} from '@/composables/MarkdownEditor/useMdImageManagement'
import {useMdToolbar} from '@/composables/MarkdownEditor/useMdToolbar'
import {useMdEditor} from '@/composables/MarkdownEditor/useMdEditor'
import {useNotification} from "@/composables/Common/useNotification"
import {useTheme} from '@/composables/Common/useTheme'
import type {ProblemContent} from "@/types/Problem"
import {isEqual} from "lodash"

const props = defineProps<{
  initialContent: ProblemContent
  modelValue: ProblemContent
  enableImages: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ProblemContent): void
}>()

const {theme, toggleTheme} = useTheme()
const {showNotification, updateNotification} = useNotification()

const {
  localContent,
  tempImages,
  renderedContent,
  extensions,
  editorView,
  handleReady,
  clearContent,
  initializeContent,
  updateImageMap,
} = useMdEditor(props, emit, theme, showNotification)

const {
  showImageGallery,
  toggleImageGallery,
  handleImageUpload,
  addTempImage,
  insertImageToEditor,
  removeImage,
} = useMdImageManagement(props.enableImages, editorView, tempImages, updateImageMap, {
  showNotification,
  updateNotification
})

const {toolbarActions, insertText} = useMdToolbar(editorView)

const showPreview = ref(true)
const togglePreview = () => {
  showPreview.value = !showPreview.value
}

const getContent = (): ProblemContent => {
  return {text: localContent.value, images: tempImages.value}
}

const handleImage = async (file: File, source: string) => {
  if (file && file.type.startsWith('image/')) {
    const notificationId = showNotification(`Adding ${source} image to gallery...`, 'loading')
    try {
      const insertToEditor = true
      await addTempImage(file, insertToEditor)
      updateNotification(notificationId, {
        message: 'Image added successfully',
        type: 'success',
        isLoading: false
      })
    } catch (error) {
      updateNotification(notificationId, {
        message: `Error adding image: ${(error as Error).message}`,
        type: 'error',
        isLoading: false,
      })
    }
  } else {
    showNotification('Please provide a valid image file', 'error')
  }
}

const handleDropImage = (file: File) => handleImage(file, 'dropped')
const handlePasteImage = (file: File) => handleImage(file, 'pasted')

const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case 'b':
        event.preventDefault()
        insertText('**', '**')
        break
      case 'i':
        event.preventDefault()
        insertText('*', '*')
        break
      case 'k':
        event.preventDefault()
        insertText('[', '](url)')
        break
      case '`':
        event.preventDefault()
        insertText('`', '`')
        break
      case 'e':
        event.preventDefault()
        insertText('$', '$')
        break
      case 'q':
        event.preventDefault()
        insertText('$$\n', '\n$$')
        break
      case 'g':
        event.preventDefault()
        toggleImageGallery()
        break
    }
  }
}

watch(() => props.modelValue, (newValue) => {
  if (newValue.text !== localContent.value) {
    localContent.value = newValue.text
  }
  if (!isEqual(newValue.images, tempImages.value)) {
    tempImages.value = newValue.images
    updateImageMap()
  }
}, {deep: true})

onMounted(() => {
  initializeContent()
  document.addEventListener('keydown', handleKeyboardShortcuts)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboardShortcuts)
})

defineExpose({
  getContent,
})
</script>

<style scoped>
.md-editor {
  border: var(--border-width) solid var(--border-color-secondary);
  border-radius: var(--border-radius);
  display: flex;
  flex-direction: column;
  height: 70vh;
  max-height: 70vh;
  background-color: var(--bg-color-secondary);
  box-shadow: var(--shadow-small);
  transition: all var(--transition-base);
  overflow-y: auto;
}

.editor-layout {
  position: relative;
  overflow: hidden;
  display: flex;
  flex: 1;
  min-height: 0;
}

.editor-content {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.editor-content.split-view .editor-container {
  width: 50%;
}

.gallery-slide-enter-active,
.gallery-slide-leave-active {
  transition: transform 0.3s ease;
}

.gallery-slide-enter-from,
.gallery-slide-leave-to {
  transform: translateX(100%);
}
</style>