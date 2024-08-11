<template>
  <Transition name="fade">
    <div v-if="isVisible" class="confirm-dialog" @click="onBackdropClick">
      <Transition name="slide-fade">
        <div v-if="isVisible" class="confirm-dialog-content" @click.stop>
          <h5>{{ title }}</h5>
          <p>{{ message }}</p>
          <div class="confirm-dialog-divider"></div>
          <div class="confirm-dialog-actions">
            <button class="btn-secondary" @click="onConfirm">Yes</button>
            <button class="btn-danger" @click="onDismiss">No</button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import {ref, watch} from 'vue'

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

const onBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    onDismiss()
  }
}

defineExpose({
  open
})
</script>

<style scoped>
.confirm-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  transition: all var(--transition-base);
}

.confirm-dialog-content {
  background-color: var(--bg-color-primary);
  border: var(--border-width) solid var(--border-color-primary);
  padding: var(--spacing-large);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-medium);
  max-width: 400px;
  width: fit-content;
  transition: all var(--transition-base);
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>