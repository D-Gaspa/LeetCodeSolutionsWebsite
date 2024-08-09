<template>
  <div class="content-editor">
    <MdEditor
        ref="markdownEditorRef"
        v-model="localContent"
        :initial-content="modelValue"
        :enable-images="true"
        @update:modelValue="handleContentUpdate"
    />
  </div>
</template>

<script lang="ts" setup>
import {PropType, ref, watch} from 'vue'
import MdEditor from "@/components/MarkdownEditor/MdEditor.vue";
import {EditorContent} from "@/composables/useMdEditor";

const props = defineProps({
  initialContent: {
    type: Object as PropType<EditorContent>,
    required: false,
  },
  modelValue: {
    type: Object as PropType<EditorContent>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: EditorContent): void
}>()

const markdownEditorRef = ref<InstanceType<typeof MdEditor> | null>(null)
const localContent = ref<EditorContent>(props.initialContent || props.modelValue || {text: '', images: []})

watch(() => props.modelValue, (newValue) => {
  if (newValue !== localContent.value) {
    localContent.value = newValue
  }
}, {deep: true})

const handleContentUpdate = (newContent: EditorContent) => {
  localContent.value = newContent
  emit('update:modelValue', newContent)
}

const hasUnsavedChanges = (): boolean => {
  if (!markdownEditorRef.value) return false

  const currentContent = markdownEditorRef.value.getContent()
  const originalContent = props.initialContent || props.modelValue

  return currentContent.text !== originalContent.text ||
      currentContent.images.length !== originalContent.images.length
}

const getContent = (): EditorContent => {
  return markdownEditorRef.value ? markdownEditorRef.value.getContent() : localContent.value
}

defineExpose({
  hasUnsavedChanges,
  getContent,
})
</script>