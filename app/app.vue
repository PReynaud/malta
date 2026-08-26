<script setup lang="ts">
import { useHead, useSeoMeta, useRuntimeConfig } from '#imports';

const config = useRuntimeConfig();
const title = config.public.appName;
const description = 'Calendrier de septembre pour nourrir Malta, le chat gris et blanc.';

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'fr'
  }
});

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary'
});
</script>

<template>
  <UApp>
    <NuxtPwaManifest />
    <AppHeader />
    <UMain>
      <NuxtPage />
    </UMain>
    <USeparator />
    <UFooter>
      <template #left>
        <p class="px-3 text-sm text-muted sm:px-0">
          {{ title }} • © {{ new Date().getFullYear() }}
        </p>
      </template>
    </UFooter>
  </UApp>
</template>
