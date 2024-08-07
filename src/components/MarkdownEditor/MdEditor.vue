<template>
  <div class="markdown-editor">
    <div class="editor-layout">
      <MarkdownEditorToolbar
          :enable-images="enableImages"
          :show-preview="showPreview"
          :theme="theme"
          :toolbar-actions="toolbarActions"
          @toggle-preview="togglePreview"
          @toggle-theme="toggleTheme"
          @clear-content="clearContent"
          @toggle-image-gallery="toggleImageGallery"
      />
      <div class="editor-content">
        <MdEditorContent
            :enable-images="enableImages"
            :model-value="content.text"
            :theme="theme"
            @update:model-value="updateContentText"
            @editor-ready="handleEditorReady"
            @image-drop="handleImageDrop"
        />
        <MarkdownEditorPreview
            v-if="showPreview"
            :rendered-content="renderedContent"
        />
      </div>
      <transition name="gallery-slide">
        <ImageGallery
            v-if="enableImages && showImageGallery"
            :images="content.images"
            :show="showImageGallery"
            @upload-images="handleImageUpload"
            @insert-image="insertImageToEditor"
            @remove-image="removeImage"
        />
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType, ref, Ref, watch} from 'vue'
import {MarkdownEditorContent, useMdEditor} from '@/composables/useMdEditor'
import {useMdEditorImageManagement} from '@/composables/useMdEditorImageManagement'
import {useMdEditorToolbar} from '@/composables/useMdEditorToolbar'
import {useTheme} from '@/composables/useTheme'
import MarkdownEditorToolbar from './MdEditorToolbar.vue'
import MdEditorContent from './MdEditorContent.vue'
import MarkdownEditorPreview from './MdEditorPreview.vue'
import MdEditorImageGallery from './MdEditorImageGallery.vue'
import {EditorView} from "@codemirror/view"

export default defineComponent({
  name: 'MarkdownEditor',
  components: {
    MarkdownEditorToolbar,
    MdEditorContent,
    MarkdownEditorPreview,
    ImageGallery: MdEditorImageGallery
  },
  props: {
    initialContent: {
      type: Object as PropType<MarkdownEditorContent>,
      required: true
    },
    enableImages: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue'],
  setup(props, {emit}) {
    const {
      content,
      showPreview,
      renderedContent,
      togglePreview,
      clearContent
    } = useMdEditor(props.initialContent, props.enableImages)

    const {
      showImageGallery,
      addImage,
      removeImage,
      toggleImageGallery
    } = useMdEditorImageManagement(props.initialContent.images, props.enableImages)

    const {theme, toggleTheme} = useTheme()

    const editorView: Ref<EditorView | null> = ref(null)

    watch(content, (newContent) => {
      emit('update:modelValue', newContent)
    }, {deep: true})

    const handleEditorReady = (payload: { view: EditorView }) => {
      editorView.value = payload.view as EditorView
    }

    const {insertText, toolbarActions} = useMdEditorToolbar(editorView)

    const updateContentText = (newText: string) => {
      content.value = {...content.value, text: newText}
    }

    const handleImageDrop = async (file: File) => {
      if (props.enableImages) {
        const newImage = await addImage(file)
        insertImageToEditor(newImage)
      }
    }

    const handleImageUpload = async (files: File[]) => {
      console.log(`Handling image upload on ${files}`)
      if (props.enableImages) {
        for (const file of files) {
          console.log(`Adding image ${file.name}`)
          await addImage(file)
        }
      }
    }

    const insertImageToEditor = (image: { id: string, name: string }) => {
      if (props.enableImages) {
        const imageMarkdown = `![${image.name}](${image.id})\n`
        insertText(imageMarkdown, '')
      }
    }

    const getContent = () => {
      return content.value
    }

    return {
      content,
      showPreview,
      renderedContent,
      theme,
      showImageGallery,
      toolbarActions,
      getContent,
      togglePreview,
      toggleTheme,
      clearContent,
      updateContentText,
      toggleImageGallery,
      handleEditorReady,
      handleImageDrop,
      handleImageUpload,
      insertImageToEditor,
      removeImage
    }
  }
})
</script>

<style scoped>
.markdown-editor {
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

.gallery-slide-enter-active,
.gallery-slide-leave-active {
  transition: transform 0.3s ease;
}

.gallery-slide-enter-from,
.gallery-slide-leave-to {
  transform: translateX(100%);
}
</style>