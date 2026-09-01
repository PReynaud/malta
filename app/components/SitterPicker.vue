<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { PRESET_COLORS } from '@/utils/calendar';
import type { Sitter } from '@/stores/sitters';

const props = defineProps<{
  sitters: Sitter[];
  selectedSitterId: string | null;
  selectedSitter: Sitter | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  select: [id: string];
  create: [payload: { name: string; color: string }];
  update: [payload: { name: string; color: string }];
  logout: [];
}>();

const name = ref('');
const color = ref<string>(PRESET_COLORS[0]);

const locked = computed(() => Boolean(props.selectedSitter));
const canSubmit = computed(() => name.value.trim().length > 0 && !props.loading);
const detailsEl = ref<HTMLDetailsElement | null>(null);

watch(
  () => props.selectedSitter,
  (sitter) => {
    if (sitter) {
      name.value = sitter.name;
      color.value = sitter.color;
      return;
    }

    name.value = '';
    color.value = PRESET_COLORS[0];
  },
  { immediate: true }
);

watch(
  locked,
  () => {
    void nextTick(() => {
      if (detailsEl.value) {
        detailsEl.value.open = !locked.value;
      }
    });
  }
);

onMounted(() => {
  if (detailsEl.value) {
    detailsEl.value.open = !locked.value;
  }
});

function submit() {
  if (!canSubmit.value) {
    return;
  }

  if (locked.value) {
    emit('update', { name: name.value, color: color.value });
    return;
  }

  emit('create', { name: name.value, color: color.value });
  name.value = '';
}
</script>

<template>
  <section class="rounded-3xl border border-default bg-default/80 shadow-sm">
    <details
      ref="detailsEl"
      class="group"
    >
      <summary class="flex cursor-pointer list-none items-center gap-3 p-4 touch-manipulation [&::-webkit-details-marker]:hidden sm:p-6">
        <div class="min-w-0 flex-1">
          <h2 class="text-lg font-semibold text-highlighted">
            {{ locked ? 'Ton profil' : 'Qui es-tu ?' }}
          </h2>
          <p
            v-if="selectedSitter"
            class="mt-0.5 inline-flex items-center gap-2 truncate text-sm font-medium"
          >
            <span
              class="size-3 shrink-0 rounded-full ring-2 ring-white"
              :style="{ backgroundColor: selectedSitter.color }"
            />
            Tu es
            <span class="font-semibold">{{ selectedSitter.name }}</span>
          </p>
          <p
            v-else
            class="mt-0.5 text-sm text-muted"
          >
            Pas de mot de passe. Choisis ton nom, ou rejoins l'équipe avec une couleur que Malta reconnaîtra.
          </p>
        </div>
        <span class="shrink-0 text-muted transition group-open:rotate-180">⌄</span>
      </summary>

      <div class="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
        <p
          v-if="locked"
          class="text-sm text-muted"
        >
          Tu peux changer ton nom ou ta couleur. Pour passer sur un autre profil, déconnecte-toi.
        </p>

        <div
          v-if="!locked && sitters.length"
          class="flex flex-wrap gap-2"
        >
          <UButton
            v-for="sitter in sitters"
            :key="sitter.id"
            :label="sitter.name"
            :variant="sitter.id === selectedSitterId ? 'solid' : 'outline'"
            color="neutral"
            size="lg"
            :disabled="loading"
            :aria-pressed="sitter.id === selectedSitterId"
            @click="emit('select', sitter.id)"
          >
            <template #leading>
              <span
                class="size-3 rounded-full ring-2 ring-white"
                :style="{ backgroundColor: sitter.color }"
              />
            </template>
          </UButton>
        </div>

        <form
          class="grid gap-3"
          @submit.prevent="submit"
        >
          <UFormField
            :label="locked ? 'Ton nom' : 'Nouveau nom'"
            name="name"
          >
            <UInput
              v-model="name"
              name="name"
              placeholder="Tatie, voisin, cousin..."
              size="lg"
              :disabled="loading"
              autocomplete="nickname"
            />
          </UFormField>

          <div class="flex flex-col gap-2">
            <p class="text-sm font-medium">
              Couleur
            </p>
            <div class="flex flex-wrap items-center gap-2.5">
              <button
                v-for="preset in PRESET_COLORS"
                :key="preset"
                type="button"
                class="size-11 rounded-full border-2 shadow-sm transition touch-manipulation sm:size-9"
                :class="color === preset ? 'border-highlighted scale-110' : 'border-white/80'"
                :style="{ backgroundColor: preset }"
                :aria-label="`Choisir la couleur ${preset}`"
                :aria-pressed="color === preset"
                @click="color = preset"
              />
              <input
                v-model="color"
                type="color"
                class="size-11 cursor-pointer rounded-full border border-default bg-transparent p-0 sm:size-9"
                aria-label="Couleur personnalisée"
              >
            </div>
          </div>

          <button
            type="submit"
            class="malta-cta w-full touch-manipulation sm:w-auto sm:justify-self-start"
            :disabled="!canSubmit || loading"
          >
            <span
              v-if="loading"
              class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
            <span
              v-else
              aria-hidden="true"
            >{{ locked ? '✨' : '🐾' }}</span>
            {{ locked ? 'Enregistrer' : 'Rejoindre l\'équipe' }}
          </button>
        </form>

        <UButton
          v-if="locked"
          color="neutral"
          variant="ghost"
          size="lg"
          class="w-full touch-manipulation sm:w-auto"
          label="Se déconnecter"
          :disabled="loading"
          @click="emit('logout')"
        />
      </div>
    </details>
  </section>
</template>
