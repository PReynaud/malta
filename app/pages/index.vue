<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useSittersStore } from '@/stores/sitters';

const store = useSittersStore();
const burstMood = ref<'happy' | 'sad' | null>(null);
const burstX = ref(0);
const burstY = ref(0);
const burstNonce = ref(0);

onMounted(() => {
  store.fetchAll();
});

async function onSelectDate(isoDate: string, event: MouseEvent) {
  const selected = store.selectedSitterId;
  const alreadyOnDay = Boolean(
    selected && (store.slotsByDate[isoDate] ?? []).includes(selected)
  );
  const { error } = await store.toggleAvailability(isoDate);

  if (error) {
    return;
  }

  burstMood.value = alreadyOnDay ? 'sad' : 'happy';
  burstX.value = event.clientX;
  burstY.value = event.clientY;
  burstNonce.value += 1;
}
</script>

<template>
  <div>
    <PatouneBanner :slots-by-date="store.slotsByDate" />

    <div class="mx-auto flex max-w-6xl flex-col gap-5 px-3 py-5 sm:gap-6 sm:px-6 sm:py-8">
      <section class="text-center sm:text-left">
        <p class="text-xs font-semibold uppercase tracking-widest text-secondary-600 sm:text-sm">
          Petit tigre en vacances
        </p>
        <h1 class="mt-2 text-3xl font-black tracking-tight text-highlighted sm:text-5xl">
          Qui nourrit Malta ?
        </h1>
        <p class="mx-auto mt-3 max-w-2xl text-pretty text-sm text-muted sm:mx-0 sm:text-base">
          Le boss gris-et-blanc a besoin de ses croquettes pendant notre absence.
          Choisis ton nom, tape un jour de vacances, et garde ce petit moteur en ronron.
        </p>
      </section>

      <TripCountdowns />

      <UAlert
        v-if="store.error"
        color="error"
        variant="subtle"
        :title="store.error"
      />

      <SitterPicker
        :sitters="store.sitters"
        :selected-sitter-id="store.selectedSitterId"
        :selected-sitter="store.selectedSitter"
        :loading="store.loading"
        @select="store.selectSitter"
        @create="({ name, color }) => store.createSitter(name, color)"
        @update="({ name, color }) => store.updateSelectedSitter(name, color)"
      />

      <MonthCalendar
        :sitters="store.sitters"
        :slots-by-date="store.slotsByDate"
        :selected-sitter-id="store.selectedSitterId"
        :loading="store.loading"
        @select-date="onSelectDate"
      />

      <PatouneBoard
        :sitters="store.sitters"
        :slots-by-date="store.slotsByDate"
        :selected-sitter-id="store.selectedSitterId"
      />

      <CareGuide />
    </div>

    <CatMoodBurst
      :mood="burstMood"
      :x="burstX"
      :y="burstY"
      :nonce="burstNonce"
    />
  </div>
</template>
