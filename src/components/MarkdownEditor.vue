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
        <Codemirror
            v-model="localContent"
            :extensions="extensions"
            @ready="handleReady"
        />
      </div>
      <div v-if="showPreview" class="preview" v-html="renderedContent"></div>
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
import {supabase} from '../services/supabase'

export default {
  name: 'MarkdownEditor',
  components: {
    Codemirror
  },
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
    const editorView = ref(null)

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
      emit('update:modelValue', {text: value})
    }

    const togglePreview = () => {
      showPreview.value = !showPreview.value
    }

    const toolbarActions = [
      {label: 'Bold', action: () => insertText('**', '**')},
      {label: 'Italic', action: () => insertText('*', '*')},
      {label: 'Code', action: () => insertText('`', '`')},
      {label: 'Link', action: () => insertText('[', '](url)')},
      {label: 'Inline Equation', action: () => insertText('$', '$')},
      {label: 'Block Equation', action: () => insertText('$$\n', '\n$$')},
      {label: 'Toggle Preview', action: togglePreview},
    ]

    const renderedContent = computed(() => {
      return md.render(localContent.value)
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
      insertText(imageMarkdown, '')
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
      toolbarActions,
      extensions,
      handleReady
    }
  }
}
</script>

<style>
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
  text-align: left;
  flex: 1;
  position: relative;
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

</style>