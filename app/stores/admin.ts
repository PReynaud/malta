import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useSupabaseClient } from '#imports';
import { getErrorMessage, isUnauthorizedError } from '@/utils/error-message';
import { nextBonusPatounes, nextMalusPatounes } from '@/utils/admin';
import { groupSlotsByDate, isFeedDateAdminLocked, needsSitter } from '@/utils/calendar';
import { rankSitters } from '@/utils/patounes';
import type { Database } from '@/types/database.types';
import type { MaltaGalleryItem, MaltaPhoto } from '@/stores/malta-photos';
import type { FeedingSlot, LockedFeedDate, Sitter } from '@/stores/sitters';

const BUCKET = 'malta-photos';

export const useAdminStore = defineStore('admin', () => {
  const supabase = useSupabaseClient<Database>();

  const sitters = ref<Sitter[]>([]);
  const photos = ref<MaltaPhoto[]>([]);
  const slots = ref<FeedingSlot[]>([]);
  const lockedDates = ref<LockedFeedDate[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const slotsByDate = computed(() => groupSlotsByDate(slots.value));
  const lockedDateSet = computed(() => new Set(lockedDates.value.map(row => row.feed_date)));

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
    const malusCounts: Record<string, number> = {};
    for (const sitter of sitters.value) {
      names[sitter.id] = sitter.name;
      bonusCounts[sitter.id] = sitter.bonus_patounes;
      malusCounts[sitter.id] = sitter.malus_patounes;
    }

    return rankSitters(
      sitters.value.map(sitter => sitter.id),
      slotsByDate.value,
      names,
      photoCounts.value,
      bonusCounts,
      malusCounts
    );
  });

  const queryAll = () => Promise.all([
    supabase.from('sitters').select('*').order('name', { ascending: true }),
    supabase.from('malta_photos').select('*').order('created_at', { ascending: false }),
    supabase.from('feeding_slots').select('*'),
    supabase.from('locked_feed_dates').select('*')
  ]);

  const fetchAll = async () => {
    loading.value = true;
    error.value = null;

    try {
      await supabase.auth.getSession();
      let [sittersResult, photosResult, slotsResult, lockedResult] = await queryAll();

      if (
        isUnauthorizedError(sittersResult.error)
        || isUnauthorizedError(photosResult.error)
        || isUnauthorizedError(slotsResult.error)
        || isUnauthorizedError(lockedResult.error)
      ) {
        await supabase.auth.refreshSession();
        [sittersResult, photosResult, slotsResult, lockedResult] = await queryAll();
      }

      if (sittersResult.data) {
        sitters.value = sittersResult.data;
      }

      if (photosResult.data) {
        photos.value = photosResult.data;
      }

      if (slotsResult.data) {
        slots.value = slotsResult.data;
      }

      if (lockedResult.data) {
        lockedDates.value = lockedResult.data;
      }

      const firstError = sittersResult.error
        || photosResult.error
        || slotsResult.error
        || lockedResult.error;
      if (firstError) {
        throw firstError;
      }

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

  const adjustMalus = async (sitterId: string, delta: number) => {
    const sitter = sitters.value.find(item => item.id === sitterId);
    if (!sitter) {
      const errorMessage = 'Profil introuvable.';
      error.value = errorMessage;
      return { data: null, error: errorMessage };
    }

    const malus_patounes = nextMalusPatounes(sitter.malus_patounes, delta);
    if (malus_patounes === sitter.malus_patounes) {
      return { data: sitter, error: null };
    }

    loading.value = true;
    error.value = null;

    try {
      const { data, error: updateError } = await supabase
        .from('sitters')
        .update({ malus_patounes })
        .eq('id', sitterId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      sitters.value = sitters.value.map(item => (item.id === sitterId ? data : item));
      return { data, error: null };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Impossible de modifier les malus');
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

  const removeSlot = async (slotId: string) => {
    const slot = slots.value.find(item => item.id === slotId);
    if (!slot) {
      const errorMessage = 'Créneau introuvable.';
      error.value = errorMessage;
      return { error: errorMessage };
    }

    loading.value = true;
    error.value = null;

    try {
      const { error: deleteError } = await supabase
        .from('feeding_slots')
        .delete()
        .eq('id', slotId);

      if (deleteError) {
        throw deleteError;
      }

      slots.value = slots.value.filter(item => item.id !== slotId);
      return { error: null };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Impossible de retirer cette personne');
      error.value = errorMessage;
      return { error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  const lockDate = async (feedDate: string) => {
    if (!needsSitter(feedDate)) {
      const errorMessage = 'Ce jour ne peut pas être verrouillé.';
      error.value = errorMessage;
      return { data: null, error: errorMessage };
    }

    if (isFeedDateAdminLocked(feedDate, lockedDateSet.value)) {
      return {
        data: lockedDates.value.find(item => item.feed_date === feedDate) ?? null,
        error: null
      };
    }

    loading.value = true;
    error.value = null;

    try {
      const { data, error: insertError } = await supabase
        .from('locked_feed_dates')
        .insert({ feed_date: feedDate })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      lockedDates.value = [...lockedDates.value, data];
      return { data, error: null };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Impossible de verrouiller ce jour');
      error.value = errorMessage;
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  const unlockDate = async (feedDate: string) => {
    if (!isFeedDateAdminLocked(feedDate, lockedDateSet.value)) {
      return { error: null };
    }

    loading.value = true;
    error.value = null;

    try {
      const { error: deleteError } = await supabase
        .from('locked_feed_dates')
        .delete()
        .eq('feed_date', feedDate);

      if (deleteError) {
        throw deleteError;
      }

      lockedDates.value = lockedDates.value.filter(item => item.feed_date !== feedDate);
      return { error: null };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Impossible de déverrouiller ce jour');
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
    lockedDates,
    lockedDateSet,
    loading,
    error,
    slotsByDate,
    photoCounts,
    galleryItems,
    rankedSitters,
    fetchAll,
    adjustBonus,
    adjustMalus,
    deletePhoto,
    removeSlot,
    lockDate,
    unlockDate,
    deleteSitter
  };
});
