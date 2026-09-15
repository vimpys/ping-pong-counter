<script setup lang="ts">
import AppIcon, { type IconName } from './AppIcon.vue'

defineProps<{ title: string; description: string; icon: IconName; danger?: boolean }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="flex min-h-17 items-center gap-3.5 rounded-[14px] bg-surface-2 px-4 py-3 text-left active:scale-[0.99]"
    @click="$emit('click')"
  >
    <span
      class="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface"
      :class="danger ? 'text-danger' : 'text-primary'"
    >
      <AppIcon :name="icon" />
    </span>
    <span class="flex flex-col gap-0.5">
      <span class="font-semibold" :class="{ 'text-danger': danger }">{{ title }}</span>
      <span class="text-[13px] text-pretty text-muted">{{ description }}</span>
    </span>
  </button>
</template>
