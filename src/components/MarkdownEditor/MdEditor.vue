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

<script lang="ts">
import {defineComponent, inject, onMounted, onUnmounted, ref, watch} from 'vue'
import MdEditorToolbar from './MdEditorToolbar.vue'
import MdEditorContent from './MdEditorContent.vue'
import MdEditorPreview from './MdEditorPreview.vue'
import MdEditorImageGallery from './MdEditorImageGallery.vue'
import {useMdEditor} from '@/composables/useMdEditor'
import {MdImage, useMdImageManagement} from '@/composables/useMdImageManagement'
import {useMdToolbar} from '@/composables/useMdToolbar'
import {useTheme} from '@/composables/useTheme'
import {EditorView} from "@codemirror/view";
import {isEqual} from "lodash";

export interface EditorContent {
  text: string;
  images: MdImage[];
}

export default defineComponent({
  name: 'MdEditor',
  components: {
    MdEditorToolbar,
    MdEditorContent,
    MdEditorPreview,
    MdEditorImageGallery,
  },
  props: {
    initialContent: {
      type: Object as () => EditorContent,
      required: true,
    },
    modelValue: {
      type: Object as () => EditorContent,
      required: true,
    },
    enableImages: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, {emit}) {
    const showNotification = inject('showNotification') as (message: string, type: string, options?: object) => number;
    const updateNotification = inject('updateNotification') as (id: number, updates: object) => void;

    const {theme, toggleTheme} = useTheme()

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
    } = useMdEditor(props, emit, theme)

    const {
      showImageGallery,
      toggleImageGallery,
      handleImageUpload,
      addTempImage,
      insertImageToEditor,
      removeImage,
    } = useMdImageManagement(props.enableImages, editorView, tempImages, updateImageMap)

    const {toolbarActions, insertText} = useMdToolbar(editorView)

    const showPreview = ref(true)
    const togglePreview = () => {
      showPreview.value = !showPreview.value
    }

    const getContent = () => {
      return {text: localContent.value, images: tempImages.value}
    }

    const handleEditorReady = (payload: { view: EditorView; state: any }) => {
      handleReady(payload)
    }

    const handleImage = async (file: File, source: string) => {
      if (file && file.type.startsWith('image/')) {
        const notificationId = showNotification(`Adding ${source} image to gallery...`, 'loading');
        try {
          const insertToEditor = true
          await addTempImage(file, insertToEditor);
          updateNotification(notificationId, {
            message: 'Image added to gallery',
            type: 'success',
            isLoading: false
          });
        } catch (error) {
          updateNotification(notificationId, {
            message: `Error adding image: ${(error as Error).message}`,
            type: 'error',
            isLoading: false,
          });
        }
      } else {
        showNotification('Please provide a valid image file', 'error');
      }
    };

    const handleDropImage = (file: File) => handleImage(file, 'dropped');
    const handlePasteImage = (file: File) => handleImage(file, 'pasted');

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
      // if (editorView.value && props.enableImages) {
      //   editorView.value.dom.removeEventListener('paste', handlePaste)
      // }
    })

    return {
      theme,
      localContent,
      renderedContent,
      extensions,
      tempImages,
      showImageGallery,
      showPreview,
      toolbarActions,
      getContent,
      handleReady,
      handleEditorReady,
      clearContent,
      toggleImageGallery,
      handleImageUpload,
      insertImageToEditor,
      removeImage,
      toggleTheme,
      togglePreview,
      handleDropImage,
      handlePasteImage,
    }
  },
})
</script>

<style scoped>
.md-editor {
  border: var(--border-width) solid var(--border-color-secondary);
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