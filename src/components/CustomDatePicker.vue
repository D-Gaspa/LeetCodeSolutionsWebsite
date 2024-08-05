<template>
  <Datepicker
      v-model="date"
      :auto-apply="true"
      :calendar-cell-class-name="calendarCellClassName"
      :calendar-class="calendarClass"
      :clearable="true"
      :dark="isDarkMode"
      :enable-time-picker="false"
      :input-class="inputClass"
      :menu-class="menuClass"
      :month-change-on-scroll="false"
      :placeholder="placeholder"
      :teleport="true"
      :weekday-class-name="weekdayClassName"
  >
    <template #trigger>
      <div class="custom-trigger">
        <input
            :class="inputClass"
            :placeholder="placeholder"
            :value="formattedDate"
            readonly
        />
        <calendar-icon class="calendar-icon"/>
      </div>
    </template>
  </Datepicker>
</template>

<script>
import {computed, ref, watch} from 'vue'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import {useTheme} from '@/composables/useTheme'
import {CalendarIcon} from 'lucide-vue-next'

export default {
  components: {
    Datepicker,
    CalendarIcon
  },
  props: {
    modelValue: {
      type: [Date, String],
      default: null
    },
    placeholder: {
      type: String,
      default: 'Select date'
    }
  },
  emits: ['update:modelValue'],
  setup(props, {emit}) {
    const {theme} = useTheme()
    const date = ref(props.modelValue ? new Date(props.modelValue) : null)

    const isDarkMode = computed(() => theme.value === 'dark')

    const formatDateForEmit = (date) => {
      if (!date) return null
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      return `${year}-${month}-${day}`
    }

    const formatDateForDisplay = (date) => {
      if (!date) return ''
      return date.toLocaleDateString()
    }

    const formattedDate = computed(() => formatDateForDisplay(date.value))

    watch(() => props.modelValue, (newValue) => {
      if (newValue !== formatDateForEmit(date.value)) {
        date.value = newValue ? new Date(newValue) : null
      }
    })

    watch(date, (newValue) => {
      const formattedDate = formatDateForEmit(newValue)
      if (formattedDate !== props.modelValue) {
        emit('update:modelValue', formattedDate)
      }
    })

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

    const calendarCellClassName = ({isSelected}) => {
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

    return {
      date,
      formattedDate,
      menuClass,
      inputClass,
      calendarClass,
      weekdayClassName,
      isDarkMode,
      calendarCellClassName
    }
  }
}
</script>

<style scoped>
.custom-trigger {
  position: relative;
  display: inline-block;
  box-sizing: border-box;
  width: 100%;
}

.calendar-icon {
  position: absolute;
  right: 10px;
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
  padding: var(--spacing-sm);
  padding-right: calc(var(--spacing-sm) * 2 + 20px);
  color: var(--text-color-primary);
  font-size: var(--font-size-small);
  width: 100%;
  transition: all var(--transition-base);
}

.custom-trigger:hover .custom-datepicker-input,
.custom-trigger:focus-within .custom-datepicker-input {
  border-color: var(--input-focus);
  outline: none;
  box-shadow: 0 0 0 2px rgba(var(--input-focus), 0.2);
}

.custom-trigger:hover .calendar-icon,
.custom-trigger:focus-within .calendar-icon {
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
  --dp-border-color: var(--border-color);
  --dp-menu-border-color: var(--border-color);
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
  --dp-border-color: var(--border-color);
  --dp-menu-border-color: var(--border-color);
}
</style>