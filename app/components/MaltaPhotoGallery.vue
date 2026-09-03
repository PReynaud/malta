<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import {
  adjacentPhotoIndex,
  formatMaltaPhotoPublishedAt,
  swipeNavigationDelta
} from '@/utils/malta-photo-display';
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

const SWIPE_THRESHOLD_PX = 45;

const lastClick = ref({ x: 0, y: 0 });
const selectedIndex = ref<number | null>(null);
const selectedPhotoId = ref<string | null>(null);
const maskEl = ref<HTMLElement | null>(null);
const contentEl = ref<HTMLElement | null>(null);
const looping = ref(false);
const touchStart = ref<{ x: number; y: number; id: number } | null>(null);
const suppressLightboxClick = ref(false);

const selectedPhoto = computed(() => {
  if (selectedIndex.value === null) {
    return null;
  }
  return props.photos[selectedIndex.value] ?? null;
});

const canNavigate = computed(() => props.photos.length > 1);

const selectedAuthorLabel = computed(() => {
  const photo = selectedPhoto.value;
  if (!photo) {
    return '';
  }
  return photoAuthor(photo);
});

const selectedPublishedAt = computed(() => {
  const photo = selectedPhoto.value;
  if (!photo?.created_at) {
    return '';
  }
  return formatMaltaPhotoPublishedAt(photo.created_at) ?? '';
});

function isScrollStripMode(): boolean {
  if (!import.meta.client) {
    return false;
  }
  return window.matchMedia('(max-width: 639px), (pointer: coarse)').matches;
}

function updateLooping() {
  const mask = maskEl.value;
  const content = contentEl.value;
  if (!import.meta.client || !mask || !content || isScrollStripMode()) {
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

    const mediaQuery = window.matchMedia('(max-width: 639px), (pointer: coarse)');
    const onMediaChange = () => updateLooping();
    mediaQuery.addEventListener('change', onMediaChange);

    onCleanup(() => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', onMediaChange);
    });
  }
);

watch(
  () => props.photos.map(photo => photo.id).join(),
  async () => {
    if (selectedPhotoId.value !== null) {
      const nextIndex = props.photos.findIndex(photo => photo.id === selectedPhotoId.value);
      if (nextIndex >= 0) {
        selectedIndex.value = nextIndex;
      } else if (props.photos.length === 0) {
        selectedIndex.value = null;
        selectedPhotoId.value = null;
      } else {
        selectedIndex.value = Math.min(
          selectedIndex.value ?? 0,
          props.photos.length - 1
        );
        selectedPhotoId.value = props.photos[selectedIndex.value]?.id ?? null;
      }
    }
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

function photoAuthor(photo: MaltaGalleryItem): string {
  const sitterName = sitterById.value[photo.sitter_id]?.name;
  return sitterName ? `Par ${sitterName}` : 'Par un sitter inconnu';
}

function openPhoto(photo: MaltaGalleryItem) {
  const index = props.photos.findIndex(item => item.id === photo.id);
  selectedIndex.value = index >= 0 ? index : null;
  selectedPhotoId.value = index >= 0 ? photo.id : null;
}

function closePhoto() {
  selectedIndex.value = null;
  selectedPhotoId.value = null;
  touchStart.value = null;
}

function goAdjacent(delta: number) {
  if (!canNavigate.value || selectedIndex.value === null) {
    return;
  }
  selectedIndex.value = adjacentPhotoIndex(selectedIndex.value, props.photos.length, delta);
  selectedPhotoId.value = props.photos[selectedIndex.value]?.id ?? null;
}

function onLightboxKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closePhoto();
    return;
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    goAdjacent(-1);
    return;
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    goAdjacent(1);
  }
}

function onLightboxTouchStart(event: TouchEvent) {
  const touch = event.touches[0];
  if (!touch) {
    return;
  }
  touchStart.value = { x: touch.clientX, y: touch.clientY, id: touch.identifier };
}

function onLightboxTouchCancel() {
  touchStart.value = null;
}

function onLightboxTouchEnd(event: TouchEvent) {
  const start = touchStart.value;
  touchStart.value = null;

  if (!start || !canNavigate.value) {
    return;
  }

  const touch = Array.from(event.changedTouches).find(item => item.identifier === start.id);
  if (!touch) {
    return;
  }

  const delta = swipeNavigationDelta(
    start.x,
    start.y,
    touch.clientX,
    touch.clientY,
    SWIPE_THRESHOLD_PX
  );

  if (delta === 0) {
    return;
  }

  suppressLightboxClick.value = true;
  goAdjacent(delta);
}

function onLightboxBackdropClick() {
  if (suppressLightboxClick.value) {
    suppressLightboxClick.value = false;
    return;
  }
  closePhoto();
}

watch(selectedIndex, (index, previous) => {
  if (!import.meta.client) {
    return;
  }

  const isOpen = index !== null;
  const wasOpen = previous !== null && previous !== undefined;

  if (isOpen && !wasOpen) {
    document.addEventListener('keydown', onLightboxKeydown);
    document.body.style.overflow = 'hidden';
    return;
  }

  if (!isOpen && wasOpen) {
    document.removeEventListener('keydown', onLightboxKeydown);
    document.body.style.overflow = '';
  }
});

onUnmounted(() => {
  if (!import.meta.client) {
    return;
  }

  document.removeEventListener('keydown', onLightboxKeydown);
  document.body.style.overflow = '';
});
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
          <button
            v-for="photo in photos"
            :key="photo.id"
            type="button"
            class="malta-photo-frame-button touch-manipulation"
            :aria-label="`Agrandir ${photoAlt(photo)}`"
            @click="openPhoto(photo)"
          >
            <img
              :src="photo.publicUrl"
              :alt="photoAlt(photo)"
              class="malta-photo-frame"
              @load="updateLooping"
            >
          </button>
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

    <div
      v-if="selectedPhoto"
      class="malta-photo-lightbox fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="photoAlt(selectedPhoto)"
      data-testid="malta-photo-lightbox"
      @click="onLightboxBackdropClick"
      @touchstart.passive="onLightboxTouchStart"
      @touchend="onLightboxTouchEnd"
      @touchcancel="onLightboxTouchCancel"
    >
      <button
        type="button"
        class="absolute right-3 top-3 z-10 rounded-full bg-black/50 px-3 py-1 text-sm font-semibold text-white touch-manipulation"
        aria-label="Fermer la photo agrandie"
        data-testid="malta-photo-lightbox-close"
        @click="closePhoto"
      >
        Fermer
      </button>

      <button
        v-if="canNavigate"
        type="button"
        class="malta-photo-lightbox-nav malta-photo-lightbox-prev absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-lg font-semibold text-white touch-manipulation sm:left-4"
        aria-label="Photo précédente"
        data-testid="malta-photo-lightbox-prev"
        @click.stop="goAdjacent(-1)"
        @touchend.stop
      >
        ‹
      </button>

      <button
        v-if="canNavigate"
        type="button"
        class="malta-photo-lightbox-nav malta-photo-lightbox-next absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-lg font-semibold text-white touch-manipulation sm:right-4"
        aria-label="Photo suivante"
        data-testid="malta-photo-lightbox-next"
        @click.stop="goAdjacent(1)"
        @touchend.stop
      >
        ›
      </button>

      <div
        class="malta-photo-lightbox-stage flex max-h-full max-w-full flex-col items-center gap-3"
        @click.stop
      >
        <img
          :src="selectedPhoto.publicUrl"
          :alt="photoAlt(selectedPhoto)"
          class="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-lg"
          data-testid="malta-photo-lightbox-image"
        >
        <div
          class="malta-photo-lightbox-caption text-center text-white"
          data-testid="malta-photo-lightbox-caption"
        >
          <p
            class="text-sm font-semibold sm:text-base"
            data-testid="malta-photo-lightbox-author"
          >
            {{ selectedAuthorLabel }}
          </p>
          <p
            v-if="selectedPublishedAt"
            class="mt-0.5 text-xs text-white/80 sm:text-sm"
            data-testid="malta-photo-lightbox-published"
          >
            {{ selectedPublishedAt }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
