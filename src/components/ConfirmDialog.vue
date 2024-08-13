<template>
  <BaseModal v-model="isVisible" class="confirm-dialog">
    <h5>{{ title }}</h5>
    <p>{{ message }}</p>
    <div class="confirm-dialog-divider"></div>
    <div class="confirm-dialog-actions">
      <button class="btn-secondary" @click="onConfirm">Yes</button>
      <button class="btn-danger" @click="onDismiss">No</button>
    </div>
  </BaseModal>
</template>

<script lang="ts" setup>
import {ref, watch} from 'vue'
import BaseModal from './BaseModal.vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'confirm'): void
  (e: 'dismiss'): void
}>()

const isVisible = ref(false)
const title = ref('')
const message = ref('')

watch(() => props.show, (newValue) => {
  isVisible.value = newValue
})

const open = (newTitle: string, newMessage: string) => {
  title.value = newTitle
  message.value = newMessage
  emit('update:show', true)
}

const onConfirm = () => {
  emit('confirm')
  emit('update:show', false)
}

const onDismiss = () => {
  emit('dismiss')
  emit('update:show', false)
}

defineExpose({
  open
})
</script>

<style scoped>
.confirm-dialog :deep(.base-modal-content) {
  max-width: 400px;
  width: fit-content;
}

h5 {
  margin-top: 0;
  color: var(--text-color-primary);
}

.confirm-dialog-divider {
  height: 1px;
  background-color: var(--border-color-secondary);
  margin: var(--spacing-medium) 0;
}

p {
  color: var(--text-color-secondary);
}

.confirm-dialog-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
  gap: 1rem;
}
</style>