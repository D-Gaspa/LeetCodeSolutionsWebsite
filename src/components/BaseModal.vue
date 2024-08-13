<template>
  <Transition name="fade">
    <div v-if="modelValue" class="modal" @click="onBackdropClick">
      <Transition name="slide-fade">
        <div v-if="modelValue" class="base-modal-content" @click.stop>
          <slot></slot>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import {watch} from 'vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

const onBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit('update:modelValue', false)
  }
}
</script>

<style scoped>
.base-modal-content {
  background-color: var(--bg-color-primary);
  border: var(--border-width) solid var(--border-color-primary);
  padding: var(--spacing-large);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-medium);
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
  transition: all var(--transition-base);
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