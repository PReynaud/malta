import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useSupabaseClient } from '#imports';
import { getErrorMessage } from '@/utils/error-message';
import { nextBonusPatounes } from '@/utils/admin';
import { groupSlotsByDate } from '@/utils/calendar';
import { rankSitters } from '@/utils/patounes';
import type { Database } from '@/types/database.types';
import type { MaltaGalleryItem, MaltaPhoto } from '@/stores/malta-photos';
import type { FeedingSlot, Sitter } from '@/stores/sitters';

const BUCKET = 'malta-photos';

export const useAdminStore = defineStore('admin', () => {
  const supabase = useSupabaseClient<Database>();

  const sitters = ref<Sitter[]>([]);
  const photos = ref<MaltaPhoto[]>([]);
  const slots = ref<FeedingSlot[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const slotsByDate = computed(() => groupSlotsByDate(slots.value));

  const photoCounts = computed(() => {
    const counts: Record<string, number> = {};
    for (const photo of photos.value) {
      counts[photo.sitter_id] = (counts[photo.sitter_id] ?? 0) + 1;
    }
    return counts;
  });

  const galleryItems = computed((): MaltaGalleryItem[] => {
    return photos.value.map((photo) => {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(photo.storage_path);
      return {
        ...photo,
        publicUrl: data.publicUrl
      };
    });
  });

  const rankedSitters = computed(() => {
    const names: Record<string, string> = {};
    const bonusCounts: Record<string, number> = {};
    for (const sitter of sitters.value) {
      names[sitter.id] = sitter.name;
      bonusCounts[sitter.id] = sitter.bonus_patounes;
    }

    return rankSitters(
      sitters.value.map(sitter => sitter.id),
      slotsByDate.value,
      names,
      photoCounts.value,
      bonusCounts
    );
  });

  const fetchAll = async () => {
    loading.value = true;
    error.value = null;

    try {
      const [sittersResult, photosResult, slotsResult] = await Promise.all([
        supabase.from('sitters').select('*').order('name', { ascending: true }),
        supabase.from('malta_photos').select('*').order('created_at', { ascending: false }),
        supabase.from('feeding_slots').select('*')
      ]);

      if (sittersResult.error) {
        throw sittersResult.error;
      }

      if (photosResult.error) {
        throw photosResult.error;
      }

      if (slotsResult.error) {
        throw slotsResult.error;
      }

      sitters.value = sittersResult.data ?? [];
      photos.value = photosResult.data ?? [];
      slots.value = slotsResult.data ?? [];
      return { data: sitters.value, error: null };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Impossible de charger l\'admin');
      error.value = errorMessage;
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  const adjustBonus = async (sitterId: string, delta: number) => {
    const sitter = sitters.value.find(item => item.id === sitterId);
    if (!sitter) {
      const errorMessage = 'Profil introuvable.';
      error.value = errorMessage;
      return { data: null, error: errorMessage };
    }

    const bonus_patounes = nextBonusPatounes(sitter.bonus_patounes, delta);
    if (bonus_patounes === sitter.bonus_patounes) {
      return { data: sitter, error: null };
    }

    loading.value = true;
    error.value = null;

    try {
      const { data, error: updateError } = await supabase
        .from('sitters')
        .update({ bonus_patounes })
        .eq('id', sitterId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      sitters.value = sitters.value.map(item => (item.id === sitterId ? data : item));
      return { data, error: null };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Impossible de modifier les patounes bonus');
      error.value = errorMessage;
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  const deletePhoto = async (photoId: string) => {
    const photo = photos.value.find(item => item.id === photoId);
    if (!photo) {
      const errorMessage = 'Photo introuvable.';
      error.value = errorMessage;
      return { error: errorMessage };
    }

    loading.value = true;
    error.value = null;

    try {
      const { error: deleteError } = await supabase
        .from('malta_photos')
        .delete()
        .eq('id', photoId);

      if (deleteError) {
        throw deleteError;
      }

      const { error: storageError } = await supabase.storage.from(BUCKET).remove([photo.storage_path]);
      if (storageError) {
        throw storageError;
      }

      photos.value = photos.value.filter(item => item.id !== photoId);
      return { error: null };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Impossible de supprimer la photo');
      error.value = errorMessage;
      return { error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  const deleteSitter = async (sitterId: string) => {
    const sitter = sitters.value.find(item => item.id === sitterId);
    if (!sitter) {
      const errorMessage = 'Profil introuvable.';
      error.value = errorMessage;
      return { error: errorMessage };
    }

    loading.value = true;
    error.value = null;
    const storagePaths = photos.value
      .filter(photo => photo.sitter_id === sitterId)
      .map(photo => photo.storage_path);

    try {
      const { error: deleteError } = await supabase
        .from('sitters')
        .delete()
        .eq('id', sitterId);

      if (deleteError) {
        throw deleteError;
      }

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage.from(BUCKET).remove(storagePaths);
        if (storageError) {
          throw storageError;
        }
      }

      sitters.value = sitters.value.filter(item => item.id !== sitterId);
      photos.value = photos.value.filter(photo => photo.sitter_id !== sitterId);
      slots.value = slots.value.filter(slot => slot.sitter_id !== sitterId);
      return { error: null };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Impossible de supprimer ce profil');
      error.value = errorMessage;
      return { error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  return {
    sitters,
    photos,
    slots,
    loading,
    error,
    slotsByDate,
    photoCounts,
    galleryItems,
    rankedSitters,
    fetchAll,
    adjustBonus,
    deletePhoto,
    deleteSitter
  };
});
