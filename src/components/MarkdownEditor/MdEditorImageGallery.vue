<template>
  <div v-if="show" class="image-gallery">
    <button class="btn-primary" @click="fileInput?.click()">
      Upload Images
    </button>
    <input
        ref="fileInput"
        accept="image/*"
        multiple
        style="display: none;"
        type="file"
        @change="handleImageUpload"
    >
    <div class="gallery-content">
      <div v-for="image in images" :key="image.id" class="image-item">
        <img
            :alt="image.name"
            :src="image.url"
            class="thumbnail"
            @click="$emit('insert-image', image)"
        >
        <button
            class="btn-danger delete-image-btn"
            @click="$emit('remove-image', image.id)"
        >
          Remove
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType, ref} from 'vue'
import {Image} from '@/composables/useMdEditorImageManagement'

export default defineComponent({
  name: 'MdEditorImageGallery',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    images: {
      type: Array as PropType<Image[]>,
      required: true
    }
  },
  emits: ['upload-images', 'insert-image', 'remove-image'],
  setup(_, {emit}) {
    const fileInput = ref<HTMLInputElement | null>(null)
    const handleImageUpload = (event: Event) => {
      console.log(`Handling image upload on ${event}`)
      const target = event.target as HTMLInputElement
      if (target.files) {
        emit('upload-images', Array.from(target.files))
      }
    }

    return {
      fileInput,
      handleImageUpload
    }
  }
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