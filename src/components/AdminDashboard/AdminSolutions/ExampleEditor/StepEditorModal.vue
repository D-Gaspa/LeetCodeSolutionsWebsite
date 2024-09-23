<template>
  <BaseModal v-model="isVisible" :confirm-on-close="true" class="step-editor-modal" @close-attempt="handleCloseAttempt">
    <div class="step-editor">
      <h3 class="step-editor-title">Edit Steps</h3>

      <MdEditor
          ref="mdEditorRef"
          v-model="localContent"
          :enable-images="false"
          :initial-content="initialContent"
          @update:modelValue="handleContentUpdate"
      />

      <div class="form-actions">
        <button class="btn-primary btn-icon" @click="saveSteps">
          <Save class="icon"/>
          Save Steps
        </button>
        <button class="btn-danger btn-icon" @click="handleCloseAttempt">
          <X class="icon"/>
          Cancel
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script lang="ts" setup>
import {computed, ref, watch} from 'vue'
import {Save, X} from 'lucide-vue-next'
import BaseModal from '@/components/Common/BaseModal.vue'
import MdEditor from '@/components/MarkdownEditor/MdEditor.vue'
import {useNotification} from '@/composables/Common/useNotification'
import {useConfirm} from '@/composables/Common/useConfirm'
import type {ExampleSteps, MdContent} from '@/types/Problem'

const props = defineProps<{
  modelValue: boolean
  steps: ExampleSteps[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', steps: string): void
  (e: 'cancel'): void
}>()

const {showNotification} = useNotification()
const {showConfirm} = useConfirm()

const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const initialContent = computed<MdContent>(() => ({
  text: props.steps.map(step => `${step.step_number}. ${step.description}`).join('\n\n'),
  images: []
}))

const localContent = ref<MdContent>(initialContent.value)
const mdEditorRef = ref<InstanceType<typeof MdEditor> | null>(null)

watch(() => props.steps, () => {
  localContent.value = initialContent.value
}, {deep: true})

const handleContentUpdate = (newContent: MdContent) => {
  localContent.value = newContent
}

const saveSteps = () => {
  const content = getContent().text
  if (validateSteps(content)) {
    emit('save', content)
    showNotification('Steps saved successfully', 'success')
    isVisible.value = false
  } else {
    showNotification('Invalid step format. Please check the instructions and try again.', 'error')
  }
}

const validateSteps = (content: string): boolean => {
  const lines = content.split('\n')
  let currentStep = 1
  let isValid = true

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line === '') continue

    if (line.startsWith(`${currentStep}.`)) {
      currentStep++
    } else if (/^\d+\./.test(line)) {
      isValid = false
      break
    }
  }

  return isValid && currentStep > 1
}

const hasUnsavedChanges = (): boolean => {
  if (!mdEditorRef.value) return false

  const currentContent = getContent()
  return currentContent.text !== initialContent.value.text
}

const getContent = (): MdContent => {
  return mdEditorRef.value ? mdEditorRef.value.getContent() : localContent.value
}

const handleCloseAttempt = async () => {
  if (hasUnsavedChanges()) {
    const shouldClose = await showConfirm(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to close the editor?'
    )
    if (shouldClose) {
      emit('cancel')
    }
  } else {
    emit('cancel')
  }
}

defineExpose({
  hasUnsavedChanges,
  getContent,
})
</script>

<style scoped>
.step-editor-modal :deep(.base-modal-content) {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: var(--border-radius);
  padding: var(--spacing-medium);
  width: 80%;
  max-width: 90vw;
  max-height: 90vh;
  transition: all var(--transition-base);
}

.step-editor {
  display: flex;
  flex-direction: column;
}

.step-editor-title {
  font-size: var(--font-size-large);
  color: var(--text-color-primary);
  transition: all var(--transition-base);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-medium);
  gap: var(--spacing-medium);
}
</style>