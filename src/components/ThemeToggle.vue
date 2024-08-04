<template>
  <button
      :aria-label="`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`"
      :class="['theme-toggle', theme]"
      @click="toggleTheme"
  >
    <div class="toggle-track">
      <div class="toggle-indicator">
        <span class="toggle-icon">
          <svg v-if="theme === 'light'" fill="none" height="16" stroke="currentColor" stroke-linecap="round"
               stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="16"
               xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" x2="12" y1="1" y2="3"/>
            <line x1="12" x2="12" y1="21" y2="23"/>
            <line x1="4.22" x2="5.64" y1="4.22" y2="5.64"/>
            <line x1="18.36" x2="19.78" y1="18.36" y2="19.78"/>
            <line x1="1" x2="3" y1="12" y2="12"/>
            <line x1="21" x2="23" y1="12" y2="12"/>
            <line x1="4.22" x2="5.64" y1="19.78" y2="18.36"/>
            <line x1="18.36" x2="19.78" y1="5.64" y2="4.22"/>
          </svg>
          <svg v-else fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
               stroke-width="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </span>
      </div>
    </div>
  </button>
</template>

<script setup>
import {useTheme} from '../composables/useTheme'

const {theme, toggleTheme} = useTheme()
</script>

<style scoped>
.theme-toggle {
  background-color: transparent;
  border: none;
  cursor: pointer;
  display: inline-block;
  padding: 4px;
  width: 56px;
  height: 36px;
  transition: all 0.3s ease;
}

.toggle-track {
  background-color: var(--toggle-bg);
  border-radius: 18px;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.toggle-indicator {
  background-color: var(--toggle-indicator-bg);
  border-radius: 50%;
  height: 28px;
  width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 4px;
  left: 4px;
  transform: translateX(0);
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16px;
  width: 16px;
  color: var(--toggle-icon-color);
  transition: all 0.3s ease;
}

.toggle-icon svg {
  width: 100%;
  height: 100%;
}

/* Light theme styles */
.theme-toggle.light {
  --toggle-bg: #e2e8f0;
  --toggle-indicator-bg: #fbbf24;
  --toggle-icon-color: #4a5568;
}

.theme-toggle.light .toggle-indicator {
  transform: translateX(0);
}

/* Dark theme styles */
.theme-toggle.dark {
  --toggle-bg: #4a5568;
  --toggle-indicator-bg: #2d3748;
  --toggle-icon-color: #e2e8f0;
}

.theme-toggle.dark .toggle-indicator {
  transform: translateX(20px);
}

/* Hover and focus styles */
.theme-toggle:hover .toggle-track,
.theme-toggle:focus-visible .toggle-track {
  box-shadow: 0 0 0 2px var(--toggle-icon-color);
}

.theme-toggle:hover .toggle-indicator,
.theme-toggle:focus-visible .toggle-indicator {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Accessibility */
.theme-toggle:focus-visible {
  outline: 2px solid var(--toggle-icon-color);
  outline-offset: 2px;
}
</style>