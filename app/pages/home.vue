<script setup lang="ts">
import { computed } from 'vue';
import { definePageMeta, useRuntimeConfig } from '#imports';
import { useAuthStore } from '@/stores/auth';

definePageMeta({
  middleware: 'auth'
});

const config = useRuntimeConfig();
const authStore = useAuthStore();
const email = computed(() => authStore.user?.email ?? 'toi');
</script>

<template>
  <UContainer class="py-16 max-w-lg space-y-4">
    <h1 class="text-2xl font-semibold text-highlighted">
      Accueil
    </h1>
    <p class="text-muted">
      Connecté à {{ config.public.appName }} en tant que {{ email }}.
    </p>
    <UButton
      label="Déconnexion"
      color="neutral"
      variant="subtle"
      @click="authStore.signOut()"
    />
  </UContainer>
</template>
