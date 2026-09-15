<script setup lang="ts">
import AppIcon from './AppIcon.vue'

const model = defineModel<number>({ required: true })

const props = defineProps<{
  label: string
  min: number
  max: number
  disabled?: boolean
}>()

function step(delta: number) {
  model.value = Math.min(props.max, Math.max(props.min, model.value + delta))
}
</script>

<template>
  <div role="group" :aria-label="label" class="flex items-center gap-1">
    <button
      type="button"
      :aria-label="`ลด${label}`"
      :disabled="disabled || model <= min"
      class="flex size-11 items-center justify-center rounded-xl bg-surface-2 text-primary active:scale-95 disabled:opacity-35"
      @click="step(-1)"
    >
      <AppIcon name="minus" />
    </button>
    <output
      aria-live="polite"
      class="w-11 text-center font-display text-2xl font-bold"
      :class="{ 'opacity-35': disabled }"
    >
      {{ model }}
    </output>
    <button
      type="button"
      :aria-label="`เพิ่ม${label}`"
      :disabled="disabled || model >= max"
      class="flex size-11 items-center justify-center rounded-xl bg-surface-2 text-primary active:scale-95 disabled:opacity-35"
      @click="step(1)"
    >
      <AppIcon name="plus" />
    </button>
  </div>
</template>
