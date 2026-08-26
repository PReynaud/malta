<script setup lang="ts">
import { computed } from 'vue';
import {
  buildMonthGrid,
  CALENDAR_MONTH,
  CALENDAR_YEAR,
  dayAriaLabel,
  isLightHex,
  isUncoveredDate,
  monthTitle,
  WEEKDAY_LABELS
} from '@/utils/calendar';
import type { Sitter } from '@/stores/sitters';

const props = defineProps<{
  sitters: Sitter[];
  slotsByDate: Record<string, string[]>;
  selectedSitterId: string | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  selectDate: [isoDate: string];
}>();

const title = monthTitle(CALENDAR_YEAR, CALENDAR_MONTH);
const cells = buildMonthGrid(CALENDAR_YEAR, CALENDAR_MONTH);
const sitterById = computed(() => {
  const map: Record<string, Sitter> = {};
  for (const sitter of props.sitters) {
    map[sitter.id] = sitter;
  }
  return map;
});

function namesForDate(isoDate: string): string[] {
  return (props.slotsByDate[isoDate] ?? [])
    .map(id => sitterById.value[id]?.name)
    .filter((name): name is string => Boolean(name));
}

function sittersForDate(isoDate: string): Sitter[] {
  return (props.slotsByDate[isoDate] ?? [])
    .map(id => sitterById.value[id])
    .filter((sitter): sitter is Sitter => Boolean(sitter));
}

function isSelectedOnDate(isoDate: string): boolean {
  if (!props.selectedSitterId) {
    return false;
  }

  return (props.slotsByDate[isoDate] ?? []).includes(props.selectedSitterId);
}
</script>

<template>
  <section class="rounded-3xl border border-default bg-default/80 p-4 shadow-sm sm:p-6">
    <div class="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-highlighted sm:text-3xl">
          {{ title }}
        </h2>
        <p class="text-sm text-muted">
          Tap a day to add or remove yourself. Empty bowls glow so Malta does not go hungry.
        </p>
      </div>
      <div class="flex gap-3 text-xs sm:text-sm">
        <span class="inline-flex items-center gap-1.5">
          <span class="size-3 rounded-sm bg-secondary-200 ring-1 ring-secondary-400" />
          Needs a sitter
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="size-3 rounded-sm bg-muted ring-1 ring-default" />
          Covered
        </span>
      </div>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-muted sm:gap-2 sm:text-sm">
      <div
        v-for="label in WEEKDAY_LABELS"
        :key="label"
        class="py-2"
      >
        {{ label }}
      </div>
    </div>

    <div class="grid grid-cols-7 gap-1 sm:gap-2">
      <div
        v-for="(cell, index) in cells"
        :key="cell.inMonth ? cell.isoDate : `empty-${index}`"
      >
        <button
          v-if="cell.inMonth"
          type="button"
          class="flex min-h-24 w-full flex-col rounded-2xl border p-2 text-left transition sm:min-h-32 sm:p-3"
          :class="[
            isUncoveredDate(cell.isoDate, slotsByDate)
              ? 'border-secondary-400 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-900/40 dark:hover:bg-secondary-900/70'
              : 'border-default bg-elevated hover:border-highlighted',
            isSelectedOnDate(cell.isoDate) ? 'ring-2 ring-primary' : ''
          ]"
          :aria-label="dayAriaLabel(cell.isoDate, namesForDate(cell.isoDate))"
          :disabled="loading"
          @click="emit('selectDate', cell.isoDate)"
        >
          <span class="flex items-center justify-between">
            <span class="text-lg font-bold sm:text-xl">{{ cell.day }}</span>
            <span
              v-if="isUncoveredDate(cell.isoDate, slotsByDate)"
              class="rounded-full bg-secondary-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white sm:text-xs"
            >
              Hungry
            </span>
          </span>

          <ul class="mt-2 flex flex-1 flex-col gap-1">
            <li
              v-for="sitter in sittersForDate(cell.isoDate)"
              :key="sitter.id"
              class="truncate rounded-full px-2 py-0.5 text-[11px] font-medium sm:text-xs"
              :style="{
                backgroundColor: sitter.color,
                color: isLightHex(sitter.color) ? '#1F1E1B' : '#FAFAF9'
              }"
            >
              {{ sitter.name }}
            </li>
          </ul>
        </button>
      </div>
    </div>
  </section>
</template>
