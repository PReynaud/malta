<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  buildVacationGrid,
  dayEmoji,
  formatDayLabel,
  isFeedDateAdminLocked,
  isLightHex,
  isOctoberOverflow,
  isUncoveredDate,
  needsSitter,
  WEEKDAY_LABELS
} from '@/utils/calendar';
import type { FeedingSlot, Sitter } from '@/stores/sitters';

const props = defineProps<{
  sitters: Sitter[];
  slots: FeedingSlot[];
  slotsByDate: Record<string, string[]>;
  lockedDates: readonly string[];
  loading: boolean;
}>();

const emit = defineEmits<{
  selectDate: [isoDate: string];
  removeSlot: [slotId: string];
  lockDate: [isoDate: string];
  unlockDate: [isoDate: string];
}>();

const selectedDate = ref<string | null>(null);

const cells = buildVacationGrid();

const sitterById = computed(() => {
  const map: Record<string, Sitter> = {};
  for (const sitter of props.sitters) {
    map[sitter.id] = sitter;
  }
  return map;
});

const slotsForSelectedDate = computed(() => {
  if (!selectedDate.value) {
    return [];
  }

  return props.slots.filter(slot => slot.feed_date === selectedDate.value);
});

const selectedDateLocked = computed(() => {
  if (!selectedDate.value) {
    return false;
  }

  return isFeedDateAdminLocked(selectedDate.value, props.lockedDates);
});

const multipleSittersOnSelectedDate = computed(() => slotsForSelectedDate.value.length > 1);

function sittersForDate(isoDate: string): Sitter[] {
  if (!needsSitter(isoDate)) {
    return [];
  }

  return (props.slotsByDate[isoDate] ?? [])
    .map(id => sitterById.value[id])
    .filter((sitter): sitter is Sitter => Boolean(sitter));
}

function sitterInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

function openDay(isoDate: string) {
  selectedDate.value = isoDate;
  emit('selectDate', isoDate);
}

function closePanel() {
  selectedDate.value = null;
}
</script>

<template>
  <section
    class="space-y-3 rounded-3xl border border-default bg-default/80 p-4"
    data-testid="admin-calendar"
  >
    <div>
      <h2 class="text-lg font-bold text-highlighted">
        Calendrier
      </h2>
      <p class="text-sm text-muted">
        Tape un jour orange pour voir qui nourrit Malta, retirer quelqu'un ou verrouiller la journée.
      </p>
    </div>

    <div class="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted sm:gap-2 sm:text-xs">
      <div
        v-for="label in WEEKDAY_LABELS"
        :key="label"
        class="py-1"
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
          class="flex min-h-[3.5rem] w-full flex-col rounded-xl border p-1 text-left transition touch-manipulation sm:min-h-24 sm:rounded-2xl sm:p-2"
          :class="[
            isUncoveredDate(cell.isoDate, slotsByDate)
              ? 'border-secondary-400 bg-secondary-100 dark:bg-secondary-900/40'
              : 'border-default bg-elevated',
            isFeedDateAdminLocked(cell.isoDate, lockedDates)
              ? 'border-primary/40 bg-primary/5'
              : '',
            selectedDate === cell.isoDate ? 'ring-2 ring-primary' : 'hover:border-highlighted'
          ]"
          :data-testid="`admin-calendar-day-${cell.isoDate}`"
          :aria-label="formatDayLabel(cell.isoDate)"
          :disabled="loading"
          @click="openDay(cell.isoDate)"
        >
          <span class="flex items-start justify-between gap-0.5">
            <span class="text-sm font-bold sm:text-lg">{{ cell.day }}</span>
            <span
              v-if="isFeedDateAdminLocked(cell.isoDate, lockedDates)"
              class="text-[9px] font-semibold uppercase tracking-wide text-primary sm:text-[10px]"
            >
              🔒
            </span>
            <span
              v-else-if="isUncoveredDate(cell.isoDate, slotsByDate)"
              class="rounded-full bg-secondary-500 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-white"
            >
              Faim
            </span>
          </span>

          <ul class="mt-1 flex flex-1 flex-wrap content-start gap-1">
            <li
              v-for="sitter in sittersForDate(cell.isoDate)"
              :key="sitter.id"
              class="flex size-5 items-center justify-center rounded-full text-[9px] font-bold sm:size-6 sm:text-[10px]"
              :style="{
                backgroundColor: sitter.color,
                color: isLightHex(sitter.color) ? '#1F1E1B' : '#FAFAF9'
              }"
              :title="sitter.name"
            >
              {{ sitterInitial(sitter.name) }}
            </li>
          </ul>
        </button>

        <div
          v-else-if="cell.inMonth"
          class="flex min-h-[3.5rem] w-full flex-col items-center rounded-xl border p-1 text-center sm:min-h-24 sm:rounded-2xl sm:p-2"
          :class="dayEmoji(cell.isoDate)
            ? 'border-malta-200 bg-default dark:border-malta-700 dark:bg-malta-900/30'
            : 'border-malta-200/80 bg-malta-50/80 dark:border-malta-800 dark:bg-malta-900/20'"
        >
          <span class="text-sm font-bold text-malta-800 dark:text-malta-100 sm:text-lg">
            {{ cell.day }}
          </span>
          <span
            v-if="dayEmoji(cell.isoDate)"
            class="mt-auto text-xl leading-none sm:text-2xl"
            aria-hidden="true"
          >
            {{ dayEmoji(cell.isoDate) }}
          </span>
          <span
            v-else-if="isOctoberOverflow(cell.isoDate)"
            class="mt-auto text-[9px] font-semibold uppercase tracking-wide text-muted"
          >
            oct.
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="selectedDate"
      class="space-y-3 rounded-2xl border border-default bg-elevated p-3"
      data-testid="admin-day-panel"
    >
      <div class="flex items-start justify-between gap-2">
        <div>
          <h3 class="font-semibold text-highlighted">
            {{ formatDayLabel(selectedDate) }}
          </h3>
          <p class="text-sm text-muted">
            {{ selectedDateLocked ? 'Journée verrouillée pour tout le monde.' : 'Encore modifiable par les volontaires.' }}
          </p>
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          class="touch-manipulation"
          label="Fermer"
          @click="closePanel"
        />
      </div>

      <p
        v-if="multipleSittersOnSelectedDate && !selectedDateLocked"
        class="text-sm text-warning"
      >
        Plusieurs personnes sont sur ce jour. Retire les extras avant de verrouiller si tu veux n'en garder qu'une.
      </p>

      <p
        v-if="!slotsForSelectedDate.length"
        class="text-sm text-muted"
      >
        Personne n'est prévu sur ce jour.
      </p>

      <ul
        v-else
        class="space-y-2"
      >
        <li
          v-for="slot in slotsForSelectedDate"
          :key="slot.id"
          class="flex items-center justify-between gap-2 rounded-xl border border-default bg-default px-3 py-2"
          :data-testid="`admin-day-slot-${slot.id}`"
        >
          <span class="truncate font-medium text-highlighted">
            {{ sitterById[slot.sitter_id]?.name ?? 'Inconnu' }}
          </span>
          <UButton
            color="error"
            variant="subtle"
            size="sm"
            class="touch-manipulation"
            label="Retirer"
            :disabled="loading"
            @click="emit('removeSlot', slot.id)"
          />
        </li>
      </ul>

      <div class="flex flex-wrap gap-2">
        <UButton
          v-if="selectedDateLocked"
          color="neutral"
          variant="outline"
          class="touch-manipulation"
          label="Déverrouiller"
          data-testid="admin-unlock-day"
          :disabled="loading"
          @click="emit('unlockDate', selectedDate)"
        />
        <UButton
          v-else
          color="primary"
          variant="solid"
          class="touch-manipulation"
          label="Verrouiller ce jour"
          data-testid="admin-lock-day"
          :disabled="loading"
          @click="emit('lockDate', selectedDate)"
        />
      </div>
    </div>
  </section>
</template>
