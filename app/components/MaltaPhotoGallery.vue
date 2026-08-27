<script setup lang="ts">
import { computed, ref } from 'vue';
import { PATOUNE_PHOTO } from '@/utils/patounes';
import type { MaltaGalleryItem } from '@/stores/malta-photos';
import type { Sitter } from '@/stores/sitters';

const props = defineProps<{
  photos: MaltaGalleryItem[];
  sitters: Sitter[];
  selectedSitterId: string | null;
  loading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  upload: [payload: { file: File; clientX: number; clientY: number }];
}>();

const lastClick = ref({ x: 0, y: 0 });

const sitterById = computed(() => {
  const map: Record<string, Sitter> = {};
  for (const sitter of props.sitters) {
    map[sitter.id] = sitter;
  }
  return map;
});

function rememberClick(event: MouseEvent) {
  lastClick.value = { x: event.clientX, y: event.clientY };
}

function onLabelClick(event: MouseEvent) {
  if (props.loading) {
    event.preventDefault();
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }

  emit('upload', {
    file,
    clientX: lastClick.value.x,
    clientY: lastClick.value.y
  });

  input.value = '';
}

function photoAlt(photo: MaltaGalleryItem): string {
  const sitterName = sitterById.value[photo.sitter_id]?.name;
  return sitterName ? `Photo de Malta par ${sitterName}` : 'Photo de Malta';
}
</script>

<template>
  <section class="rounded-3xl border border-default bg-default/80 p-4 shadow-sm sm:p-6">
    <h2 class="text-xl font-bold tracking-tight text-highlighted sm:text-2xl">
      Photos de Malta
    </h2>
    <p class="mt-1 text-sm text-muted">
      +{{ PATOUNE_PHOTO }} patounes par photo. Choisis qui tu es, puis envoie un cliché du tigre.
    </p>

    <div
      v-if="photos.length"
      class="malta-marquee-mask malta-photo-marquee mt-4 rounded-2xl border border-default bg-elevated py-3"
    >
      <div class="malta-marquee-track malta-photo-track">
        <div class="flex gap-3">
          <img
            v-for="photo in photos"
            :key="photo.id"
            :src="photo.publicUrl"
            :alt="photoAlt(photo)"
            class="malta-photo-frame"
          >
        </div>
        <div
          class="flex gap-3"
          aria-hidden="true"
        >
          <img
            v-for="photo in photos"
            :key="`${photo.id}-loop`"
            :src="photo.publicUrl"
            alt=""
            class="malta-photo-frame"
          >
        </div>
      </div>
    </div>

    <p
      v-else
      class="mt-4 text-sm text-muted"
    >
      Pas encore de photo. Malta attend son premier shooting.
    </p>

    <UAlert
      v-if="error"
      class="mt-4"
      color="error"
      variant="subtle"
      data-testid="malta-photo-error"
      :title="error"
    />

    <p
      v-if="!selectedSitterId"
      class="mt-4 text-sm text-muted"
    >
      Choisis d'abord qui tu es, puis envoie une photo.
    </p>

    <label
      class="malta-cta mt-4 inline-flex w-full cursor-pointer touch-manipulation sm:w-auto"
      :class="{ 'pointer-events-none opacity-45': loading }"
      @click="onLabelClick"
    >
      <input
        class="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        aria-label="Envoyer une photo de Malta"
        data-testid="malta-photo-input"
        :disabled="loading"
        @click="rememberClick"
        @change="onFileChange"
      >
      <span
        v-if="loading"
        class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
        aria-hidden="true"
      />
      <span
        v-else
        aria-hidden="true"
      >📷</span>
      Envoyer une photo
    </label>
  </section>
</template>
