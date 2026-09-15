<script setup lang="ts">
import AppIcon from './AppIcon.vue'

defineProps<{ title: string; subtitle?: string; backLabel: string }>()
defineEmits<{ back: [] }>()
</script>

<!-- หัวหน้าจอ: ปุ่มย้อนกลับ + ชื่อหน้า -->
<template>
  <header class="flex shrink-0 items-center gap-1">
    <button
      type="button"
      :aria-label="backLabel"
      class="-ml-3 flex size-11 shrink-0 items-center justify-center"
      @click="$emit('back')"
    >
      <AppIcon name="back" :size="22" />
    </button>
    <div class="flex min-w-0 flex-col gap-0.5">
      <h1 class="font-display text-[26px] leading-tight font-bold">{{ title }}</h1>
      <p v-if="subtitle" class="text-[13px] text-muted">{{ subtitle }}</p>
      <slot />
    </div>
  </header>
</template>
