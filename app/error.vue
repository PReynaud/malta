<script setup lang="ts">
import { computed } from 'vue';
import { clearError, useError } from '#imports';

const error = useError();

const title = computed(() => {
  if (error.value?.statusCode === 404) {
    return 'Page introuvable';
  }

  return 'Une erreur est survenue';
});

const message = computed(() => {
  if (error.value?.statusCode === 404) {
    return 'Cette page n\'existe pas. Malta est probablement en train de faire la sieste ailleurs.';
  }

  return error.value?.message || 'Le petit tigre a renversé quelque chose. Réessaie.';
});

function goHome() {
  clearError({ redirect: '/' });
}
</script>

<template>
  <UApp>
    <UContainer class="max-w-lg space-y-4 py-16 text-center">
      <h1 class="text-2xl font-semibold text-highlighted">
        {{ title }}
      </h1>
      <p class="text-muted">
        {{ message }}
      </p>
      <UButton
        label="Retour au calendrier"
        @click="goHome"
      />
    </UContainer>
  </UApp>
</template>
