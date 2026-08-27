import { defineStore } from 'pinia';
import { computed } from 'vue';
import { navigateTo, useSupabaseClient, useSupabaseUser } from '#imports';
import { getErrorMessage } from '@/utils/error-message';

export const useAuthStore = defineStore('auth', () => {
  const supabase = useSupabaseClient();
  const supabaseUser = useSupabaseUser();

  const user = computed(() => supabaseUser.value);
  const isAuthenticated = computed(() => Boolean(supabaseUser.value));

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error: unknown) {
      return {
        data: null,
        error: getErrorMessage(error, 'Une erreur est survenue lors de la connexion')
      };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return {
          data: null,
          error: 'Un compte existe déjà avec cet e-mail. Connecte-toi.'
        };
      }

      return { data, error: null };
    } catch (error: unknown) {
      return {
        data: null,
        error: getErrorMessage(error, 'Une erreur est survenue lors de l\'inscription')
      };
    }
  };

  const signOut = async (redirectTo = '/login') => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      await navigateTo(redirectTo);
      return { error: null };
    } catch (error: unknown) {
      return {
        error: getErrorMessage(error, 'Une erreur est survenue lors de la déconnexion')
      };
    }
  };

  return {
    user,
    isAuthenticated,
    signIn,
    signUp,
    signOut
  };
});
