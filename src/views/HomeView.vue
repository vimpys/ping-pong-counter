<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'

import AppIcon from '@/components/AppIcon.vue'
import heroImage from '@/assets/home-hero.webp'
import { useSessionStore } from '@/stores/session'

const { state, game } = storeToRefs(useSessionStore())
const version = __APP_VERSION__
</script>

<template>
  <main class="relative flex h-full flex-col px-4 pb-4">
    <span class="absolute top-3 right-4 font-display text-xs font-semibold text-faint">
      v{{ version }}
    </span>
    <div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 pt-4 text-center">
      <img
        :src="heroImage"
        alt="ไม้ปิงปองสีแดงและน้ำเงินกระทบกัน พร้อมคำว่า ปิง! ปอง!"
        width="900"
        height="853"
        class="h-auto max-h-[48dvh] w-auto max-w-full min-h-0 rounded-3xl border-[3px] border-ink shadow-card"
      />
      <div class="flex flex-col gap-1.5">
        <h1 class="font-display text-[34px] leading-tight font-bold">Ping Pong Counter</h1>
        <p class="text-muted">นับแต้มปิงปอง จัดคิวผู้เล่นในก๊วน</p>
      </div>
    </div>

    <div class="flex flex-col gap-2.5">
      <RouterLink
        v-if="state"
        :to="{ name: 'match' }"
        class="flex h-13 items-center justify-center rounded-2xl bg-surface font-display text-lg font-bold text-primary shadow-card active:scale-[0.98]"
      >
        เล่นต่อ{{ game ? ` · เกมที่ ${game.no}` : '' }}
      </RouterLink>
      <RouterLink
        :to="{ name: 'setup' }"
        class="flex h-15 items-center justify-center gap-2.5 rounded-2xl bg-primary font-display text-xl font-bold text-on-primary shadow-card active:scale-[0.98]"
      >
        <AppIcon name="play" />
        เริ่มเกม
      </RouterLink>
    </div>
  </main>
</template>
