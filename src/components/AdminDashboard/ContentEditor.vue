<template>
  <div class="content-editor">
    <MarkdownEditor
        ref="markdownEditorRef"
        v-model="localContent"
        :initial-content="modelValue"
        @update:modelValue="handleContentUpdate"
    />
  </div>
</template>

<script>
import {ref, watch} from 'vue'
import MarkdownEditor from "@/components/MarkdownEditor.vue";

export default {
  name: 'ContentEditor',
  components: {MarkdownEditor},
  props: {
    initialContent: Object,
    modelValue: Object,
  },
  emits: ['update:modelValue'],
  setup(props, {emit}) {
    const markdownEditorRef = ref(null)
    const localContent = ref(props.initialContent || props.modelValue || {})

    watch(() => props.modelValue, (newValue) => {
      if (newValue !== localContent.value) {
        localContent.value = newValue
      }
    }, {deep: true})

    const handleContentUpdate = (newContent) => {
      localContent.value = newContent
      emit('update:modelValue', newContent)
    }

    const hasUnsavedChanges = () => {
      if (!markdownEditorRef.value) return false

      const currentContent = markdownEditorRef.value.getContent()
      const originalContent = props.initialContent || props.modelValue || {}

      return currentContent.text !== originalContent.text ||
          currentContent.images.length !== originalContent.images.length
    }

    const getContent = () => {
      return markdownEditorRef.value ? markdownEditorRef.value.getContent() : localContent.value
    }

    return {
      markdownEditorRef,
      localContent,
      hasUnsavedChanges,
      handleContentUpdate,
      getContent,
    }
  }
}
</script>

<style scoped>
</style>