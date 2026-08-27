<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useSittersStore } from '@/stores/sitters';
import { scoreDeltaForToggle } from '@/utils/patounes';

const store = useSittersStore();
const burstMood = ref<'happy' | 'sad' | null>(null);
const burstDelta = ref(0);
const burstX = ref(0);
const burstY = ref(0);
const burstNonce = ref(0);

onMounted(async () => {
  await store.fetchAll();
  store.startRealtime();
});

onUnmounted(() => {
  store.stopRealtime();
});

async function onSelectDate(isoDate: string, event: MouseEvent) {
  const selected = store.selectedSitterId;
  const alreadyOnDay = Boolean(
    selected && (store.slotsByDate[isoDate] ?? []).includes(selected)
  );
  const adding = !alreadyOnDay;
  const delta = selected
    ? scoreDeltaForToggle(selected, isoDate, store.slotsByDate, adding)
    : 0;
  const { error } = await store.toggleAvailability(isoDate);

  if (error) {
    return;
  }

  burstMood.value = alreadyOnDay ? 'sad' : 'happy';
  burstDelta.value = delta;
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
        <h1 class="text-3xl font-black tracking-tight text-highlighted sm:text-5xl">
          Qui nourrit Malta ?
        </h1>
        <p class="mx-auto mt-3 max-w-2xl text-pretty text-sm text-muted sm:mx-0 sm:text-base">
          Le chaton d'amour gris et blanc va être tout seul si longtemps :(
          Mais tu as le pouvoir de le sauver de la tristesse.
          Pour cela, saisis ton nom, choisis une couleur pour te distinguer, et ajoute ton nom au calendrier.
        </p>
        <p class="mx-auto mt-2 max-w-2xl text-pretty text-sm italic text-muted sm:mx-0">
          Attention, le clic sur une case est contractuelle.
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
      :delta="burstDelta"
      :x="burstX"
      :y="burstY"
      :nonce="burstNonce"
    />
  </div>
</template>
