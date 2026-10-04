<script setup lang="ts">
import { ref, watch } from 'vue';
import { definePageMeta, navigateTo, useSupabaseUser } from '#imports';
import { useAuthStore } from '@/stores/auth';
import { isAdminUser, waitForAdminUser } from '@/utils/admin';

definePageMeta({
  ssr: false
});

const authStore = useAuthStore();
const user = useSupabaseUser();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');
const pendingRedirect = ref(false);

watch(user, (value) => {
  if (pendingRedirect.value || !isAdminUser(value)) {
    return;
  }

  void navigateTo('/admin');
}, { immediate: true });

async function submit() {
  loading.value = true;
  errorMessage.value = '';
  pendingRedirect.value = true;

  try {
    const result = await authStore.signIn(email.value, password.value);

    if (result.error) {
      errorMessage.value = 'E-mail ou mot de passe incorrect.';
      return;
    }

    if (!isAdminUser(result.data?.user)) {
      const signOutResult = await authStore.signOut('/admin/login');
      errorMessage.value = signOutResult.error
        ? signOutResult.error
        : 'Ce compte n\'a pas accès à l\'admin.';
      return;
    }

    const ready = await waitForAdminUser(
      () => user.value,
      listener => watch(user, () => listener())
    );

    if (!ready) {
      errorMessage.value = 'La session n\'a pas pu être confirmée. Réessaie.';
      return;
    }

    await navigateTo('/admin');
  } finally {
    pendingRedirect.value = false;
    loading.value = false;
  }
}
</script>

<template>
  <UContainer class="max-w-md py-10 sm:py-16">
    <div class="space-y-6">
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-semibold text-highlighted">
          Admin Malta
        </h1>
        <p class="text-muted">
          Connexion réservée. Pas d'inscription.
        </p>
      </div>

      <form
        class="space-y-4"
        data-testid="admin-login-form"
        @submit.prevent="submit"
      >
        <UFormField
          label="E-mail"
          name="email"
        >
          <UInput
            v-model="email"
            type="email"
            autocomplete="username"
            required
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Mot de passe"
          name="password"
        >
          <UInput
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
            required
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="errorMessage"
          color="error"
          variant="subtle"
          :title="errorMessage"
        />

        <UButton
          type="submit"
          block
          size="lg"
          :loading="loading"
          label="Se connecter"
        />
      </form>
    </div>
  </UContainer>
</template>
