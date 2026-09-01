import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useSupabaseClient } from '#imports';
import { getErrorMessage } from '@/utils/error-message';
import { groupSlotsByDate, isFeedDateAdminLocked, isFeedDateLocked, needsSitter } from '@/utils/calendar';
import {
  nextSelectedSitterId,
  readSelectedSitterId,
  writeSelectedSitterId
} from '@/utils/sitter-session';
import type { Database } from '@/types/database.types';

export type Sitter = Database['public']['Tables']['sitters']['Row'];
export type FeedingSlot = Database['public']['Tables']['feeding_slots']['Row'];
export type LockedFeedDate = Database['public']['Tables']['locked_feed_dates']['Row'];

function clientStorage(): Storage | null {
  if (!import.meta.client) {
    return null;
  }

  return window.localStorage;
}

export const useSittersStore = defineStore('sitters', () => {
  const supabase = useSupabaseClient<Database>();

  const sitters = ref<Sitter[]>([]);
  const slots = ref<FeedingSlot[]>([]);
  const lockedDates = ref<LockedFeedDate[]>([]);
  const selectedSitterId = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const selectedSitter = computed(
    () => sitters.value.find(sitter => sitter.id === selectedSitterId.value) ?? null
  );

  const slotsByDate = computed(() => groupSlotsByDate(slots.value));
  const lockedDateSet = computed(() => new Set(lockedDates.value.map(row => row.feed_date)));
  const profileLocked = computed(() => Boolean(selectedSitter.value));

  let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

  function upsertById<T extends { id: string }>(list: T[], row: T): T[] {
    const index = list.findIndex(item => item.id === row.id);
    if (index === -1) {
      return [...list, row];
    }

    const next = [...list];
    next[index] = row;
    return next;
  }

  function asRow<T extends { id: string }>(value: unknown): T | null {
    if (!value || typeof value !== 'object' || !('id' in value)) {
      return null;
    }

    const id = (value as { id: unknown }).id;
    return typeof id === 'string' ? value as T : null;
  }

  const selectSitter = (id: string) => {
    const nextId = nextSelectedSitterId(selectedSitterId.value, id);
    if (nextId !== id) {
      return;
    }

    selectedSitterId.value = id;
    writeSelectedSitterId(clientStorage(), id);
  };

  const clearSelectedSitter = () => {
    error.value = null;
    selectedSitterId.value = null;
    writeSelectedSitterId(clientStorage(), null);
  };

  const fetchAll = async (options: { silent?: boolean } = {}) => {
    if (!options.silent) {
      loading.value = true;
      error.value = null;
    }

    try {
      const [sittersResult, slotsResult, lockedResult] = await Promise.all([
        supabase.from('sitters').select('*').order('created_at', { ascending: true }),
        supabase.from('feeding_slots').select('*'),
        supabase.from('locked_feed_dates').select('*')
      ]);

      if (sittersResult.error) {
        throw sittersResult.error;
      }

      if (slotsResult.error) {
        throw slotsResult.error;
      }

      if (lockedResult.error) {
        throw lockedResult.error;
      }

      sitters.value = sittersResult.data ?? [];
      slots.value = slotsResult.data ?? [];
      lockedDates.value = lockedResult.data ?? [];

      const stored = readSelectedSitterId(clientStorage());
      if (stored && sitters.value.some(sitter => sitter.id === stored)) {
        selectedSitterId.value = stored;
      } else {
        if (stored) {
          writeSelectedSitterId(clientStorage(), null);
        }

        selectedSitterId.value = null;
      }

      return { error: null };
    } catch (err: unknown) {
      if (options.silent) {
        return { error: getErrorMessage(err, 'Impossible de charger le calendrier') };
      }

      const errorMessage = getErrorMessage(err, 'Impossible de charger le calendrier');
      error.value = errorMessage;
      return { error: errorMessage };
    } finally {
      if (!options.silent) {
        loading.value = false;
      }
    }
  };

  const createSitter = async (name: string, color: string) => {
    loading.value = true;
    error.value = null;
    const trimmed = name.trim();

    try {
      const { data, error: insertError } = await supabase
        .from('sitters')
        .insert({ name: trimmed, color })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('Ce nom est déjà dans l\'équipe. Choisis-le dans la liste.');
        }

        throw insertError;
      }

      sitters.value = [...sitters.value, data];
      selectSitter(data.id);
      return { data, error: null };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Impossible de créer le profil');
      error.value = errorMessage;
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  const updateSelectedSitter = async (name: string, color: string) => {
    if (!selectedSitterId.value) {
      const errorMessage = 'Choisis d\'abord qui tu es.';
      error.value = errorMessage;
      return { error: errorMessage };
    }

    const trimmed = name.trim();
    if (!trimmed) {
      const errorMessage = 'Il faut un nom.';
      error.value = errorMessage;
      return { error: errorMessage };
    }

    loading.value = true;
    error.value = null;
    const sitterId = selectedSitterId.value;

    try {
      const { data, error: updateError } = await supabase
        .from('sitters')
        .update({ name: trimmed, color })
        .eq('id', sitterId)
        .select()
        .single();

      if (updateError) {
        if (updateError.code === '23505') {
          throw new Error('Ce nom est déjà pris.');
        }

        throw updateError;
      }

      sitters.value = sitters.value.map(sitter => (sitter.id === sitterId ? data : sitter));
      return { data, error: null };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Impossible d\'enregistrer le profil');
      error.value = errorMessage;
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  const toggleAvailability = async (isoDate: string) => {
    if (!needsSitter(isoDate)) {
      const errorMessage = 'Ce jour-là, le maître est un bon maître.';
      error.value = errorMessage;
      return { error: errorMessage };
    }

    if (!selectedSitterId.value) {
      const errorMessage = 'Choisis d\'abord qui tu es, puis tape un jour.';
      error.value = errorMessage;
      return { error: errorMessage };
    }

    if (isFeedDateLocked(isoDate)) {
      const errorMessage = 'Ce jour est déjà passé : plus d\'ajout ni de retrait.';
      error.value = errorMessage;
      return { error: errorMessage };
    }

    if (isFeedDateAdminLocked(isoDate, lockedDateSet.value)) {
      const errorMessage = 'Ce jour est verrouillé : plus d\'ajout ni de retrait.';
      error.value = errorMessage;
      return { error: errorMessage };
    }

    loading.value = true;
    error.value = null;
    const sitterId = selectedSitterId.value;
    const existing = slots.value.find(
      slot => slot.sitter_id === sitterId && slot.feed_date === isoDate
    );

    try {
      if (existing) {
        const { error: deleteError } = await supabase
          .from('feeding_slots')
          .delete()
          .eq('id', existing.id);

        if (deleteError) {
          throw deleteError;
        }

        slots.value = slots.value.filter(slot => slot.id !== existing.id);
      } else {
        const { data, error: insertError } = await supabase
          .from('feeding_slots')
          .insert({ sitter_id: sitterId, feed_date: isoDate })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        slots.value = [...slots.value, data];
      }

      return { error: null };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Impossible de mettre à jour ce jour');
      error.value = errorMessage;
      return { error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  const applySitterChange = (eventType: string, nextRow: unknown, oldRow: unknown) => {
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      const row = asRow<Sitter>(nextRow);
      if (row) {
        sitters.value = upsertById(sitters.value, row);
      }
      return;
    }

    if (eventType === 'DELETE') {
      const row = asRow<Sitter>(oldRow);
      if (row) {
        sitters.value = sitters.value.filter(sitter => sitter.id !== row.id);
      }
    }
  };

  const applySlotChange = (eventType: string, nextRow: unknown, oldRow: unknown) => {
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      const row = asRow<FeedingSlot>(nextRow);
      if (row) {
        slots.value = upsertById(slots.value, row);
      }
      return;
    }

    if (eventType === 'DELETE') {
      const row = asRow<FeedingSlot>(oldRow);
      if (row) {
        slots.value = slots.value.filter(slot => slot.id !== row.id);
      }
    }
  };

  const applyLockedDateChange = (eventType: string, nextRow: unknown, oldRow: unknown) => {
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      const row = nextRow as LockedFeedDate | null;
      if (row?.feed_date) {
        const index = lockedDates.value.findIndex(item => item.feed_date === row.feed_date);
        if (index === -1) {
          lockedDates.value = [...lockedDates.value, row];
        } else {
          const next = [...lockedDates.value];
          next[index] = row;
          lockedDates.value = next;
        }
      }
      return;
    }

    if (eventType === 'DELETE') {
      const row = oldRow as LockedFeedDate | null;
      if (row?.feed_date) {
        lockedDates.value = lockedDates.value.filter(item => item.feed_date !== row.feed_date);
      }
    }
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      void fetchAll({ silent: true });
    }
  };

  const startRealtime = () => {
    if (!import.meta.client || realtimeChannel) {
      return;
    }

    realtimeChannel = supabase
      .channel('malta-calendar')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sitters' },
        (payload) => {
          applySitterChange(payload.eventType, payload.new, payload.old);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feeding_slots' },
        (payload) => {
          applySlotChange(payload.eventType, payload.new, payload.old);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'locked_feed_dates' },
        (payload) => {
          applyLockedDateChange(payload.eventType, payload.new, payload.old);
        }
      )
      .subscribe();

    document.addEventListener('visibilitychange', onVisibility);
  };

  const stopRealtime = () => {
    if (import.meta.client) {
      document.removeEventListener('visibilitychange', onVisibility);
    }

    if (realtimeChannel) {
      void supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  };

  return {
    sitters,
    slots,
    lockedDates,
    lockedDateSet,
    selectedSitterId,
    selectedSitter,
    slotsByDate,
    profileLocked,
    loading,
    error,
    selectSitter,
    clearSelectedSitter,
    fetchAll,
    createSitter,
    updateSelectedSitter,
    toggleAvailability,
    startRealtime,
    stopRealtime
  };
});
