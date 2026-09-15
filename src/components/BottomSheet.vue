<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'

const open = defineModel<boolean>('open', { required: true })

defineProps<{ title: string; description?: string }>()
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 animate-fade-in bg-ink/45" />
      <DialogContent
        class="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[480px] animate-sheet-up flex-col gap-2.5 rounded-t-3xl bg-surface px-4 pt-2.5 pb-[calc(var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px))+24px)] shadow-card outline-none"
        @open-auto-focus.prevent
      >
        <div class="mx-auto h-1 w-9 rounded-full bg-line" aria-hidden="true" />
        <div class="flex flex-col gap-0.5 px-1 pt-1.5 pb-1">
          <DialogTitle class="font-display text-xl font-bold">{{ title }}</DialogTitle>
          <DialogDescription v-if="description" class="text-[13px] text-muted">
            {{ description }}
          </DialogDescription>
        </div>
        <slot />
        <DialogClose
          class="h-13 rounded-[14px] text-base font-semibold ring-1 ring-line ring-inset active:bg-surface-2"
        >
          ยกเลิก
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
