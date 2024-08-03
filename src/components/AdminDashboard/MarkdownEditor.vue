<template>
  <div class="markdown-editor">
    <div class="editor-layout">
      <div class="editor-toolbar">
        <h3 class="toolbar-title">Tools</h3>
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
        <div class="editor-container">
          <h3 class="editor-title">Markdown Editor</h3>
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
        </div>
        <div v-if="showPreview" class="preview-container">
          <h3 class="preview-title">Preview</h3>
          <div class="preview" v-html="renderedContent"></div>
        </div>
      </div>
    </div>
    <div v-if="tempImages.length > 0" :class="{ 'collapsed': isGalleryCollapsed }" class="image-gallery">
      <div class="gallery-header" @click="toggleGallery">
        <h3 class="gallery-title">Uploaded Images</h3>
        <button class="collapse-button">
          <ChevronDownIcon v-if="!isGalleryCollapsed"/>
          <ChevronUpIcon v-else/>
        </button>
      </div>
      <div v-show="!isGalleryCollapsed" class="gallery-content">
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
import {computed, onMounted, onUnmounted, ref, watch} from 'vue'
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
  ChevronDownIcon,
  ChevronUpIcon,
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
import {isEqual} from "lodash";

export default {
  name: 'MarkdownEditor',
  components: {
    Codemirror,
    BoldIcon, ItalicIcon, CodeIcon, LinkIcon,
    ImageIcon, TrashIcon, EyeIcon, EyeOffIcon,
    TypeIcon, FunctionSquareIcon, ChevronUpIcon, ChevronDownIcon
  },
  props: {
    initialContent: {
      type: Object
    },
    modelValue: {
      type: Object
    }
  },
  emits: ['update:modelValue'],
  setup(props) {
    const localContent = ref(props.initialContent.text || props.modelValue.text || '')
    const tempImages = ref(props.initialContent.images || props.modelValue.images || [])
    const showPreview = ref(true)
    const fileInput = ref(null)
    const editorView = ref(null)
    const editorRef = ref(null)
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

    const setupImageRenderer = () => {
      md.renderer.rules.image = (tokens, idx) => {
        const token = tokens[idx]
        const srcIndex = token.attrIndex('src')
        let src = token.attrs[srcIndex][1]
        const alt = token.content || ''

        const matchingImage = imageMap.value.get(src) || tempImages.value.find(img => img.id === src || img.url === src)
        if (matchingImage) {
          src = matchingImage.url
        }

        return `<img src="${src}" alt="${alt}" style="max-width: 100%; width: 300px;">`
      }
    }

    const initializeContent = () => {
      localContent.value = props.initialContent.text || props.modelValue.text || ''
      tempImages.value = (props.initialContent.images || props.modelValue.images || []).map(img => ({
        id: img.id || img.url,
        name: img.name,
        url: img.url,
        file: img.file || null // Preserve the file object for new images, null for existing ones
      }))
      updateImageMap()
    }

    const updateImageMap = () => {
      imageMap.value.clear()
      tempImages.value.forEach(image => {
        imageMap.value.set(image.id, image)
        imageMap.value.set(image.url, image)
      })
      setupImageRenderer()
    }

    initializeContent() // Initialize the content when the component is first mounted

    watch(() => props.initialContent, (newContent) => {
      if (newContent && (newContent.text !== localContent.value || !isEqual(newContent.images, tempImages.value))) {
        initializeContent()
      }
    }, {deep: true})

    watch(() => props.modelValue, (newValue) => {
      if (newValue.text !== localContent.value) {
        localContent.value = newValue.text
      }
      if (!isEqual(newValue.images, tempImages.value)) {
        tempImages.value = newValue.images
        updateImageMap()
      }
    }, {deep: true})

    const extensions = [
      markdown(),
      oneDark,
      EditorView.lineWrapping,
    ]

    const handleReady = (payload) => {
      editorView.value = payload.view
      editorRef.value = payload.state.doc

      payload.view.dom.addEventListener('paste', handlePaste)
    }

    const togglePreview = () => {
      showPreview.value = !showPreview.value
    }

    const getContent = () => {
      return {
        text: localContent.value,
        images: tempImages.value
      }
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

    const handlePaste = async (event) => {
      const items = event.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          event.preventDefault();
          const blob = items[i].getAsFile();
          await addTempImage(blob);
          break;
        }
      }
    }

    const addTempImage = async (file) => {
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageId = `${file.name.replace(/\s+/g, '-')}`
        const newImage = {
          id: imageId,
          file: file,
          name: imageId,
          url: e.target.result
        }

        const existingIndex = tempImages.value.findIndex(img => img.name === newImage.name)
        if (existingIndex !== -1) {
          tempImages.value.splice(existingIndex, 1, newImage)
        } else {
          tempImages.value.push(newImage)
        }

        imageMap.value.set(imageId, newImage)

        // Automatically insert the pasted image into the editor
        insertImageToEditor(newImage)
      }
      reader.readAsDataURL(file)

      updateImageMap()
    }

    const insertImageToEditor = (image) => {
      const imageMarkdown = `![${image.name}](${image.id})`
      insertText(imageMarkdown, '')

      // Add the image to tempImages if it's not already there
      if (!tempImages.value.some(img => img.id === image.id)) {
        tempImages.value.push(image)
      }

      updateImageMap()
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
      localContent.value = localContent.value.replace(`![${image.name}](${image.id})`, '') // For newly added images
      localContent.value = localContent.value.replace(`![${image.name}](${image.url})`, '') // For existing images

      updateImageMap()
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

    const isGalleryCollapsed = ref(false)
    const toggleGallery = () => {
      isGalleryCollapsed.value = !isGalleryCollapsed.value
    }

    const handleKeyboardShortcuts = (event) => {
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
        }
      }
    }

    watch(() => props.modelValue.text, (newValue) => {
      if (newValue !== localContent.value) {
        localContent.value = newValue
      }
    })

    onMounted(() => {
      initializeContent()
      document.addEventListener('keydown', handleKeyboardShortcuts)
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyboardShortcuts)
      if (editorView.value) {
        editorView.value.dom.removeEventListener('paste', handlePaste)
      }
    })

    return {
      localContent,
      showPreview,
      renderedContent,
      fileInput,
      toolbarActions,
      extensions,
      tempImages,
      isGalleryCollapsed,
      getContent,
      toggleGallery,
      handleKeyboardShortcuts,
      togglePreview,
      clearContent,
      handleImageUpload,
      handleDrop,
      handlePaste,
      handleReady,
      insertImageToEditor,
      removeImage,
    }
  }
}
</script>

<style scoped>
.markdown-editor {
  border: 1px solid #ccc;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 80vh;
  background-color: #f8f9fa;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
  background-color: #e9ecef;
  min-width: 50px;
  overflow-y: auto;
}

.toolbar-title {
  font-size: 0.8em;
  text-align: center;
  margin-bottom: 10px;
  color: #495057;
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
  background-color: #ced4da;
}

.editor-content {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.editor-container, .preview-container {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.editor-title, .preview-title {
  font-size: 1em;
  padding: 10px;
  margin: 0;
  background-color: #e9ecef;
  border-bottom: 1px solid #ccc;
  color: #495057;
}

.editor-wrapper {
  text-align: left;
  flex: 1;
  overflow: auto;
}

.editor-content.split-view .editor-container {
  width: 50%;
}

.preview {
  text-align: left;
  flex: 1;
  padding-left: 10px;
  padding-right: 10px;
  border-left: 1px solid #ccc;
  overflow-y: auto;
  background-color: #fff;
}

.image-gallery {
  background-color: #e9ecef;
  border-top: 1px solid #ccc;
  transition: max-height 0.3s ease;
  max-height: 35%;
  overflow-y: auto;
}

.image-gallery.collapsed {
  max-height: 50px;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.gallery-header:hover {
  background-color: #dee2e6;
}

.gallery-title {
  margin: 0;
  color: #495057;
}

.collapse-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: #495057;
}

.gallery-content {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding: 15px;
  max-height: calc(35% - 50px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.collapsed .gallery-content {
  opacity: 0;
  transform: translateY(-20px);
}

.image-item {
  background-color: white;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 10px;
  width: auto;
  height: fit-content;
  max-width: 100px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.image-item:hover {
  filter: brightness(0.85);
}

.thumbnail {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.image-info {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.image-name {
  display: block;
  font-size: 0.8em;
  margin-bottom: 5px;
  word-break: break-all;
  color: #495057;
}

.image-actions {
  display: flex;
  justify-content: space-between;
  margin-top: auto;
}

.image-actions button {
  flex: 1;
  padding: 5px;
  font-size: 0.7em;
  background-color: #e9ecef;
  border: 1px solid #ced4da;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.image-actions button:hover {
  background-color: #ced4da;
}
</style>