<template>
  <div class="content-editor">
    <MdEditor
        ref="markdownEditorRef"
        v-model="localContent"
        :enable-images="true"
        :initial-content="modelValue"
        @update:modelValue="handleContentUpdate"
    />
  </div>
</template>

<script lang="ts" setup>
import {PropType, ref, watch} from 'vue'
import MdEditor from "@/components/MarkdownEditor/MdEditor.vue";
import {MdContent} from "@/types/Problem";

const props = defineProps({
  initialContent: {
    type: Object as PropType<MdContent>,
    required: false,
  },
  modelValue: {
    type: Object as PropType<MdContent>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: MdContent): void
}>()

const markdownEditorRef = ref<InstanceType<typeof MdEditor> | null>(null)
const localContent = ref<MdContent>(props.initialContent || props.modelValue || {text: '', images: []})

watch(() => props.modelValue, (newValue) => {
  if (newValue !== localContent.value) {
    localContent.value = newValue
  }
}, {deep: true})

const handleContentUpdate = (newContent: MdContent) => {
  localContent.value = newContent
  emit('update:modelValue', newContent)
}

const hasUnsavedChanges = (): boolean => {
  if (!markdownEditorRef.value) return false

  const currentContent = markdownEditorRef.value.getContent()
  const originalContent = props.initialContent || props.modelValue

  return currentContent.text !== originalContent.text ||
      currentContent.images?.length !== originalContent.images?.length
}

const getContent = (): MdContent => {
  return markdownEditorRef.value ? markdownEditorRef.value.getContent() : localContent.value
}

defineExpose({
  hasUnsavedChanges,
  getContent,
})
</script>