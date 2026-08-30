<script setup lang="ts">
import { computed } from 'vue';
import {
  buildVacationGrid,
  dayAriaLabel,
  dayEmoji,
  isFeedDateAdminLocked,
  isFeedDateLocked,
  isFeedDateReadOnly,
  isLightHex,
  isOctoberOverflow,
  isUncoveredDate,
  monthTitle,
  needsSitter,
  CALENDAR_MONTH,
  CALENDAR_YEAR,
  WEEKDAY_LABELS
} from '@/utils/calendar';
import { useParisToday } from '@/composables/use-paris-today';
import type { Sitter } from '@/stores/sitters';

const props = defineProps<{
  sitters: Sitter[];
  slotsByDate: Record<string, string[]>;
  lockedDates?: readonly string[];
  selectedSitterId: string | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  selectDate: [isoDate: string, event: MouseEvent];
}>();

const title = monthTitle(CALENDAR_YEAR, CALENDAR_MONTH);
const cells = buildVacationGrid();
const today = useParisToday();
const sitterById = computed(() => {
  const map: Record<string, Sitter> = {};
  for (const sitter of props.sitters) {
    map[sitter.id] = sitter;
  }
  return map;
});

function namesForDate(isoDate: string): string[] {
  return sittersForDate(isoDate).map(sitter => sitter.name);
}

function sittersForDate(isoDate: string): Sitter[] {
  if (!needsSitter(isoDate)) {
    return [];
  }

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

function isPastLocked(isoDate: string): boolean {
  return isFeedDateLocked(isoDate, today.value);
}

function isAdminLocked(isoDate: string): boolean {
  return isFeedDateAdminLocked(isoDate, props.lockedDates ?? []);
}

function isReadOnly(isoDate: string): boolean {
  return isFeedDateReadOnly(isoDate, props.lockedDates ?? [], today.value);
}

function sitterInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}
</script>

<template>
  <section class="min-w-0 rounded-3xl border border-default bg-default/80 p-3 shadow-sm sm:p-6">
    <div class="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-xl font-bold tracking-tight text-highlighted sm:text-3xl">
          {{ title }}
        </h2>
        <p class="text-sm text-muted">
          <span class="sm:hidden">Tape un jour orange. Une fois le jour terminé, c'est clos.</span>
          <span class="hidden sm:inline">
            Les jours orange, Malta a besoin de toi. Tape pour t'ajouter ou te retirer.
            À minuit passé (Paris), c'est clos.
          </span>
        </p>
      </div>
      <div class="flex flex-wrap gap-x-3 gap-y-1 text-[11px] sm:text-sm">
        <span class="inline-flex items-center gap-1.5">
          <span class="size-3 rounded-sm bg-secondary-200 ring-1 ring-secondary-400" />
          À pourvoir
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="size-3 rounded-sm bg-muted ring-1 ring-default" />
          Couvert
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span aria-hidden="true">🔒</span>
          Clos
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="size-3 rounded-sm bg-primary/20 ring-1 ring-primary/50" />
          Verrouillé
        </span>
      </div>
    </div>

    <div class="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted sm:gap-2 sm:text-sm">
      <div
        v-for="label in WEEKDAY_LABELS"
        :key="label"
        class="py-1 sm:py-2"
      >
        {{ label }}
      </div>
    </div>

    <div class="grid grid-cols-7 gap-0.5 sm:gap-2">
      <div
        v-for="(cell, index) in cells"
        :key="cell.isoDate || `empty-${index}`"
        class="min-w-0"
      >
        <button
          v-if="cell.inMonth && needsSitter(cell.isoDate)"
          type="button"
          class="flex min-h-[4.75rem] w-full flex-col rounded-xl border p-1 text-left transition touch-manipulation sm:min-h-32 sm:rounded-2xl sm:p-3"
          :class="[
            isUncoveredDate(cell.isoDate, slotsByDate)
              ? 'border-secondary-400 bg-secondary-100 dark:bg-secondary-900/40'
              : 'border-default bg-elevated',
            isAdminLocked(cell.isoDate) && !isPastLocked(cell.isoDate)
              ? 'border-primary/40 bg-primary/5'
              : '',
            isReadOnly(cell.isoDate)
              ? 'cursor-not-allowed opacity-80'
              : isUncoveredDate(cell.isoDate, slotsByDate)
                ? 'hover:bg-secondary-200 dark:hover:bg-secondary-900/70'
                : 'hover:border-highlighted',
            isSelectedOnDate(cell.isoDate) ? 'ring-2 ring-primary' : ''
          ]"
          :aria-label="dayAriaLabel(
            cell.isoDate,
            namesForDate(cell.isoDate),
            isPastLocked(cell.isoDate),
            isAdminLocked(cell.isoDate)
          )"
          :disabled="loading || isReadOnly(cell.isoDate)"
          @click="emit('selectDate', cell.isoDate, $event)"
        >
          <span class="flex items-start justify-between gap-0.5">
            <span class="text-sm font-bold sm:text-xl">{{ cell.day }}</span>
            <span
              v-if="isPastLocked(cell.isoDate)"
              class="rounded-full bg-default px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-muted ring-1 ring-default sm:px-2 sm:py-0.5 sm:text-xs"
            >
              Clos
            </span>
            <span
              v-else-if="isAdminLocked(cell.isoDate)"
              class="inline-flex items-center gap-0.5 rounded-full bg-primary/15 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-primary sm:gap-1 sm:px-2 sm:py-0.5 sm:text-xs"
            >
              <span aria-hidden="true">🔒</span>
              Verrouillé
            </span>
            <span
              v-else-if="isUncoveredDate(cell.isoDate, slotsByDate)"
              class="rounded-full bg-secondary-500 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-white sm:px-2 sm:py-0.5 sm:text-xs"
            >
              Faim
            </span>
          </span>

          <ul class="mt-1 flex flex-1 flex-wrap content-start gap-1 sm:mt-2 sm:flex-col sm:flex-nowrap">
            <li
              v-for="sitter in sittersForDate(cell.isoDate)"
              :key="sitter.id"
              class="flex size-6 items-center justify-center rounded-full text-[10px] font-bold sm:size-auto sm:truncate sm:px-2 sm:py-0.5 sm:text-xs sm:font-medium"
              :style="{
                backgroundColor: sitter.color,
                color: isLightHex(sitter.color) ? '#1F1E1B' : '#FAFAF9'
              }"
              :title="sitter.name"
            >
              <span class="sm:hidden">{{ sitterInitial(sitter.name) }}</span>
              <span class="hidden sm:inline">{{ sitter.name }}</span>
            </li>
          </ul>
        </button>

        <div
          v-else-if="cell.inMonth"
          class="flex min-h-[4.75rem] w-full flex-col items-center rounded-xl border p-1 text-center sm:min-h-32 sm:rounded-2xl sm:p-3"
          :class="dayEmoji(cell.isoDate)
            ? 'border-malta-200 bg-default dark:border-malta-700 dark:bg-malta-900/30'
            : 'border-malta-200/80 bg-malta-50/80 dark:border-malta-800 dark:bg-malta-900/20'"
          :aria-label="dayAriaLabel(cell.isoDate, [])"
        >
          <span class="flex w-full items-start justify-between gap-0.5">
            <span class="text-sm font-bold text-malta-800 dark:text-malta-100 sm:text-xl">
              {{ cell.day }}
            </span>
            <span
              v-if="isOctoberOverflow(cell.isoDate)"
              class="text-[9px] font-semibold uppercase tracking-wide text-muted sm:text-xs"
            >
              oct.
            </span>
          </span>
          <span
            v-if="dayEmoji(cell.isoDate)"
            class="mt-auto text-2xl leading-none sm:text-4xl"
            aria-hidden="true"
          >
            {{ dayEmoji(cell.isoDate) }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
