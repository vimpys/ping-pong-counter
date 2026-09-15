<script setup lang="ts">
import { computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

import AppIcon from '@/components/AppIcon.vue'
import type { QueueItem } from './types'

const props = defineProps<{
  queue: QueueItem[]
  inactive: QueueItem[]
}>()

const emit = defineEmits<{
  reorder: [ids: string[]]
  select: [kind: 'queue' | 'inactive', id: string]
  add: []
}>()

const queueModel = computed({
  get: () => props.queue,
  set: (items: QueueItem[]) =>
    emit(
      'reorder',
      items.map((item) => item.id),
    ),
})
</script>

<template>
  <section class="flex min-h-0 flex-1 flex-col rounded-t-3xl bg-surface pt-3.5 shadow-card">
    <div class="flex shrink-0 items-center justify-between gap-2 px-4">
      <div class="flex items-center gap-2">
        <h2 class="font-display text-lg font-bold">คิวรอเล่น</h2>
        <span
          class="flex h-5.5 min-w-5.5 items-center justify-center rounded-full bg-surface-2 px-1.5 font-display text-[13px] font-semibold"
        >
          {{ queue.length }}
        </span>
      </div>
      <button
        type="button"
        class="flex h-11 items-center gap-1.5 rounded-full pr-4 pl-3 text-sm font-semibold ring-1 ring-line ring-inset active:bg-surface-2"
        @click="emit('add')"
      >
        <AppIcon name="plus" :size="18" class="text-primary" />
        เพิ่มผู้เล่น
      </button>
    </div>
    <p v-if="queue.length > 1" class="mt-0.5 shrink-0 px-4 text-xs text-faint">
      แตะชื่อเพื่อจัดการ · ลากที่จุดด้านขวาเพื่อสลับคิว
    </p>

    <div class="mt-1 overflow-y-auto px-4 pb-3">
      <VueDraggable
        v-if="queue.length > 0"
        v-model="queueModel"
        tag="ol"
        handle=".drag-handle"
        :animation="150"
        ghost-class="opacity-30"
        chosen-class="queue-chosen"
      >
        <li
          v-for="(player, index) in queue"
          :key="player.id"
          class="flex h-15 items-center border-b border-divider bg-surface last:border-b-0"
        >
          <button
            type="button"
            class="flex h-full min-w-0 flex-1 items-center gap-3 text-left"
            :aria-label="`จัดการ ${player.name}`"
            @click="emit('select', 'queue', player.id)"
          >
            <span
              class="w-6 shrink-0 text-center font-display text-lg font-bold"
              :class="index === 0 ? 'text-primary' : 'text-faint'"
            >
              {{ index + 1 }}
            </span>
            <span class="flex min-w-0 flex-1 items-center gap-2">
              <span class="truncate text-xl" :class="index === 0 ? 'font-semibold' : 'font-medium'">
                {{ player.name }}
              </span>
              <span
                v-if="index === 0"
                class="shrink-0 rounded-md bg-accent px-2 py-0.5 text-[13px] font-semibold text-ink"
              >
                คนถัดไป
              </span>
            </span>
            <span class="flex shrink-0 gap-3 font-display text-[17px] font-semibold">
              <span>ชนะ {{ player.wins }}</span>
              <span class="text-faint">แพ้ {{ player.losses }}</span>
            </span>
          </button>
          <span
            class="drag-handle flex h-11 w-9 shrink-0 cursor-grab touch-none items-center justify-end text-faint"
            aria-hidden="true"
          >
            <AppIcon name="grip" />
          </span>
        </li>
      </VueDraggable>
      <p v-else class="py-2 text-[13px] text-muted">ไม่มีคนรอ · เล่นวนกันต่อได้เลย</p>

      <template v-if="inactive.length > 0">
        <div class="flex h-8 items-center gap-2 text-xs font-semibold text-faint">
          <span>ออกจากการแข่งขัน · แตะเพื่อกลับเข้า</span>
          <span class="h-px flex-1 bg-divider" />
        </div>
        <ul>
          <li v-for="player in inactive" :key="player.id">
            <button
              type="button"
              class="flex h-15 w-full items-center gap-3 text-left"
              :aria-label="`จัดการ ${player.name} (ออกจากการแข่งขัน)`"
              @click="emit('select', 'inactive', player.id)"
            >
              <AppIcon name="exit" :size="16" class="mx-0.5 shrink-0 text-faint" />
              <span class="min-w-0 flex-1 truncate text-xl font-medium text-faint line-through">
                {{ player.name }}
              </span>
              <span class="flex shrink-0 gap-3 font-display text-[17px] font-semibold text-faint">
                <span>ชนะ {{ player.wins }}</span>
                <span>แพ้ {{ player.losses }}</span>
              </span>
              <AppIcon name="rejoin" class="w-9 shrink-0 text-primary" />
            </button>
          </li>
        </ul>
      </template>
    </div>
  </section>
</template>

<style scoped>
:deep(.queue-chosen) {
  box-shadow: var(--shadow-card);
}
</style>
