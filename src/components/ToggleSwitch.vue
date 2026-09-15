<script setup lang="ts">
const model = defineModel<boolean>({ required: true })

defineProps<{ label: string }>()
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    :aria-label="label"
    class="flex h-8 w-13 shrink-0 items-center rounded-full p-[3px] transition-colors"
    :class="model ? 'bg-primary' : 'bg-line'"
    @click="model = !model"
  >
    <span
      class="size-[26px] rounded-full bg-white shadow-sm transition-transform"
      :class="model ? 'translate-x-5' : 'translate-x-0'"
    />
  </button>
</template>
