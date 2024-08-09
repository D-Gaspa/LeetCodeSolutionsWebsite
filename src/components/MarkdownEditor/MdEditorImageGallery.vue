<template>
  <div class="image-gallery">
    <input
        ref="fileInput"
        accept="image/*"
        multiple
        style="display: none;"
        type="file"
        @change="handleFileInputChange"
    >
    <button class="btn-primary" @click="triggerFileInput">
      Upload Images
    </button>
    <div class="gallery-content">
      <div v-for="(image, index) in images" :key="image.id" class="image-item">
        <img
            :alt="image.name"
            :src="image.url"
            class="thumbnail"
            @click="$emit('insert', image)"
        >
        <button class="btn-danger delete-image-btn" @click="$emit('remove', index)">
          Remove
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType, ref} from 'vue'
import {MdImage} from '@/composables/useMdImageManagement'
import {useNotification} from "@/composables/useNotification";

export default defineComponent({
  name: 'MdEditorImageGallery',
  props: {
    images: {
      type: Array as PropType<MdImage[]>,
      required: true,
    },
  },
  emits: ['upload', 'insert', 'remove'],
  setup(_, {emit}) {
    const {showNotification} = useNotification()
    const fileInput = ref<HTMLInputElement | null>(null)

    const triggerFileInput = () => {
      fileInput.value?.click()
    }

    const handleFileInputChange = (event: Event) => {
      const input = event.target as HTMLInputElement
      if (input.files) {
        try {
          emit('upload', input.files)
          input.value = '' // Reset the input
        } catch (error) {
          showNotification(`Error processing images: ${error.message}`, 'error')
        }
      }
    }

    return {
      fileInput,
      triggerFileInput,
      handleFileInputChange,
    }
  },
})
</script>

<style scoped>
.image-gallery {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 150px;
  background-color: var(--bg-color-tertiary);
  border-left: var(--border-width) solid var(--border-color-secondary);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  transition: all var(--transition-base);
}

.image-gallery button {
  margin: 10px;
}

.gallery-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-small);
}

.image-item {
  display: flex;
  flex-direction: column;
  border: var(--border-width) solid var(--border-color-secondary);
  border-radius: var(--border-radius);
  background-color: var(--button-bg-neutral);
  margin-bottom: var(--spacing-small);
  text-align: center;
  padding: var(--spacing-small);
  align-items: center;
  transition: all var(--transition-base);
  cursor: pointer;
}

.image-item:hover:not(:has(.delete-image-btn:hover)) {
  border-color: var(--input-focus);
  box-shadow: 0 0 0 2px rgba(var(--input-focus), 0.2);
}

.thumbnail {
  max-width: 100%;
  height: auto;
  cursor: pointer;
  border-radius: var(--border-radius);
}
</style>