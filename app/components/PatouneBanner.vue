<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { coverageMeter } from '@/utils/patounes';

const BANNER_KEY = 'malta-patoune-banner';

const props = defineProps<{
  slotsByDate: Record<string, string[]>;
}>();

const visible = ref(true);
const meter = computed(() => coverageMeter(props.slotsByDate));

const message = computed(() => {
  const current = meter.value;
  const remaining = current.remaining === 0
    ? 'TOUS LES BOLS SONT PLEINS — PATOUNES EN FOLIE'
    : `ENCORE ${current.remaining} JOUR${current.remaining > 1 ? 'S' : ''} À FAIM`;

  return `★ MALTA EST NOURRI À ${current.percent} % ★ ${remaining} ★ CLIQUE UN JOUR ORANGE — GAGNE DES PATOUNES ★ ${current.covered}/${current.total} BOLS ★`;
});

function dismiss() {
  visible.value = false;
  if (import.meta.client) {
    window.localStorage.setItem(BANNER_KEY, '1');
  }
}

onMounted(() => {
  if (window.localStorage.getItem(BANNER_KEY) === '1') {
    visible.value = false;
  }
});
</script>

<template>
  <div
    v-if="visible"
    class="malta-ad relative overflow-hidden border-y-4 border-fuchsia-600 bg-yellow-300 text-fuchsia-700"
    role="complementary"
    aria-label="Jauge collective de Malta"
  >
    <button
      type="button"
      class="absolute top-1 right-1 z-10 flex size-8 items-center justify-center border-2 border-black bg-white text-lg font-black leading-none text-black shadow-[2px_2px_0_#000] touch-manipulation hover:bg-red-400"
      aria-label="Fermer la pub"
      @click="dismiss"
    >
      ×
    </button>

    <div class="malta-marquee-mask py-2 pr-10">
      <p class="malta-ad-text malta-marquee-track">
        <span>{{ message }}</span>
        <span aria-hidden="true">{{ message }}</span>
      </p>
    </div>
  </div>
</template>
