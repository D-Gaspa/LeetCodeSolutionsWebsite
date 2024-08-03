<template>
  <div v-if="show" class="confirm-dialog">
    <div class="confirm-dialog-content">
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      <div class="confirm-dialog-actions">
        <button @click="onConfirm">Yes</button>
        <button @click="onDismiss">No</button>
      </div>
    </div>
  </div>
</template>

<script>
import {ref} from 'vue'

export default {
  name: 'ConfirmDialog',
  props: {
    title: String,
    message: String,
  },
  setup(props, {emit}) {
    const show = ref(false)

    const onConfirm = () => {
      emit('confirm')
      show.value = false
    }

    const onDismiss = () => {
      emit('dismiss')
      show.value = false
    }

    return {
      show,
      onConfirm,
      onDismiss,
    }
  }
}
</script>

<style scoped>
/* Add your styles here */
</style>