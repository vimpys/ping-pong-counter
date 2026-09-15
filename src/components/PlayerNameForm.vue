<script setup lang="ts">
import { ref } from 'vue'

import AppIcon from './AppIcon.vue'
import { MAX_NAME_LENGTH, type AddPlayerError } from '@/game/names'

const props = defineProps<{
  /** เพิ่มชื่อ — คืน error ถ้าเพิ่มไม่ได้ */
  submit: (name: string) => AddPlayerError | null
}>()

const name = ref('')
const error = ref('')
const input = ref<HTMLInputElement>()

function onSubmit() {
  const result = props.submit(name.value)
  if (result === 'empty') return
  if (result === 'duplicate') {
    error.value = 'มีชื่อนี้ในรายชื่อแล้ว'
    return
  }
  name.value = ''
  error.value = ''
  input.value?.focus()
}

function onKeydown(event: KeyboardEvent) {
  // กันกด Enter ระหว่างพิมพ์ด้วย IME
  if (event.key === 'Enter' && !event.isComposing) {
    event.preventDefault()
    onSubmit()
  }
}

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <form class="flex flex-col gap-1.5" @submit.prevent="onSubmit">
    <div class="flex gap-2">
      <input
        ref="input"
        v-model="name"
        type="text"
        enterkeyhint="done"
        autocomplete="off"
        placeholder="พิมพ์ชื่อผู้เล่น"
        aria-label="ชื่อผู้เล่น"
        :maxlength="MAX_NAME_LENGTH"
        class="h-13 min-w-0 flex-1 rounded-[14px] border bg-surface px-4 text-base outline-none placeholder:text-faint focus:border-primary"
        :class="error ? 'border-danger' : 'border-line'"
        @input="error = ''"
        @keydown="onKeydown"
      />
      <button
        type="submit"
        aria-label="เพิ่มผู้เล่น"
        class="flex size-13 shrink-0 items-center justify-center rounded-[14px] bg-primary text-on-primary active:scale-95"
      >
        <AppIcon name="plus" :size="22" :stroke-width="2.2" />
      </button>
    </div>
    <p v-if="error" role="alert" class="px-1 text-[13px] text-danger">{{ error }}</p>
  </form>
</template>
