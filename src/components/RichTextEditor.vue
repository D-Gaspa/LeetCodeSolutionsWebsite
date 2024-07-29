<template>
  <div>
    <textarea v-model="content" @input="updateContent"></textarea>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'RichTextEditor',
  props: {
    modelValue: {
      type: Object,
      default: () => ({ text: '' })
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const content = ref(props.modelValue.text || '')

    watch(() => props.modelValue, (newValue) => {
      content.value = newValue.text || ''
    })

    const updateContent = () => {
      emit('update:modelValue', { text: content.value })
    }

    return {
      content,
      updateContent
    }
  }
}
</script>

<style scoped>
textarea {
  width: 100%;
  height: 200px;
}
</style>