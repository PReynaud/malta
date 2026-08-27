<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  DEPARTURE_AT_MS,
  RETURN_AT_MS,
  remainingTime
} from '@/utils/countdown';
import { pad2 } from '@/utils/calendar';

const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | null = null;

const departure = computed(() => remainingTime(DEPARTURE_AT_MS, now.value));
const homecoming = computed(() => remainingTime(RETURN_AT_MS, now.value));

function tick() {
  now.value = Date.now();
}

onMounted(() => {
  tick();
  timer = setInterval(tick, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<template>
  <section class="grid gap-3 sm:grid-cols-2">
    <article class="rounded-3xl border border-secondary-300 bg-gradient-to-br from-secondary-100 to-secondary-50 p-4 shadow-sm dark:from-secondary-900/50 dark:to-secondary-950/40 sm:p-5">
      <p class="text-xs font-semibold uppercase tracking-widest text-secondary-700 dark:text-secondary-300">
        Départ
      </p>
      <h2 class="mt-1 text-lg font-bold text-highlighted sm:text-xl">
        Jusqu'au 14 septembre
      </h2>
      <p class="text-sm text-muted">
        Le maître s'envole. Malta croise les moustaches.
      </p>
      <p
        v-if="departure.done"
        class="mt-4 text-lg font-black text-secondary-700"
      >
        C'est le jour J ✈️
      </p>
      <div
        v-else
        class="mt-4 grid grid-cols-4 gap-2"
        aria-live="polite"
      >
        <div class="rounded-2xl bg-white/80 px-1 py-2 text-center dark:bg-malta-900/60">
          <p class="text-xl font-black tabular-nums sm:text-2xl">
            {{ departure.days }}
          </p>
          <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">
            jours
          </p>
        </div>
        <div class="rounded-2xl bg-white/80 px-1 py-2 text-center dark:bg-malta-900/60">
          <p class="text-xl font-black tabular-nums sm:text-2xl">
            {{ pad2(departure.hours) }}
          </p>
          <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">
            heures
          </p>
        </div>
        <div class="rounded-2xl bg-white/80 px-1 py-2 text-center dark:bg-malta-900/60">
          <p class="text-xl font-black tabular-nums sm:text-2xl">
            {{ pad2(departure.minutes) }}
          </p>
          <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">
            min
          </p>
        </div>
        <div class="rounded-2xl bg-white/80 px-1 py-2 text-center dark:bg-malta-900/60">
          <p class="text-xl font-black tabular-nums sm:text-2xl">
            {{ pad2(departure.seconds) }}
          </p>
          <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">
            sec
          </p>
        </div>
      </div>
    </article>

    <article class="rounded-3xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-lime-50 p-4 shadow-sm dark:border-emerald-800 dark:from-emerald-950/40 dark:to-lime-950/30 sm:p-5">
      <p class="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
        Retour
      </p>
      <h2 class="mt-1 text-lg font-bold text-highlighted sm:text-xl">
        Jusqu'au 1er octobre
      </h2>
      <p class="text-sm text-muted">
        Le maître rentre. Malta rebranche le ronron.
      </p>
      <p
        v-if="homecoming.done"
        class="mt-4 text-lg font-black text-emerald-700"
      >
        Il est rentré 😺
      </p>
      <div
        v-else
        class="mt-4 grid grid-cols-4 gap-2"
        aria-live="polite"
      >
        <div class="rounded-2xl bg-white/80 px-1 py-2 text-center dark:bg-malta-900/60">
          <p class="text-xl font-black tabular-nums sm:text-2xl">
            {{ homecoming.days }}
          </p>
          <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">
            jours
          </p>
        </div>
        <div class="rounded-2xl bg-white/80 px-1 py-2 text-center dark:bg-malta-900/60">
          <p class="text-xl font-black tabular-nums sm:text-2xl">
            {{ pad2(homecoming.hours) }}
          </p>
          <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">
            heures
          </p>
        </div>
        <div class="rounded-2xl bg-white/80 px-1 py-2 text-center dark:bg-malta-900/60">
          <p class="text-xl font-black tabular-nums sm:text-2xl">
            {{ pad2(homecoming.minutes) }}
          </p>
          <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">
            min
          </p>
        </div>
        <div class="rounded-2xl bg-white/80 px-1 py-2 text-center dark:bg-malta-900/60">
          <p class="text-xl font-black tabular-nums sm:text-2xl">
            {{ pad2(homecoming.seconds) }}
          </p>
          <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">
            sec
          </p>
        </div>
      </div>
    </article>
  </section>
</template>
