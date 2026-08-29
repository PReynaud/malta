<script setup lang="ts">
import { computed } from 'vue';
import {
  patouneLabel,
  PATOUNE_BASE,
  PATOUNE_PHOTO,
  PATOUNE_SOLO,
  PATOUNE_STREAK,
  PATOUNE_WEEKEND,
  rankSitters
} from '@/utils/patounes';
import { isLightHex } from '@/utils/calendar';
import type { Sitter } from '@/stores/sitters';

const props = defineProps<{
  sitters: Sitter[];
  slotsByDate: Record<string, string[]>;
  selectedSitterId: string | null;
  photoCounts?: Record<string, number>;
}>();

const ranked = computed(() => {
  const names: Record<string, string> = {};
  const bonusCounts: Record<string, number> = {};
  const malusCounts: Record<string, number> = {};
  for (const sitter of props.sitters) {
    names[sitter.id] = sitter.name;
    bonusCounts[sitter.id] = sitter.bonus_patounes;
    malusCounts[sitter.id] = sitter.malus_patounes;
  }

  return rankSitters(
    props.sitters.map(sitter => sitter.id),
    props.slotsByDate,
    names,
    props.photoCounts ?? {},
    bonusCounts,
    malusCounts
  );
});

const sitterById = computed(() => {
  const map: Record<string, Sitter> = {};
  for (const sitter of props.sitters) {
    map[sitter.id] = sitter;
  }
  return map;
});
</script>

<template>
  <section class="rounded-3xl border border-default bg-default/80 p-4 shadow-sm sm:p-6">
    <h2 class="text-xl font-bold tracking-tight text-highlighted sm:text-2xl">
      Classement des patounes
    </h2>
    <p class="mt-1 text-sm text-muted">
      {{ PATOUNE_BASE }} par jour,
      +{{ PATOUNE_SOLO }} si tu es seul·e (sauvetage),
      +{{ PATOUNE_WEEKEND }} le week-end,
      +{{ PATOUNE_STREAK }} par jour d'affilée,
      +{{ PATOUNE_PHOTO }} par photo de Malta.
      Tu te retires, tu perds les patounes.
    </p>

    <ol
      v-if="ranked.length"
      class="mt-4 space-y-2"
    >
      <li
        v-for="row in ranked"
        :key="row.sitterId"
        class="flex items-center gap-3 rounded-2xl border px-3 py-2"
        :class="row.sitterId === selectedSitterId
          ? 'border-secondary-400 bg-secondary-50 dark:bg-secondary-950/40'
          : 'border-default bg-elevated'"
      >
        <span class="w-6 shrink-0 text-center text-sm font-black text-muted">
          {{ row.rank }}
        </span>
        <span
          v-if="sitterById[row.sitterId]"
          class="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          :style="{
            backgroundColor: sitterById[row.sitterId]?.color,
            color: isLightHex(sitterById[row.sitterId]?.color ?? '#000000') ? '#1F1E1B' : '#FAFAF9'
          }"
        >
          {{ (sitterById[row.sitterId]?.name ?? '?').charAt(0).toUpperCase() }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold text-highlighted">
            {{ sitterById[row.sitterId]?.name ?? 'Inconnu' }}
          </p>
          <p
            v-if="row.title"
            class="truncate text-xs font-medium text-secondary-700 dark:text-secondary-300"
          >
            {{ row.title }}
          </p>
        </div>
        <p class="shrink-0 text-sm font-black tabular-nums">
          {{ patouneLabel(row.total) }}
        </p>
      </li>
    </ol>

    <p
      v-else
      class="mt-4 text-sm text-muted"
    >
      Personne n'a encore de patounes. Le premier bol compte double, presque.
    </p>
  </section>
</template>
