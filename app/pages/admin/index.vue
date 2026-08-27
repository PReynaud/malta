<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { definePageMeta } from '#imports';
import { useAdminStore } from '@/stores/admin';
import { useAuthStore } from '@/stores/auth';
import { patouneLabel } from '@/utils/patounes';

definePageMeta({
  middleware: 'admin',
  ssr: false
});

const adminStore = useAdminStore();
const authStore = useAuthStore();

const query = ref('');
const confirmOpen = ref(false);
const confirmTitle = ref('');
const confirmDescription = ref('');
const confirmAction = ref<(() => Promise<unknown>) | null>(null);

const filteredSitters = computed(() => {
  const needle = query.value.trim().toLowerCase();
  const ranked = adminStore.rankedSitters;
  const sitters = adminStore.sitters;

  return ranked.filter((row) => {
    const name = sitters.find(sitter => sitter.id === row.sitterId)?.name ?? '';
    return !needle || name.toLowerCase().includes(needle);
  });
});

const sitterById = computed(() => {
  const map: Record<string, (typeof adminStore.sitters)[number]> = {};
  for (const sitter of adminStore.sitters) {
    map[sitter.id] = sitter;
  }
  return map;
});

onMounted(() => {
  void adminStore.fetchAll();
});

function openConfirm(title: string, description: string, action: () => Promise<unknown>) {
  confirmTitle.value = title;
  confirmDescription.value = description;
  confirmAction.value = action;
  confirmOpen.value = true;
}

async function runConfirm() {
  const action = confirmAction.value;
  if (!action) {
    confirmOpen.value = false;
    return;
  }

  await action();
  confirmOpen.value = false;
  confirmAction.value = null;
}

async function logout() {
  const { error } = await authStore.signOut('/admin/login');
  if (error) {
    adminStore.error = error;
  }
}

function confirmDeletePhoto(photoId: string, sitterName: string) {
  openConfirm(
    'Supprimer cette photo ?',
    `La photo de ${sitterName} disparaîtra de la galerie et les patounes associées aussi.`,
    () => adminStore.deletePhoto(photoId)
  );
}

function confirmDeleteSitter(sitterId: string, name: string) {
  openConfirm(
    `Supprimer ${name} ?`,
    'Le profil, les jours du calendrier et les photos de cette personne seront effacés.',
    () => adminStore.deleteSitter(sitterId)
  );
}
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-5 px-3 py-5 sm:px-6 sm:py-8">
    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h1 class="text-2xl font-black tracking-tight text-highlighted">
          Admin
        </h1>
        <p class="mt-1 text-sm text-muted">
          {{ adminStore.sitters.length }} profils · {{ adminStore.photos.length }} photos
        </p>
      </div>
      <UButton
        color="neutral"
        variant="subtle"
        size="sm"
        class="shrink-0 touch-manipulation"
        label="Déconnexion"
        :disabled="adminStore.loading"
        @click="logout"
      />
    </header>

    <UAlert
      v-if="adminStore.error"
      color="error"
      variant="subtle"
      :title="adminStore.error"
    />

    <section class="space-y-3 rounded-3xl border border-default bg-default/80 p-4">
      <h2 class="text-lg font-bold text-highlighted">
        Profils et patounes bonus
      </h2>
      <UInput
        v-model="query"
        icon="i-lucide-search"
        placeholder="Filtrer un nom…"
        size="lg"
        class="w-full"
      />

      <p
        v-if="adminStore.loading && !adminStore.sitters.length"
        class="text-sm text-muted"
      >
        Chargement des profils…
      </p>
      <p
        v-else-if="!adminStore.sitters.length"
        class="text-sm text-muted"
      >
        Personne n'a encore rejoint l'équipe.
      </p>
      <p
        v-else-if="query.trim() && !filteredSitters.length"
        class="text-sm text-muted"
      >
        Aucun profil ne correspond.
      </p>

      <ul class="space-y-3">
        <li
          v-for="row in filteredSitters"
          :key="row.sitterId"
          class="rounded-2xl border border-default bg-elevated p-3"
          :data-testid="`admin-sitter-${row.sitterId}`"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="truncate font-semibold text-highlighted">
                {{ sitterById[row.sitterId]?.name ?? 'Inconnu' }}
              </p>
              <p class="text-sm text-muted">
                {{ patouneLabel(row.total) }}
                · bonus {{ row.bonus }}
              </p>
            </div>
            <UButton
              color="error"
              variant="ghost"
              size="sm"
              class="touch-manipulation"
              label="Supprimer"
              :disabled="adminStore.loading"
              @click="confirmDeleteSitter(row.sitterId, sitterById[row.sitterId]?.name ?? 'ce profil')"
            />
          </div>
          <div class="mt-3 flex items-center gap-2">
            <UButton
              color="neutral"
              variant="subtle"
              size="lg"
              class="min-w-12 touch-manipulation"
              :disabled="adminStore.loading || row.bonus <= 0"
              :aria-label="`Retirer une patoune bonus à ${sitterById[row.sitterId]?.name}`"
              label="−"
              @click="adminStore.adjustBonus(row.sitterId, -1)"
            />
            <span
              class="min-w-10 text-center text-sm font-black tabular-nums"
              data-testid="admin-bonus-count"
            >
              {{ row.bonus }}
            </span>
            <UButton
              color="primary"
              variant="subtle"
              size="lg"
              class="min-w-12 touch-manipulation"
              :disabled="adminStore.loading"
              :aria-label="`Ajouter une patoune bonus à ${sitterById[row.sitterId]?.name}`"
              label="+"
              @click="adminStore.adjustBonus(row.sitterId, 1)"
            />
            <span class="text-xs text-muted">
              patounes bonus
            </span>
          </div>
        </li>
      </ul>
    </section>

    <section class="space-y-3 rounded-3xl border border-default bg-default/80 p-4">
      <h2 class="text-lg font-bold text-highlighted">
        Photos
      </h2>
      <p
        v-if="!adminStore.galleryItems.length && !adminStore.loading"
        class="text-sm text-muted"
      >
        Aucune photo pour l'instant.
      </p>
      <ul class="grid grid-cols-2 gap-3">
        <li
          v-for="photo in adminStore.galleryItems"
          :key="photo.id"
          class="overflow-hidden rounded-2xl border border-default bg-elevated"
          :data-testid="`admin-photo-${photo.id}`"
        >
          <img
            :src="photo.publicUrl"
            :alt="`Photo de Malta par ${sitterById[photo.sitter_id]?.name ?? 'inconnu'}`"
            class="aspect-square w-full object-cover"
          >
          <div class="space-y-2 p-2">
            <p class="truncate text-xs font-medium text-highlighted">
              {{ sitterById[photo.sitter_id]?.name ?? 'Inconnu' }}
            </p>
            <UButton
              color="error"
              variant="subtle"
              size="sm"
              block
              class="touch-manipulation"
              label="Supprimer"
              :disabled="adminStore.loading"
              @click="confirmDeletePhoto(photo.id, sitterById[photo.sitter_id]?.name ?? 'inconnu')"
            />
          </div>
        </li>
      </ul>
    </section>

    <div
      v-if="confirmOpen"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center"
      data-testid="admin-confirm-dialog"
    >
      <div class="w-full max-w-md space-y-3 rounded-3xl bg-default p-4 shadow-lg">
        <h3 class="text-lg font-bold text-highlighted">
          {{ confirmTitle }}
        </h3>
        <p class="text-sm text-muted">
          {{ confirmDescription }}
        </p>
        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="outline"
            block
            class="touch-manipulation"
            label="Annuler"
            @click="confirmOpen = false"
          />
          <UButton
            color="error"
            block
            class="touch-manipulation"
            label="Confirmer"
            data-testid="admin-confirm-delete"
            @click="runConfirm"
          />
        </div>
      </div>
    </div>
  </div>
</template>
