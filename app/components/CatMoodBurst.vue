<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps<{
  mood: 'happy' | 'sad' | null;
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
    }, 900);
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
      <span class="malta-mood-burst block text-5xl sm:text-6xl">
        {{ mood === 'happy' ? '😺' : '😿' }}
      </span>
    </div>
  </Teleport>
</template>
