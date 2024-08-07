<template>
  <div class="markdown-editor">
    <div class="editor-layout">
      <div class="editor-toolbar">
        <h3 class="toolbar-title">Tools</h3>
        <button v-for="action in toolbarActions" :key="action.label" :title="action.label" @click="action.action">
          <component :is="action.icon"/>
        </button>
        <button class="btn-neutral" title="Toggle Image Gallery" @click="toggleImageGallery">
          <ImageIcon :size="20"/>
        </button>
        <button title="Clear Content" @click="clearContent">
          <TrashIcon/>
        </button>
        <button title="Toggle Preview" @click="togglePreview">
          <EyeIcon v-if="showPreview"/>
          <EyeOffIcon v-else/>
        </button>
        <button class="btn-neutral" title="Toggle Theme" @click="toggleTheme">
          <SunIcon v-if="theme === 'dark'" :size="20"/>
          <MoonIcon v-else :size="20"/>
        </button>
      </div>
      <div :class="{ 'with-gallery': showImageGallery }" class="editor-content">
        <div class="editor-container">
          <h3 class="editor-title">Markdown Editor</h3>
          <div class="editor-wrapper"
               @drop.prevent="handleDrop"
               @dragover.prevent="() => {}"
               @dragenter.prevent="() => {}">
            <Codemirror
                v-if="editorKey"
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
      <div v-if="showImageGallery" class="image-gallery">
        <input ref="fileInput" accept="image/*" multiple style="display: none;" type="file"
               @change="handleImageUpload">
        <button class="btn-primary" @click="$refs.fileInput.click()">Upload Images</button>
        <div class="gallery-content">
          <div v-for="(image, index) in tempImages" :key="image.id" class="image-item">
            <img :alt="image.name" :src="image.url" class="thumbnail" @click="insertImageToEditor(image)">
            <button class="btn-danger delete-image-btn" @click="removeImage(index)">Remove</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {computed, onMounted, onUnmounted, ref, watch} from 'vue'
import {useTheme} from "@/composables/useTheme.js";
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
  MoonIcon,
  SunIcon,
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
    TypeIcon, FunctionSquareIcon, ChevronUpIcon, ChevronDownIcon,
    MoonIcon, SunIcon
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
    const {theme, toggleTheme} = useTheme()
    const editorKey = ref(0)
    const localContent = ref(props.initialContent.text || props.modelValue.text || '')
    const tempImages = ref(props.initialContent.images || props.modelValue.images || [])
    const showPreview = ref(true)
    const fileInput = ref(null)
    const editorView = ref(null)
    const editorRef = ref(null)
    const imageMap = ref(new Map())
    const showImageGallery = ref(false)

    const toggleImageGallery = () => {
      showImageGallery.value = !showImageGallery.value
    }

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

    const extensions = computed(() => [
      markdown(),
      theme.value === 'dark' ? oneDark : [],
      EditorView.lineWrapping,
    ])

    watch(theme, () => {
      // Force re-render of the Codemirror component
      editorKey.value += 1
    })

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
      const files = event.target.files;
      for (let i = 0; i < files.length; i++) {
        await addTempImage(files[i]);
      }
      // Reset the file input to allow re-uploading of the same file
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    };

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
      }
      reader.readAsDataURL(file)

      updateImageMap()
    }

    const insertImageToEditor = (image) => {
      const imageMarkdown = `![${image.name}](${image.id})\n`
      insertText(imageMarkdown, '')

      // Add the image to tempImages if it's not already there
      if (!tempImages.value.some(img => img.id === image.id)) {
        tempImages.value.push(image)
      }

      updateImageMap()
    }

    const removeImage = (index) => {
      const image = tempImages.value[index];

      // Remove all occurrences of the image from the Markdown content
      const imageRegex = new RegExp(`!\\[${image.name}\\]\\(${image.id}\\)`, 'g');
      localContent.value = localContent.value.replace(imageRegex, '');

      // Remove the image from the tempImages array
      tempImages.value.splice(index, 1);

      // Remove the image from the imageMap
      imageMap.value.delete(image.id);

      // If the image URL is an object URL, revoke it
      if (image.url.startsWith('blob:')) {
        URL.revokeObjectURL(image.url);
      }

      // Trigger reactivity
      tempImages.value = [...tempImages.value];

      updateImageMap();
    };

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

    watch(() => props.modelValue.text, (newValue) => {
      if (newValue !== localContent.value) {
        localContent.value = newValue
      }
    })

    onMounted(() => {
      // Set the editor for the first time
      editorKey.value += 1

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
      theme,
      editorKey,
      showImageGallery,
      toggleImageGallery,
      toggleTheme,
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
  display: flex;
  flex: 1;
  min-height: 0;
}

.editor-toolbar {
  display: flex;
  flex-direction: column;
  border-right: var(--border-width) solid var(--border-color-secondary);
  background-color: var(--bg-color-tertiary);
  min-width: 50px;
  overflow-y: auto;
  transition: all var(--transition-base);
}

.toolbar-title {
  font-size: var(--font-size-small);
  text-align: center;
  margin-bottom: var(--spacing-small);
  color: var(--text-color-secondary);
}

.editor-toolbar button {
  margin: 0;
  padding: var(--spacing-small);
  background: none;
  border: none;
  border-radius: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
  color: var(--text-color-primary);
}

.editor-toolbar button:hover {
  background-color: var(--button-hover-neutral);
}

.editor-content {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.editor-content.with-gallery {
  width: calc(100% - 200px);
}

.editor-container, .preview-container {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.editor-title, .preview-title {
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

.preview {
  text-align: left;
  flex: 1;
  padding: var(--spacing-medium);
  border-left: var(--border-width) solid var(--border-color-secondary);
  overflow-y: auto;
  background-color: var(--bg-color-secondary);
  color: var(--text-color-primary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
}

.image-gallery {
  width: 150px;
  min-width: 120px;
  border-left: var(--border-width) solid var(--border-color-secondary);
  background-color: var(--bg-color-tertiary);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.image-gallery button {
  margin: 10px;
}

.gallery-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-small);
}

.image-item {
  display: flex;
  flex-direction: column;
  border: var(--border-width) solid var(--border-color-secondary);
  border-radius: var(--border-radius);
  background-color: var(--button-bg-neutral);
  margin-bottom: var(--spacing-small);
  text-align: center;
  padding: var(--spacing-small);
  align-items: center;
  transition: all var(--transition-base);
  cursor: pointer;
}

.image-item:hover:not(:has(.delete-image-btn:hover)) {
  border-color: var(--input-focus);
  box-shadow: 0 0 0 2px rgba(var(--input-focus), 0.2);
}

.thumbnail {
  max-width: 100%;
  height: auto;
  cursor: pointer;
  border-radius: var(--border-radius);
}
</style>