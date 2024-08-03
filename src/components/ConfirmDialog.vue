<template>
  <Transition name="fade">
    <div v-if="isVisible" class="confirm-dialog" @click="onBackdropClick">
      <Transition name="slide-fade">
        <div v-if="isVisible" class="confirm-dialog-content" @click.stop>
          <h2>{{ title }}</h2>
          <p>{{ message }}</p>
          <div class="confirm-dialog-actions">
            <button class="confirm-btn" @click="onConfirm">Yes</button>
            <button class="dismiss-btn" @click="onDismiss">No</button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script>
import {ref, watch} from 'vue'

export default {
  name: 'ConfirmDialog',
  props: {
    show: Boolean,
  },
  emits: ['update:show', 'confirm', 'dismiss'],
  setup(props, {emit}) {
    const isVisible = ref(false)
    const title = ref('')
    const message = ref('')

    watch(() => props.show, (newValue) => {
      isVisible.value = newValue;
    })

    const open = (newTitle, newMessage) => {
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

    const onBackdropClick = (event) => {
      if (event.target === event.currentTarget) {
        onDismiss()
      }
    }

    return {
      isVisible,
      title,
      message,
      open,
      onConfirm,
      onDismiss,
      onBackdropClick,
    }
  }
}
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
}

.confirm-dialog-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
}

h2 {
  margin-top: 0;
  color: #333;
}

p {
  color: #666;
}

.confirm-dialog-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.confirm-btn {
  background-color: #4CAF50;
  color: white;
  margin-right: 0.5rem;
}

.confirm-btn:hover {
  background-color: #45a049;
}

.dismiss-btn {
  background-color: #f44336;
  color: white;
}

.dismiss-btn:hover {
  background-color: #da190b;
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