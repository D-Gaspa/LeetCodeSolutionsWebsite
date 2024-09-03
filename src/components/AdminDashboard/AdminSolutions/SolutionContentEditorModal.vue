<template>
  <BaseModal v-model="isVisible" class="solution-content-editor-modal">
    <h4>Edit {{ contentLabel }}</h4>
    <SolutionContentEditor
        ref="contentEditorRef"
        v-model="localContent"
        :initial-content="initialContent"
    />
    <div class="form-actions-container">
      <div class="form-actions">
        <button class="btn-secondary btn-icon" @click="saveContent">
          <Save class="icon"/>
          Save Content
        </button>
        <button class="btn-danger btn-icon" @click="closeContentEditor">
          <X class="icon"/>
          Close
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script lang="ts" setup>
import {ref, watch} from 'vue'
import {Save, X} from 'lucide-vue-next'
import BaseModal from '@/components/Common/BaseModal.vue'
import SolutionContentEditor from './SolutionContentEditor.vue'
import type {MdContentNoImages} from '@/types/Problem'
import {useNotification} from '@/composables/Common/useNotification'
import {useConfirm} from '@/composables/Common/useConfirm'

const props = defineProps<{
  modelValue: MdContentNoImages
  initialContent: MdContentNoImages
  contentLabel: string
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: MdContentNoImages): void
  (e: 'update:show', value: boolean): void
  (e: 'save'): void
}>()

const {showNotification} = useNotification()
const {showConfirm} = useConfirm()

const isVisible = ref(props.show)
const localContent = ref<MdContentNoImages>(props.modelValue)
const contentEditorRef = ref<InstanceType<typeof SolutionContentEditor> | null>(null)

watch(() => props.show, (newValue) => {
  isVisible.value = newValue
  if (newValue) {
    localContent.value = props.modelValue
  }
})

watch(isVisible, (newValue) => {
  emit('update:show', newValue)
})

const saveContent = () => {
  if (contentEditorRef.value) {
    const newContent = contentEditorRef.value.getContent()
    const hasChanges = contentEditorRef.value.hasUnsavedChanges()

    if (hasChanges) {
      emit('update:modelValue', newContent)
      emit('save')
      showNotification('Content saved successfully', 'success')
    } else {
      showNotification('No changes to save', 'info')
    }
    isVisible.value = false
  } else {
    showNotification('Error saving content. Please try again.', 'error')
  }
}

const closeContentEditor = async () => {
  let shouldClose = true

  if (contentEditorRef.value && contentEditorRef.value.hasUnsavedChanges()) {
    shouldClose = await showConfirm(
        'Unsaved Changes',
        'Are you sure you want to close? Any unsaved changes will be lost.'
    )
  }

  if (shouldClose) {
    isVisible.value = false
  }
}
</script>

<style scoped>
.solution-content-editor-modal :deep(.base-modal-content) {
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

.form-actions-container {
  margin-top: var(--spacing-medium);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-small);
}
</style>