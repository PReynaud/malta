<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import {
  adjacentPhotoIndex,
  formatMaltaPhotoPublishedAt,
  swipeNavigationDelta
} from '@/utils/malta-photo-display';
import {
  categoryCount,
  contestCategory,
  CONTEST_CATEGORIES,
  voterCategoriesForPhoto,
  voterPhotoIdForCategory,
  voteCountLabel,
  type ContestCategory,
  type ContestVote
} from '@/utils/photo-contest';
import type { MaltaGalleryItem } from '@/stores/malta-photos';
import type { Sitter } from '@/stores/sitters';

const props = defineProps<{
  photos: MaltaGalleryItem[];
  sitters: Sitter[];
  votes: ContestVote[];
  selectedSitterId: string | null;
  closed: boolean;
  voting: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  vote: [payload: { photoId: string; category: ContestCategory }];
}>();

const SWIPE_THRESHOLD_PX = 45;

const selectedIndex = ref<number | null>(null);
const selectedPhotoId = ref<string | null>(null);
const touchStart = ref<{ x: number; y: number; id: number } | null>(null);
const suppressLightboxClick = ref(false);

const selectedPhoto = computed(() => {
  if (selectedIndex.value === null) {
    return null;
  }
  return props.photos[selectedIndex.value] ?? null;
});

const canNavigate = computed(() => props.photos.length > 1);
const canVote = computed(() => Boolean(props.selectedSitterId) && !props.closed && !props.voting);

const voteHint = computed(() => {
  if (!props.selectedSitterId) {
    return 'Choisis ton nom pour voter.';
  }

  if (props.closed) {
    return 'Le concours est terminé.';
  }

  return '';
});

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

watch(
  () => props.photos.map(photo => photo.id).join(),
  () => {
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
  }
);

const sitterById = computed(() => {
  const map: Record<string, Sitter> = {};
  for (const sitter of props.sitters) {
    map[sitter.id] = sitter;
  }
  return map;
});

function photoAlt(photo: MaltaGalleryItem): string {
  const sitterName = sitterById.value[photo.sitter_id]?.name;
  return sitterName ? `Photo de Malta par ${sitterName}` : 'Photo de Malta';
}

function photoAuthor(photo: MaltaGalleryItem): string {
  const sitterName = sitterById.value[photo.sitter_id]?.name;
  return sitterName ? `Par ${sitterName}` : 'Par un sitter inconnu';
}

function authorName(photo: MaltaGalleryItem): string {
  return sitterById.value[photo.sitter_id]?.name ?? 'Inconnu';
}

function openPhoto(photo: MaltaGalleryItem) {
  const index = props.photos.findIndex(item => item.id === photo.id);
  selectedIndex.value = index >= 0 ? index : null;
  selectedPhotoId.value = index >= 0 ? photo.id : null;
}

function openPhotoById(photoId: string) {
  const photo = props.photos.find(item => item.id === photoId);
  if (photo) {
    openPhoto(photo);
  }
}

function openBallot(category: ContestCategory) {
  const photoId = ballotPhotoId(category);
  if (photoId) {
    openPhotoById(photoId);
  }
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

function marksFor(photoId: string): ContestCategory[] {
  if (!props.selectedSitterId) {
    return [];
  }

  return voterCategoriesForPhoto(props.votes, props.selectedSitterId, photoId);
}

function ballotPhotoId(category: ContestCategory): string | null {
  if (!props.selectedSitterId) {
    return null;
  }

  return voterPhotoIdForCategory(props.votes, props.selectedSitterId, category);
}

function ballotAuthor(category: ContestCategory): string {
  const photoId = ballotPhotoId(category);
  if (!photoId) {
    return 'pas encore';
  }

  const photo = props.photos.find(item => item.id === photoId);
  if (!photo) {
    return 'photo retirée';
  }

  return authorName(photo);
}

function isPressed(photoId: string, category: ContestCategory): boolean {
  return ballotPhotoId(category) === photoId;
}

function voteLabel(photoId: string, category: ContestCategory): string {
  const count = categoryCount(props.votes, photoId, category);
  return `${contestCategory(category).label} · ${voteCountLabel(count)}`;
}

function onVote(category: ContestCategory) {
  const photo = selectedPhoto.value;
  if (!photo || !canVote.value) {
    return;
  }

  emit('vote', { photoId: photo.id, category });
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
      Ouvre une photo pour la juger.
    </p>
    <p
      v-if="closed"
      class="mt-2 text-sm font-semibold text-highlighted"
      data-testid="contest-closed"
    >
      Le concours est terminé. Les votes restent visibles.
    </p>

    <div
      class="mt-4 grid grid-cols-3 gap-2"
      data-testid="contest-ballot"
    >
      <button
        v-for="category in CONTEST_CATEGORIES"
        :key="category.id"
        type="button"
        class="rounded-2xl border px-2 py-2 text-left text-xs font-semibold touch-manipulation sm:text-sm"
        :class="ballotPhotoId(category.id)
          ? 'border-secondary-400 bg-secondary-50 text-highlighted dark:bg-secondary-950/40'
          : 'border-default bg-elevated text-muted'"
        :data-testid="`contest-ballot-${category.id}`"
        :disabled="!ballotPhotoId(category.id)"
        @click="openBallot(category.id)"
      >
        <span class="block">{{ category.shortLabel }}</span>
        <span class="mt-0.5 block truncate font-medium">{{ ballotAuthor(category.id) }}</span>
      </button>
    </div>

    <div
      v-if="photos.length"
      class="malta-photo-grid mt-4"
      data-testid="malta-photo-grid"
    >
      <button
        v-for="photo in photos"
        :key="photo.id"
        type="button"
        class="malta-photo-grid-button touch-manipulation"
        :aria-label="`Agrandir ${photoAlt(photo)}`"
        @click="openPhoto(photo)"
      >
        <span class="relative block">
          <img
            :src="photo.publicUrl"
            :alt="photoAlt(photo)"
            class="malta-photo-tile"
          >
          <span
            v-if="marksFor(photo.id).length"
            class="absolute top-2 right-2 flex gap-1"
          >
            <span
              v-for="category in marksFor(photo.id)"
              :key="category"
              class="rounded-full bg-black/70 px-1.5 py-0.5 text-sm"
              :data-testid="`contest-mark-${photo.id}-${category}`"
              :aria-label="contestCategory(category).label"
            >
              {{ contestCategory(category).mark }}
            </span>
          </span>
        </span>
        <span class="truncate text-xs font-semibold text-highlighted sm:text-sm">
          {{ authorName(photo) }}
        </span>
      </button>
    </div>

    <p
      v-else
      class="mt-4 text-sm text-muted"
    >
      Pas encore de photo.
    </p>

    <UAlert
      v-if="error"
      class="mt-4"
      color="error"
      variant="subtle"
      data-testid="contest-vote-error"
      :title="error"
    />

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
          class="max-h-[60vh] max-w-full rounded-2xl object-contain shadow-lg"
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

        <p
          v-if="voteHint"
          class="text-center text-sm text-white"
          data-testid="contest-vote-hint"
        >
          {{ voteHint }}
        </p>

        <div class="flex w-full max-w-md flex-col gap-2">
          <UButton
            v-for="category in CONTEST_CATEGORIES"
            :key="category.id"
            block
            size="lg"
            class="touch-manipulation"
            :color="category.id === 'lamest' ? 'error' : 'primary'"
            :variant="isPressed(selectedPhoto.id, category.id) ? 'solid' : 'outline'"
            :disabled="!canVote"
            :aria-pressed="isPressed(selectedPhoto.id, category.id) ? 'true' : 'false'"
            :label="voteLabel(selectedPhoto.id, category.id)"
            :data-testid="`contest-vote-${category.id}`"
            @click="onVote(category.id)"
          />
        </div>
      </div>
    </div>
  </section>
</template>
