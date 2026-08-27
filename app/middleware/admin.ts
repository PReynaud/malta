import { defineNuxtRouteMiddleware, navigateTo, useSupabaseUser } from '#imports';
import { isAdminUser } from '@/utils/admin';

export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser();

  if (!isAdminUser(user.value)) {
    return navigateTo({
      path: '/admin/login',
      query: {
        redirect: to.fullPath
      }
    });
  }
});
