<script setup lang="ts">
/** วงเรืองรอบจุดที่นิ้ว / เมาส์กำลังลาก */
defineProps<{ x: number; y: number }>()
</script>

<template>
  <Teleport to="body">
    <span
      aria-hidden="true"
      class="pointer-events-none fixed z-50 size-16 -translate-x-1/2 -translate-y-1/2 animate-fade-in"
      :style="{ left: `${x}px`, top: `${y}px` }"
    >
      <span class="absolute inset-0 animate-drag-halo rounded-full bg-accent/50" />
      <span
        class="absolute inset-2 rounded-full bg-accent/25 shadow-[0_0_18px_var(--color-accent)] ring-2 ring-accent"
      />
    </span>
  </Teleport>
</template>
