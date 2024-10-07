<template>
  <BaseModal v-model="isVisible" :confirm-on-close="true" class="input-editor-modal"
             @close-attempt="handleCloseAttempt">
    <PythonCodeEditor
        ref="codeEditorRef"
        :model-value="localContent"
        :theme="currentTheme"
        @update:model-value="handleContentUpdate"
    />

    <div class="form-actions">
      <button class="btn-primary btn-icon" @click="saveInput">
        <Save class="icon"/>
        Save Input
      </button>
      <button class="btn-danger btn-icon" @click="handleCloseAttempt">
        <X class="icon"/>
        Cancel
      </button>
    </div>
  </BaseModal>
</template>

<script lang="ts" setup>
import {computed, ref} from 'vue'
import {Save, X} from 'lucide-vue-next'
import BaseModal from '@/components/Common/BaseModal.vue'
import PythonCodeEditor from '@/components/Common/PythonCodeEditor.vue'
import {useNotification} from '@/composables/Common/useNotification'
import {useConfirm} from '@/composables/Common/useConfirm'
import {useTheme} from '@/composables/Common/useTheme'

const props = defineProps<{
  modelValue: boolean
  input: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', input: string): void
  (e: 'cancel'): void
}>()

const {showNotification} = useNotification()
const {showConfirm} = useConfirm()
const {theme} = useTheme()

const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const currentTheme = computed(() => theme.value === 'dark' ? 'dark' : 'light')

const localContent = ref(props.input)
const codeEditorRef = ref<InstanceType<typeof PythonCodeEditor> | null>(null)

const handleContentUpdate = (newContent: string) => {
  localContent.value = newContent
}

const saveInput = () => {
  const content = getContent()
  if (content.trim()) {
    emit('save', content)
    showNotification('Input saved successfully', 'success')
    isVisible.value = false
  } else {
    showNotification('Input cannot be empty', 'error')
  }
}

const hasUnsavedChanges = (): boolean => {
  return localContent.value !== props.input
}

const getContent = (): string => {
  return codeEditorRef.value ? codeEditorRef.value.getContent() : localContent.value
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
.input-editor-modal :deep(.base-modal-content) {
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: var(--border-radius);
  padding: var(--spacing-medium);
  width: 50%;
  height: 50%;
  max-width: 60vw;
  max-height: 60vh;
  transition: all var(--transition-base);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--spacing-medium);
  gap: var(--spacing-medium);
}
</style>