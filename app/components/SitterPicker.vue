<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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
}>();

const name = ref('');
const color = ref<string>(PRESET_COLORS[0]);

const locked = computed(() => Boolean(props.selectedSitter));
const canSubmit = computed(() => name.value.trim().length > 0 && !props.loading);

watch(
  () => props.selectedSitter,
  (sitter) => {
    if (sitter) {
      name.value = sitter.name;
      color.value = sitter.color;
    }
  },
  { immediate: true }
);

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
  <section class="rounded-3xl border border-default bg-default/80 p-4 shadow-sm sm:p-6">
    <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">
          {{ locked ? 'Ton profil' : 'Qui es-tu ?' }}
        </h2>
        <p class="text-sm text-muted">
          <template v-if="locked">
            Tu peux changer ton nom ou ta couleur. Plus question de passer sur le profil d'un autre.
          </template>
          <template v-else>
            Pas de mot de passe. Choisis ton nom, ou rejoins l'équipe avec une couleur que Malta reconnaîtra.
          </template>
        </p>
      </div>
      <p
        v-if="selectedSitter"
        class="inline-flex items-center gap-2 text-sm font-medium"
      >
        <span
          class="size-3 rounded-full ring-2 ring-white"
          :style="{ backgroundColor: selectedSitter.color }"
        />
        Tu es
        <span class="font-semibold">{{ selectedSitter.name }}</span>
      </p>
    </div>

    <div
      v-if="!locked && sitters.length"
      class="mt-4 flex flex-wrap gap-2"
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
      class="mt-5 grid gap-3"
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
  </section>
</template>
