<template>
  <Datepicker
      v-model="internalDate"
      :auto-apply="true"
      :calendar-cell-class-name="calendarCellClassName"
      :calendar-class="calendarClass"
      :clearable="true"
      :dark="isDarkMode"
      :enable-time-picker="false"
      :format="dateFormat"
      :input-class="inputClass"
      :menu-class="menuClass"
      :month-change-on-scroll="false"
      :month-picker="type === 'monthly'"
      :placeholder="placeholder"
      :teleport="true"
      :weekday-class-name="weekdayClassName"
      @closed="isOpen = false"
      @open="isOpen = true"
  >
    <template #trigger>
      <div :class="['custom-trigger', { 'is-open': isOpen }]">
        <input
            id="datepicker"
            :class="inputClass"
            :placeholder="placeholder"
            :value="formattedDate"
            autocomplete="off"
            readonly
        />
        <calendar-icon class="calendar-icon"/>
      </div>
    </template>
  </Datepicker>
</template>

<script lang="ts" setup>
import {computed, ref} from 'vue'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import {useTheme} from '@/composables/Common/useTheme'
import {CalendarIcon} from 'lucide-vue-next'

interface Props {
  modelValue: string | null
  placeholder?: string
  type: 'daily' | 'monthly'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Select date',
  type: 'daily'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
}>()

const {theme} = useTheme()
const isOpen = ref(false)
const isDarkMode = computed(() => theme.value === 'dark')

const parseDate = (value: string | null): Date | { month: number; year: number } | null => {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)

  if (props.type === 'monthly') {
    return {year, month: month - 1}
  } else {
    return new Date(year, month - 1, day)
  }
}

const formatDateForEmit = (value: Date | { month: number; year: number } | null): string | null => {
  if (!value) return null

  if (props.type === 'monthly') {
    if ('month' in value && 'year' in value) {
      const month = (value.month + 1).toString().padStart(2, '0')
      return `${value.year}-${month}`
    }
  } else if (value instanceof Date) {
    const year = value.getFullYear()
    const month = (value.getMonth() + 1).toString().padStart(2, '0')
    const day = value.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return null
}

const formatDateForDisplay = (value: Date | { month: number; year: number } | null): string => {
  if (!value) return ''

  if (props.type === 'monthly') {
    if ('month' in value && 'year' in value) {
      const date = new Date(value.year, value.month)
      return date.toLocaleString('default', {month: 'long', year: 'numeric'})
    }
  } else if (value instanceof Date) {
    return value.toLocaleDateString(undefined, {year: 'numeric', month: 'long', day: 'numeric'})
  }

  return ''
}

const internalDate = computed({
  get: () => parseDate(props.modelValue),
  set: (value: Date | { month: number; year: number } | null) => {
    emit('update:modelValue', formatDateForEmit(value))
  }
})

const formattedDate = computed(() => formatDateForDisplay(internalDate.value))

const dateFormat = computed(() => props.type === 'monthly' ? 'MMMM yyyy' : 'dd/MM/yyyy')

const menuClass = computed(() => [
  'custom-datepicker-menu',
  {'dark-theme': isDarkMode.value}
])

const inputClass = computed(() => [
  'custom-datepicker-input',
  {'dark-theme': isDarkMode.value}
])

const calendarClass = computed(() => [
  'custom-datepicker-calendar',
  {'dark-theme': isDarkMode.value}
])

const calendarCellClassName = ({isSelected}: { isSelected: boolean }) => {
  return [
    'custom-calendar-cell',
    {'is-selected': isSelected},
    {'dark-theme': isDarkMode.value}
  ]
}

const weekdayClassName = computed(() => [
  'custom-weekday',
  {'dark-theme': isDarkMode.value}
])

defineExpose({
  formattedDate,
  menuClass,
  inputClass,
  calendarClass,
  weekdayClassName,
  isDarkMode,
  isOpen,
  calendarCellClassName
})
</script>

<style scoped>
.custom-trigger {
  position: relative;
  display: flex;
  box-sizing: border-box;
}

.calendar-icon {
  position: absolute;
  right: 0.7em;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-color-secondary);
  transition: color var(--transition-base);
  pointer-events: none;
}

.custom-datepicker-input {
  background-color: var(--input-bg);
  border: var(--border-width) solid var(--input-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-small);
  padding-right: 2.5em;
  color: var(--text-color-primary);
  font-size: var(--font-size-small);
  width: 100%;
  transition: all var(--transition-base);
}

.custom-trigger:hover .custom-datepicker-input,
.custom-trigger:focus-within .custom-datepicker-input,
.custom-trigger.is-open .custom-datepicker-input {
  border-color: var(--input-focus);
  outline: none;
  box-shadow: 0 0 0 2px rgba(var(--input-focus), 0.2);
}

.custom-trigger:focus-within .calendar-icon,
.custom-trigger.is-open .calendar-icon {
  color: var(--color-primary);
}

.custom-trigger::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  cursor: pointer;
}

:deep(.dp__theme_light) {
  --dp-background-color: var(--bg-color-primary);
  --dp-text-color: var(--text-color-primary);
  --dp-hover-color: var(--color-primary-light);
  --dp-hover-text-color: var(--button-text);
  --dp-hover-icon-color: var(--color-primary);
  --dp-primary-color: var(--color-primary);
  --dp-primary-text-color: var(--button-text);
  --dp-secondary-color: var(--color-secondary);
  --dp-border-color: var(--border-color-primary);
  --dp-menu-border-color: var(--border-color-primary);
}

:deep(.dp__theme_dark) {
  --dp-background-color: var(--bg-color-secondary);
  --dp-text-color: var(--text-color-primary);
  --dp-hover-color: var(--color-primary-dark);
  --dp-hover-text-color: var(--button-text);
  --dp-hover-icon-color: var(--color-primary-light);
  --dp-primary-color: var(--color-primary);
  --dp-primary-text-color: var(--button-text);
  --dp-secondary-color: var(--color-secondary);
  --dp-border-color: var(--border-color-primary);
  --dp-menu-border-color: var(--border-color-primary);
}
</style>