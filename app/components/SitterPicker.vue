<script setup lang="ts">
import { computed, ref } from 'vue';
import { PRESET_COLORS } from '@/utils/calendar';
import { useSittersStore, type Sitter } from '@/stores/sitters';

const props = defineProps<{
  sitters: Sitter[];
  selectedSitterId: string | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  select: [id: string];
  create: [payload: { name: string; color: string }];
}>();

const store = useSittersStore();
const name = ref('');
const color = ref<string>(PRESET_COLORS[0]);

const canCreate = computed(() => name.value.trim().length > 0 && !props.loading);

function submit() {
  if (!canCreate.value) {
    return;
  }

  emit('create', { name: name.value, color: color.value });
  name.value = '';
}
</script>

<template>
  <section class="rounded-3xl border border-default bg-default/80 p-5 shadow-sm sm:p-6">
    <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">
          Who are you?
        </h2>
        <p class="text-sm text-muted">
          No passwords. Pick your name, or join the crew with a color Malta will recognize.
        </p>
      </div>
      <p
        v-if="store.selectedSitter"
        class="text-sm font-medium"
      >
        Signed in as
        <span class="font-semibold">{{ store.selectedSitter.name }}</span>
      </p>
    </div>

    <div
      v-if="sitters.length"
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
      class="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
      @submit.prevent="submit"
    >
      <UFormField
        label="New name"
        name="name"
      >
        <UInput
          v-model="name"
          name="name"
          placeholder="Auntie, neighbor, cousin..."
          size="lg"
          :disabled="loading"
          autocomplete="nickname"
        />
      </UFormField>

      <div class="flex flex-col gap-2">
        <p class="text-sm font-medium">
          Color
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="preset in PRESET_COLORS"
            :key="preset"
            type="button"
            class="size-8 rounded-full border-2 transition"
            :class="color === preset ? 'border-highlighted scale-110' : 'border-transparent'"
            :style="{ backgroundColor: preset }"
            :aria-label="`Choose color ${preset}`"
            :aria-pressed="color === preset"
            @click="color = preset"
          />
          <input
            v-model="color"
            type="color"
            class="size-8 cursor-pointer rounded-full border border-default bg-transparent p-0"
            aria-label="Custom color"
          >
          <UButton
            type="submit"
            label="Join the crew"
            size="lg"
            :loading="loading"
            :disabled="!canCreate"
          />
        </div>
      </div>
    </form>
  </section>
</template>
