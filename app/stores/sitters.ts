import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useSupabaseClient } from '#imports';
import { getErrorMessage } from '@/utils/error-message';
import { groupSlotsByDate } from '@/utils/calendar';
import type { Database } from '@/types/database.types';

export type Sitter = Database['public']['Tables']['sitters']['Row'];
export type FeedingSlot = Database['public']['Tables']['feeding_slots']['Row'];

const SELECTED_SITTER_KEY = 'malta-sitter-id';

function readSelectedSitterId(): string | null {
  if (!import.meta.client) {
    return null;
  }

  return window.localStorage.getItem(SELECTED_SITTER_KEY);
}

function writeSelectedSitterId(id: string | null): void {
  if (!import.meta.client) {
    return;
  }

  if (id) {
    window.localStorage.setItem(SELECTED_SITTER_KEY, id);
  } else {
    window.localStorage.removeItem(SELECTED_SITTER_KEY);
  }
}

export const useSittersStore = defineStore('sitters', () => {
  const supabase = useSupabaseClient<Database>();

  const sitters = ref<Sitter[]>([]);
  const slots = ref<FeedingSlot[]>([]);
  const selectedSitterId = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const selectedSitter = computed(
    () => sitters.value.find(sitter => sitter.id === selectedSitterId.value) ?? null
  );

  const slotsByDate = computed(() => groupSlotsByDate(slots.value));

  const selectSitter = (id: string) => {
    selectedSitterId.value = id;
    writeSelectedSitterId(id);
  };

  const fetchAll = async () => {
    loading.value = true;
    error.value = null;

    try {
      const [sittersResult, slotsResult] = await Promise.all([
        supabase.from('sitters').select('*').order('created_at', { ascending: true }),
        supabase.from('feeding_slots').select('*')
      ]);

      if (sittersResult.error) {
        throw sittersResult.error;
      }

      if (slotsResult.error) {
        throw slotsResult.error;
      }

      sitters.value = sittersResult.data ?? [];
      slots.value = slotsResult.data ?? [];

      const stored = readSelectedSitterId();
      if (stored && sitters.value.some(sitter => sitter.id === stored)) {
        selectedSitterId.value = stored;
      } else if (stored) {
        writeSelectedSitterId(null);
        selectedSitterId.value = null;
      }

      return { error: null };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Could not load the calendar');
      error.value = errorMessage;
      return { error: errorMessage };
    } finally {
      loading.value = false;
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
          throw new Error('That name is already on the crew. Pick it from the list.');
        }

        throw insertError;
      }

      sitters.value = [...sitters.value, data];
      selectSitter(data.id);
      return { data, error: null };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Could not create the sitter');
      error.value = errorMessage;
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  const toggleAvailability = async (isoDate: string) => {
    if (!selectedSitterId.value) {
      const errorMessage = 'Pick who you are first — then tap a day.';
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
      const errorMessage = getErrorMessage(err, 'Could not update that day');
      error.value = errorMessage;
      return { error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  return {
    sitters,
    slots,
    selectedSitterId,
    selectedSitter,
    slotsByDate,
    loading,
    error,
    selectSitter,
    fetchAll,
    createSitter,
    toggleAvailability
  };
});
