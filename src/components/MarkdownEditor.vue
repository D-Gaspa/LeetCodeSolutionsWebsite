<template>
  <div class="markdown-editor">
    <div class="editor-toolbar">
      <button v-for="action in toolbarActions" :key="action.label" @click="action.action">
        {{ action.label }}
      </button>
      <input ref="fileInput" accept="image/*" style="display: none;" type="file" @change="handleImageUpload">
      <button @click="$refs.fileInput.click()">Add Image</button>
    </div>
    <div :class="{ 'split-view': showPreview }" class="editor-content">
      <div class="editor-wrapper"
           @drop.prevent="handleDrop"
           @dragover.prevent="() => {}"
           @dragenter.prevent="() => {}">
        <textarea
            ref="editor"
            v-model="localContent"
            placeholder="Write your markdown here..."
            @input="updateContent"
            @select="handleSelection"
        ></textarea>
      </div>
      <div v-if="showPreview" class="preview" v-html="renderedContent"></div>
    </div>
  </div>
</template>

<script>
import {computed, onMounted, ref, watch} from 'vue'
import {marked} from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import {supabase} from '../services/supabase'

export default {
  name: 'MarkdownEditor',
  props: {
    modelValue: {
      type: Object
    }
  },
  emits: ['update:modelValue'],
  setup(props, {emit}) {
    const localContent = ref(props.modelValue.text || '')
    const showPreview = ref(true)
    const fileInput = ref(null)
    const editor = ref(null)

    const updateContent = () => {
      emit('update:modelValue', {text: localContent.value})
    }

    const togglePreview = () => {
      showPreview.value = !showPreview.value
    }

    const toolbarActions = [
      {label: 'Bold', action: () => wrapSelection('**', '**')},
      {label: 'Italic', action: () => wrapSelection('*', '*')},
      {label: 'Code', action: () => wrapSelection('`', '`')},
      {label: 'Link', action: () => wrapSelection('[', '](url)')},
      {label: 'Toggle Preview', action: togglePreview},
    ]

    const renderedContent = computed(() => {
      const renderer = new marked.Renderer()
      renderer.code = ({text, lang}) => {
        const validLanguage = hljs.getLanguage(lang) ? lang : 'plaintext'
        return `<pre><code class="hljs ${validLanguage}">${hljs.highlight(text, {language: validLanguage}).value}</code></pre>`
      }

      marked.setOptions({renderer})

      return DOMPurify.sanitize(marked(localContent.value))
    })

    const handleImageUpload = async (event) => {
      const file = event.target.files[0]
      await uploadImage(file)
    }

    const handleDrop = async (event) => {
      const file = event.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        await uploadImage(file)
      }
    }

    const uploadImage = async (file) => {
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`

      const {error} = await supabase.storage
          .from('problem-images')
          .upload(fileName, file)

      if (error) {
        console.error('Error uploading image:', error)
        return
      }

      const {publicURL, error: urlError} = supabase.storage
          .from('problem-images')
          .getPublicUrl(fileName)

      if (urlError) {
        console.error('Error getting public URL:', urlError)
        return
      }

      const imageMarkdown = `![${file.name}](${publicURL})`
      insertAtCursor(imageMarkdown)
      updateContent()
    }

    const insertAtCursor = (text) => {
      const textarea = editor.value
      const startPos = textarea.selectionStart
      const endPos = textarea.selectionEnd
      const before = localContent.value.substring(0, startPos)
      const after = localContent.value.substring(endPos, textarea.value.length)
      localContent.value = before + text + after
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = startPos + text.length
    }

    const wrapSelection = (before, after) => {
      const textarea = editor.value
      const startPos = textarea.selectionStart
      const endPos = textarea.selectionEnd
      const selectedText = localContent.value.substring(startPos, endPos)
      const replacement = before + selectedText + after
      localContent.value = localContent.value.substring(0, startPos) + replacement + localContent.value.substring(endPos)
      updateContent()
      textarea.focus()
      textarea.selectionStart = startPos + before.length
      textarea.selectionEnd = startPos + replacement.length - after.length
    }

    const handleSelection = () => {
      // This function can be used to update toolbar states based on current selection
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
    })

    return {
      localContent,
      showPreview,
      renderedContent,
      updateContent,
      togglePreview,
      handleImageUpload,
      handleDrop,
      fileInput,
      editor,
      toolbarActions,
      handleSelection
    }
  }
}
</script>

<style scoped>
.markdown-editor {
  border: 1px solid #ccc;
  border-radius: 4px;
}

.editor-toolbar {
  padding: 10px;
  border-bottom: 1px solid #ccc;
}

.editor-toolbar button {
  margin-right: 5px;
}

.editor-content {
  display: flex;
  height: 400px;
}

.editor-wrapper {
  flex: 1;
  position: relative;
}

.editor-wrapper textarea {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  resize: none;
  border: none;
  padding: 10px;
  font-family: 'Courier New', Courier, monospace;
}

.editor-content.split-view .editor-wrapper {
  width: 50%;
}

.preview {
  flex: 1;
  padding: 10px;
  border-left: 1px solid #ccc;
  overflow-y: auto;
}

/* Add styles for syntax highlighting
:deep(.hljs) {
  background: #f0f0f0;
  padding: 10px;
  border-radius: 4px;
}
*/
</style>