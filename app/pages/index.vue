<script setup lang="ts">
import { onMounted } from 'vue';
import { useSittersStore } from '@/stores/sitters';

const store = useSittersStore();

onMounted(() => {
  store.fetchAll();
});
</script>

<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
    <section class="text-center sm:text-left">
      <p class="text-sm font-semibold uppercase tracking-widest text-secondary-600">
        Tiny tiger on holiday watch
      </p>
      <h1 class="mt-2 text-4xl font-black tracking-tight text-highlighted sm:text-5xl">
        Who feeds Malta?
      </h1>
      <p class="mx-auto mt-3 max-w-2xl text-pretty text-muted sm:mx-0">
        The grey-and-white boss needs breakfast while we are away.
        Pick your name, tap a September day, and keep that little engine purring.
      </p>
    </section>

    <UAlert
      v-if="store.error"
      color="error"
      variant="subtle"
      :title="store.error"
    />

    <SitterPicker
      :sitters="store.sitters"
      :selected-sitter-id="store.selectedSitterId"
      :loading="store.loading"
      @select="store.selectSitter"
      @create="({ name, color }) => store.createSitter(name, color)"
    />

    <MonthCalendar
      :sitters="store.sitters"
      :slots-by-date="store.slotsByDate"
      :selected-sitter-id="store.selectedSitterId"
      :loading="store.loading"
      @select-date="store.toggleAvailability"
    />
  </div>
</template>
