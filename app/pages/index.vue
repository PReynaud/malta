<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { useSittersStore } from '@/stores/sitters';
import { useMaltaPhotosStore } from '@/stores/malta-photos';
import { usePhotoContestStore } from '@/stores/photo-contest';
import type { ContestCategory } from '@/utils/photo-contest';

const store = useSittersStore();
const photosStore = useMaltaPhotosStore();
const contestStore = usePhotoContestStore();

onMounted(async () => {
  await Promise.all([
    store.fetchAll(),
    photosStore.fetchAll(),
    contestStore.fetchAll()
  ]);
  store.startRealtime();
  contestStore.startRealtime();
});

onUnmounted(() => {
  store.stopRealtime();
  contestStore.stopRealtime();
});

watch(
  () => store.selectedSitterId,
  (sitterId) => {
    if (sitterId) {
      photosStore.clearError();
      contestStore.clearError();
    }
  }
);

async function onVote(payload: { photoId: string; category: ContestCategory }) {
  if (!store.selectedSitterId || contestStore.closed) {
    return;
  }

  await contestStore.castVote(store.selectedSitterId, payload.photoId, payload.category);
}
</script>

<template>
  <div>
    <div class="mx-auto flex max-w-6xl flex-col gap-5 px-3 py-5 sm:gap-6 sm:px-6 sm:py-8">
      <section class="text-center sm:text-left">
        <h1 class="text-3xl font-black tracking-tight text-highlighted sm:text-5xl">
          Concours photo
        </h1>
        <p class="mx-auto mt-3 max-w-2xl text-pretty text-sm text-muted sm:mx-0 sm:text-base">
          La plus mignonne, la plus marrante, et la plus nulle.
          Les patounes bonus et le malus seront donnés à la fin.
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
        :selected-sitter="store.selectedSitter"
        :loading="store.loading"
        @select="store.selectSitter"
        @create="({ name, color }) => store.createSitter(name, color)"
        @update="({ name, color }) => store.updateSelectedSitter(name, color)"
        @logout="store.clearSelectedSitter"
      />

      <PatouneBoard
        :sitters="store.sitters"
        :slots-by-date="store.slotsByDate"
        :selected-sitter-id="store.selectedSitterId"
        :photo-counts="photosStore.photoCounts"
      />

      <MaltaPhotoGallery
        :photos="photosStore.galleryItems"
        :sitters="store.sitters"
        :votes="contestStore.votes"
        :selected-sitter-id="store.selectedSitterId"
        :closed="contestStore.closed"
        :voting="contestStore.voting"
        :error="contestStore.error"
        @vote="onVote"
      />
    </div>
  </div>
</template>
