<template>
  <div class="solution-content-editor">
    <MdEditor
        ref="markdownEditorRef"
        v-model="localContent"
        :enable-images="false"
        :initial-content="modelValue"
        @update:modelValue="handleContentUpdate"
    />
  </div>
</template>

<script lang="ts" setup>
import {ref, watch} from 'vue'
import MdEditor from "@/components/MarkdownEditor/MdEditor.vue"
import type {MdContent, MdContentNoImages} from "@/types/Problem"

const props = defineProps<{
  modelValue: MdContentNoImages
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: MdContentNoImages): void
}>()

const markdownEditorRef = ref<InstanceType<typeof MdEditor> | null>(null)
const localContent = ref<MdContentNoImages>(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  if (newValue.text !== localContent.value.text) {
    localContent.value = newValue
  }
}, {deep: true})

const handleContentUpdate = (newContent: MdContent | MdContentNoImages) => {
  const updatedContent: MdContentNoImages = {text: newContent.text}
  localContent.value = updatedContent
  emit('update:modelValue', updatedContent)
}

const hasUnsavedChanges = (): boolean => {
  if (!markdownEditorRef.value) return false
  const currentContent = markdownEditorRef.value.getContent()
  return currentContent.text !== props.modelValue.text
}

const getContent = (): MdContentNoImages => {
  if (markdownEditorRef.value) {
    const content = markdownEditorRef.value.getContent()
    return {text: content.text}
  }
  return localContent.value
}

defineExpose({
  hasUnsavedChanges,
  getContent,
})
</script>