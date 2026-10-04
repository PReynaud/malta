<script setup lang="ts">
import { computed } from 'vue';
import { useRuntimeConfig } from '#imports';

const config = useRuntimeConfig();
const appName = computed(() => config.public.appName);
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
        <UColorModeButton />
      </div>
    </div>
  </header>
</template>
