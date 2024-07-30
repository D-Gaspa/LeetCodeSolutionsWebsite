<template>
  <div class="markdown-editor">
    <div class="editor-layout">
      <div class="editor-toolbar">
        <button v-for="action in toolbarActions" :key="action.label" :title="action.label" @click="action.action">
          <component :is="action.icon"/>
        </button>
        <input ref="fileInput" accept="image/*" style="display: none;" type="file" @change="handleImageUpload">
        <button title="Add Image" @click="$refs.fileInput.click()">
          <ImageIcon/>
        </button>
        <button title="Clear Content" @click="clearContent">
          <TrashIcon/>
        </button>
        <button title="Toggle Preview" @click="togglePreview">
          <EyeIcon v-if="showPreview"/>
          <EyeOffIcon v-else/>
        </button>
      </div>
      <div :class="{ 'split-view': showPreview }" class="editor-content">
        <div class="editor-wrapper"
             @drop.prevent="handleDrop"
             @dragover.prevent="() => {}"
             @dragenter.prevent="() => {}">
          <Codemirror
              v-model="localContent"
              :extensions="extensions"
              @ready="handleReady"
          />
        </div>
        <div v-if="showPreview" class="preview" v-html="renderedContent"></div>
      </div>
    </div>
    <div v-if="tempImages.length > 0" class="image-gallery">
      <h3 class="gallery-title">Uploaded Images</h3>
      <div class="gallery-content">
        <div v-for="(image, index) in tempImages" :key="image.id" class="image-item">
          <img :alt="image.name" :src="image.url" class="thumbnail">
          <div class="image-info">
            <span class="image-name">{{ image.name }}</span>
            <div class="image-actions">
              <button @click="insertImageToEditor(image)">Insert</button>
              <button @click="removeImage(index)">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {computed, onMounted, ref, watch} from 'vue'
import {Codemirror} from 'vue-codemirror'
import {markdown} from '@codemirror/lang-markdown'
import {oneDark} from '@codemirror/theme-one-dark'
import {EditorView} from '@codemirror/view'
import MarkdownIt from 'markdown-it'
import MarkdownItKatex from '@vscode/markdown-it-katex'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import 'katex/dist/katex.min.css'
import {
  BoldIcon,
  CodeIcon,
  EyeIcon,
  EyeOffIcon,
  FunctionSquareIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  TrashIcon,
  TypeIcon
} from 'lucide-vue-next'

export default {
  name: 'MarkdownEditor',
  components: {
    Codemirror,
    BoldIcon, ItalicIcon, CodeIcon, LinkIcon,
    ImageIcon, TrashIcon, EyeIcon, EyeOffIcon,
    TypeIcon, FunctionSquareIcon
  },
  props: {
    modelValue: {
      type: Object
    }
  },
  emits: ['update:modelValue', 'save-images'],
  setup(props, {emit}) {
    const localContent = ref(props.modelValue.text || '')
    const showPreview = ref(true)
    const fileInput = ref(null)
    const editorView = ref(null)
    const tempImages = ref([])
    const imageMap = ref(new Map())

    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(str, {language: lang}).value
          } catch (__) {
          }
        }
        return '' // use external default escaping
      }
    }).use(MarkdownItKatex)

    const extensions = [
      markdown(),
      oneDark,
      EditorView.lineWrapping,
    ]

    const handleReady = (payload) => {
      editorView.value = payload.view
    }

    const updateContent = (value) => {
      localContent.value = value
      emit('update:modelValue', {text: value, images: tempImages.value})
    }

    const togglePreview = () => {
      showPreview.value = !showPreview.value
    }

    const clearContent = () => {
      localContent.value = ''
      tempImages.value = []
      imageMap.value.clear()
    }

    const toolbarActions = [
      {label: 'Bold', action: () => insertText('**', '**'), icon: BoldIcon},
      {label: 'Italic', action: () => insertText('*', '*'), icon: ItalicIcon},
      {label: 'Code', action: () => insertText('`', '`'), icon: CodeIcon},
      {label: 'Link', action: () => insertText('[', '](url)'), icon: LinkIcon},
      {label: 'Inline Equation', action: () => insertText('$', '$'), icon: TypeIcon},
      {label: 'Block Equation', action: () => insertText('$$\n', '\n$$'), icon: FunctionSquareIcon},
    ]

    const renderedContent = computed(() => {
      return md.render(localContent.value)
    })

    const handleImageUpload = async (event) => {
      const file = event.target.files[0]
      if (file) {
        await addTempImage(file)
        // Reset the file input to allow re-uploading of the same file
        if (fileInput.value) {
          fileInput.value.value = ''
        }
      }
    }

    const handleDrop = async (event) => {
      const file = event.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        await addTempImage(file)
      }
    }

    const addTempImage = async (file) => {
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageId = `image-${Date.now()}-${file.name.replace(/\s+/g, '-')}`
        const newImage = {
          id: imageId,
          file: file,
          name: file.name,
          url: e.target.result
        }

        // Check if an image with the same name already exists
        const existingIndex = tempImages.value.findIndex(img => img.name === file.name)
        if (existingIndex !== -1) {
          // Replace the existing image
          tempImages.value.splice(existingIndex, 1, newImage)
        } else {
          // Add the new image
          tempImages.value.push(newImage)
        }

        imageMap.value.set(imageId, newImage)
      }
      reader.readAsDataURL(file)
    }

    const insertImageToEditor = (image) => {
      const imageMarkdown = `![${image.name}](${image.id})`
      insertText(imageMarkdown, '')

      // Update the markdown-it renderer to replace the unique identifier with the actual image URL
      md.renderer.rules.image = function (tokens, idx) {
        const token = tokens[idx]
        const srcIndex = token.attrIndex('src')
        let src = token.attrs[srcIndex][1]
        const alt = token.content || ''

        const matchingImage = imageMap.value.get(src)
        if (matchingImage) {
          src = matchingImage.url
        }

        return `<img src="${src}" alt="${alt}" style="max-width: 100%; width: 300px;">`;
      }
    }

    const removeImage = (index) => {
      const image = tempImages.value[index]

      // Remove the image from the tempImages array
      tempImages.value.splice(index, 1)

      // Remove the image from the imageMap
      imageMap.value.delete(image.id)

      // If the image URL is an object URL, revoke it
      if (image.url.startsWith('blob:')) {
        URL.revokeObjectURL(image.url)
      }

      // Trigger reactivity
      tempImages.value = [...tempImages.value]

      // Re-render the preview to remove the deleted image
      localContent.value = localContent.value.replace(`![${image.name}](${image.id})`, '')
    }

    const insertText = (before, after) => {
      if (!editorView.value) return

      const selection = editorView.value.state.selection.main
      const insertedText = before + editorView.value.state.sliceDoc(selection.from, selection.to) + after

      editorView.value.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: insertedText
        },
        selection: {anchor: selection.from + before.length}
      })

      editorView.value.focus()
    }

    const saveImages = () => {
      emit('save-images', tempImages.value)
    }

    watch(() => props.modelValue.text, (newValue) => {
      if (newValue !== localContent.value) {
        localContent.value = newValue
      }
    })

    onMounted(() => {
      if (props.modelValue && props.modelValue.text) {
        localContent.value = props.modelValue.text
      }
      if (props.modelValue && props.modelValue.images) {
        tempImages.value = props.modelValue.images
      }
    })

    return {
      localContent,
      showPreview,
      renderedContent,
      updateContent,
      togglePreview,
      clearContent,
      handleImageUpload,
      handleDrop,
      fileInput,
      toolbarActions,
      extensions,
      handleReady,
      tempImages,
      insertImageToEditor,
      removeImage,
      saveImages
    }
  }
}
</script>

<style scoped>
.markdown-editor {
  border: 1px solid #ccc;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 80vh;
}

.editor-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}

.editor-toolbar {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #ccc;
  background-color: #f5f5f5;
}

.editor-toolbar button {
  margin: 0;
  padding: 10px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.editor-toolbar button:hover {
  background-color: #e0e0e0;
}

.editor-content {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.editor-wrapper {
  text-align: left;
  flex: 1;
  position: relative;
  overflow: auto;
}

.editor-content.split-view .editor-wrapper {
  width: 50%;
}

.preview {
  text-align: left;
  flex: 1;
  padding-left: 10px;
  padding-right: 10px;
  border-left: 1px solid #ccc;
  overflow-y: auto;
}

.image-gallery {
  margin-top: 10px;
  background-color: #f5f5f5;
  border-top: 1px solid #ccc;
  padding: 15px;
  overflow-y: auto;
  max-height: 30%;
}

.gallery-title {
  text-align: left;
  margin-bottom: 10px;
  color: #333;
  margin-top: 0;
}

.gallery-content {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.image-item {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  width: 100px;
}

.thumbnail {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.image-info {
  margin-top: 10px;
}

.image-name {
  display: block;
  font-size: 0.9em;
  margin-bottom: 5px;
  word-break: break-all;
}

.image-actions {
  display: flex;
  justify-content: space-between;
}

.image-actions button {
  flex: 1;
  padding: 5px;
  font-size: 0.8em;
}
</style>