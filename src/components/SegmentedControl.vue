<script setup lang="ts" generic="T extends string | number">
const model = defineModel<T>({ required: true })

withDefaults(
  defineProps<{
    name: string
    label: string
    options: readonly { value: T; label: string }[]
    size?: 'lg' | 'md'
  }>(),
  { size: 'md' },
)
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    class="grid gap-2"
    :class="size === 'lg' ? 'rounded-2xl bg-surface p-1.5 shadow-card' : ''"
    :style="{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }"
  >
    <label
      v-for="option in options"
      :key="String(option.value)"
      class="flex cursor-pointer items-center justify-center rounded-xl font-display font-semibold text-muted transition-colors active:scale-[0.97] has-checked:bg-primary has-checked:font-bold has-checked:text-on-primary has-focus-visible:ring-2 has-focus-visible:ring-primary"
      :class="size === 'lg' ? 'h-13 text-2xl' : 'h-11 bg-surface-2 text-lg'"
    >
      <input v-model="model" type="radio" :name="name" :value="option.value" class="sr-only" />
      {{ option.label }}
    </label>
  </div>
</template>
