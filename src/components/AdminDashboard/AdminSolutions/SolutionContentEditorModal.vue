<template>
  <BaseModal v-model="isVisible" class="solution-content-editor-modal">
    <h4>Edit {{ contentLabel }}</h4>
    <SolutionContentEditor
        ref="contentEditorRef"
        v-model="localContent"
        :initial-content="modelValue"
    />
    <div class="form-actions-container">
      <div class="form-actions">
        <button class="btn-secondary btn-icon" @click="saveContent">
          <Save class="icon"/>
          Save Content
        </button>
        <button class="btn-danger btn-icon" @click="close">
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

const props = defineProps<{
  modelValue: MdContentNoImages
  contentLabel: string
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: MdContentNoImages): void
  (e: 'update:show', value: boolean): void
  (e: 'save'): void
}>()

const isVisible = ref(props.show)
const localContent = ref<MdContentNoImages>(props.modelValue)
const contentEditorRef = ref<InstanceType<typeof SolutionContentEditor> | null>(null)

watch(() => props.show, (newValue) => {
  isVisible.value = newValue
})

watch(isVisible, (newValue) => {
  emit('update:show', newValue)
})

const saveContent = () => {
  if (contentEditorRef.value) {
    const newContent = contentEditorRef.value.getContent()
    emit('update:modelValue', newContent)
    emit('save')
  }
  close()
}

const close = () => {
  emit('update:show', false)
}
</script>

<style scoped>
.solution-content-editor-modal :deep(.base-modal-content) {
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
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