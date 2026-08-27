<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { needsMarqueeLoop } from '@/utils/marquee';
import { PATOUNE_PHOTO } from '@/utils/patounes';
import type { MaltaGalleryItem } from '@/stores/malta-photos';
import type { Sitter } from '@/stores/sitters';

const props = defineProps<{
  photos: MaltaGalleryItem[];
  sitters: Sitter[];
  loading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  upload: [payload: { file: File; clientX: number; clientY: number }];
}>();

const lastClick = ref({ x: 0, y: 0 });
const maskEl = ref<HTMLElement | null>(null);
const contentEl = ref<HTMLElement | null>(null);
const looping = ref(false);

function updateLooping() {
  const mask = maskEl.value;
  const content = contentEl.value;
  if (!import.meta.client || !mask || !content) {
    looping.value = false;
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  looping.value = needsMarqueeLoop(content.scrollWidth, mask.clientWidth, reduceMotion);
}

watch(
  [maskEl, contentEl],
  ([mask, content], _previous, onCleanup) => {
    if (!import.meta.client || !mask || !content) {
      looping.value = false;
      return;
    }

    const observer = new ResizeObserver(() => updateLooping());
    observer.observe(mask);
    observer.observe(content);
    updateLooping();

    onCleanup(() => observer.disconnect());
  }
);

watch(
  () => props.photos.map(photo => photo.id).join(),
  async () => {
    await nextTick();
    updateLooping();
  }
);

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
      +{{ PATOUNE_PHOTO }} patounes par photo.
    </p>

    <div
      v-if="photos.length"
      ref="maskEl"
      class="malta-marquee-mask malta-photo-marquee mt-4 rounded-2xl border border-default bg-elevated py-3"
      :class="{ 'malta-photo-marquee-loop': looping }"
      data-testid="malta-photo-marquee"
    >
      <div class="malta-marquee-track malta-photo-track">
        <div
          ref="contentEl"
          class="flex gap-3"
        >
          <img
            v-for="photo in photos"
            :key="photo.id"
            :src="photo.publicUrl"
            :alt="photoAlt(photo)"
            class="malta-photo-frame"
            @load="updateLooping"
          >
        </div>
        <div
          v-if="looping"
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
