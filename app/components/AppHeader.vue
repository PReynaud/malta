<script setup lang="ts">
import { computed } from 'vue';
import { useRuntimeConfig } from '#imports';

const config = useRuntimeConfig();
const appName = computed(() => config.public.appName);
</script>

<template>
  <UHeader>
    <template #left>
      <NuxtLink
        to="/"
        class="flex items-center gap-2"
      >
        <AppLogo class="h-9 w-9 shrink-0" />
        <span class="font-semibold text-highlighted">{{ appName }}</span>
      </NuxtLink>
    </template>

    <template #right>
      <span class="hidden text-sm text-muted sm:inline">
        September feeding calendar
      </span>
      <UColorModeButton />
    </template>
  </UHeader>
</template>
