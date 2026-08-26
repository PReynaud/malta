<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { formatPatouneDelta } from '@/utils/patounes';

const props = defineProps<{
  mood: 'happy' | 'sad' | null;
  delta: number;
  x: number;
  y: number;
  nonce: number;
}>();

const shown = ref(false);
let hideTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => props.nonce,
  (nonce) => {
    if (!nonce || !props.mood) {
      return;
    }

    shown.value = true;
    if (hideTimer) {
      clearTimeout(hideTimer);
    }
    hideTimer = setTimeout(() => {
      shown.value = false;
    }, 1100);
  }
);

onMounted(() => {
  if (props.mood) {
    shown.value = true;
  }
});

onUnmounted(() => {
  if (hideTimer) {
    clearTimeout(hideTimer);
  }
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="shown && mood"
      class="pointer-events-none fixed z-50"
      data-testid="cat-mood-burst"
      :style="{ left: `${x}px`, top: `${y}px` }"
      aria-hidden="true"
    >
      <span class="malta-mood-burst flex flex-col items-center gap-0.5">
        <span class="text-5xl leading-none sm:text-6xl">
          {{ mood === 'happy' ? '😺' : '😿' }}
        </span>
        <span
          class="rounded-full bg-black/80 px-2 py-0.5 text-sm font-black tabular-nums text-yellow-300 shadow-sm sm:text-base"
        >
          {{ formatPatouneDelta(delta) }} 🐾
        </span>
      </span>
    </div>
  </Teleport>
</template>
