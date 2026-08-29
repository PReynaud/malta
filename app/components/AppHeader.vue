<script setup lang="ts">
import { computed } from 'vue';
import { useRuntimeConfig } from '#imports';
import { usePatouneBanner } from '@/composables/use-patoune-banner';

const config = useRuntimeConfig();
const appName = computed(() => config.public.appName);
const { visible, restore } = usePatouneBanner();
</script>

<template>
  <header class="border-b border-default bg-default/80 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:px-6 sm:py-3">
      <NuxtLink
        to="/"
        class="flex min-w-0 items-center gap-2"
      >
        <AppLogo class="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10" />
        <span class="truncate font-semibold text-highlighted">{{ appName }}</span>
      </NuxtLink>

      <div class="flex shrink-0 items-center gap-1.5">
        <button
          v-if="!visible"
          type="button"
          class="flex size-8 items-center justify-center rounded-lg border-2 border-fuchsia-600 bg-yellow-300 text-sm font-black text-fuchsia-700 shadow-[2px_2px_0_#86198f] touch-manipulation hover:bg-yellow-200"
          aria-label="Réafficher la pub"
          title="Réafficher la pub"
          @click="restore"
        >
          ★
        </button>
        <UColorModeButton />
      </div>
    </div>
  </header>
</template>
