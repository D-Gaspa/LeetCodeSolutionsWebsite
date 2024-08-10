<template>
  <div class="editor-toolbar">
    <h3 class="toolbar-title">Tools</h3>
    <button
        v-for="action in actions"
        :key="action.label"
        :title="action.label"
        @click="action.action"
    >
      <component :is="action.icon"/>
    </button>
    <button
        v-if="enableImages"
        class="btn-neutral"
        title="Toggle Image Gallery"
        @click="$emit('toggle-image-gallery')"
    >
      <ImageIcon/>
    </button>
    <button title="Clear Content" @click="$emit('clear-content')">
      <TrashIcon/>
    </button>
    <button title="Toggle Preview" @click="$emit('toggle-preview')">
      <EyeIcon v-if="showPreview"/>
      <EyeOffIcon v-else/>
    </button>
    <button class="btn-neutral" title="Toggle Theme" @click="$emit('toggle-theme')">
      <SunIcon v-if="theme === 'dark'"/>
      <MoonIcon v-else/>
    </button>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue'
import {EyeIcon, EyeOffIcon, ImageIcon, MoonIcon, SunIcon, TrashIcon} from 'lucide-vue-next'
import {ToolbarAction} from '@/composables/MarkdownEditor/useMdToolbar'

export default defineComponent({
  name: 'MdEditorToolbar',
  components: {
    ImageIcon, TrashIcon, EyeIcon, EyeOffIcon,
    MoonIcon, SunIcon
  },
  props: {
    actions: {
      type: Array as PropType<ToolbarAction[]>,
      required: true,
    },
    showPreview: {
      type: Boolean,
      required: true,
    },
    theme: {
      type: String,
      required: true,
    },
    enableImages: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['toggle-preview', 'toggle-image-gallery', 'toggle-theme', 'clear-content'],
})
</script>

<style scoped>
.editor-toolbar {
  display: flex;
  flex-direction: column;
  border-right: var(--border-width) solid var(--border-color-secondary);
  background-color: var(--bg-color-tertiary);
  min-width: 50px;
  overflow-y: auto;
  transition: all var(--transition-base);
}

.toolbar-title {
  font-size: var(--font-size-small);
  text-align: center;
  margin-bottom: var(--spacing-small);
  color: var(--text-color-secondary);
}

.editor-toolbar button {
  margin: 0;
  padding: var(--spacing-small);
  background: none;
  border: none;
  border-radius: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
  color: var(--text-color-primary);
}

.editor-toolbar button:hover {
  background-color: var(--button-hover-neutral);
}
</style>