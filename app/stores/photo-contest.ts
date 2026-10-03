import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useSupabaseClient } from '#imports';
import { getErrorMessage } from '@/utils/error-message';
import {
  isContestCategory,
  voteMutation,
  type ContestCategory,
  type ContestVote
} from '@/utils/photo-contest';
import type { Database } from '@/types/database.types';

export const usePhotoContestStore = defineStore('photoContest', () => {
  const supabase = useSupabaseClient<Database>();

  const votes = ref<ContestVote[]>([]);
  const closed = ref(false);
  const loading = ref(false);
  const voting = ref(false);
  const error = ref<string | null>(null);

  let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

  const applyVotes = (rows: { id: string; voter_sitter_id: string; photo_id: string; category: string }[]) => {
    votes.value = rows.flatMap((row) => {
      if (!isContestCategory(row.category)) {
        return [];
      }

      return [{
        id: row.id,
        voter_sitter_id: row.voter_sitter_id,
        photo_id: row.photo_id,
        category: row.category
      }];
    });
  };

  const fetchAll = async (options: { silent?: boolean } = {}) => {
    if (!options.silent) {
      loading.value = true;
      error.value = null;
    }

    try {
      const [votesResult, contestResult] = await Promise.all([
        supabase.from('photo_contest_votes').select('id, voter_sitter_id, photo_id, category'),
        supabase.from('photo_contest').select('closed').eq('id', 1).maybeSingle()
      ]);

      if (votesResult.error) {
        throw votesResult.error;
      }

      if (contestResult.error) {
        throw contestResult.error;
      }

      applyVotes(votesResult.data ?? []);
      closed.value = contestResult.data?.closed ?? true;
      return { data: votes.value, error: null };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Impossible de charger le concours');
      error.value = errorMessage;
      return { data: null, error: errorMessage };
    } finally {
      if (!options.silent) {
        loading.value = false;
      }
    }
  };

  const castVote = async (
    voterSitterId: string,
    photoId: string,
    category: ContestCategory
  ) => {
    if (closed.value) {
      const errorMessage = 'Le concours est terminé.';
      error.value = errorMessage;
      return { data: null, error: errorMessage };
    }

    voting.value = true;
    error.value = null;
    const mutation = voteMutation(votes.value, voterSitterId, photoId, category);

    try {
      if (mutation.type === 'insert') {
        const { data, error: insertError } = await supabase
          .from('photo_contest_votes')
          .insert({
            voter_sitter_id: mutation.voterSitterId,
            photo_id: mutation.photoId,
            category: mutation.category
          })
          .select('id, voter_sitter_id, photo_id, category')
          .single();

        if (insertError) {
          throw insertError;
        }

        applyVotes([...votes.value, data]);
      } else if (mutation.type === 'move') {
        const { data, error: updateError } = await supabase
          .from('photo_contest_votes')
          .update({ photo_id: mutation.photoId })
          .eq('id', mutation.voteId)
          .select('id, voter_sitter_id, photo_id, category')
          .single();

        if (updateError) {
          throw updateError;
        }

        applyVotes(votes.value.map(vote => (vote.id === data.id ? data : vote)));
      } else {
        const { error: deleteError } = await supabase
          .from('photo_contest_votes')
          .delete()
          .eq('id', mutation.voteId);

        if (deleteError) {
          throw deleteError;
        }

        applyVotes(votes.value.filter(vote => vote.id !== mutation.voteId));
      }

      return { data: votes.value, error: null };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Impossible d\'enregistrer le vote');
      error.value = errorMessage;
      return { data: null, error: errorMessage };
    } finally {
      voting.value = false;
    }
  };

  const setClosed = async (nextClosed: boolean) => {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: updateError } = await supabase
        .from('photo_contest')
        .update({ closed: nextClosed })
        .eq('id', 1)
        .select('closed')
        .single();

      if (updateError) {
        throw updateError;
      }

      closed.value = data.closed;
      return { data: data.closed, error: null };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Impossible de modifier le concours');
      error.value = errorMessage;
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
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
      .channel('malta-photo-contest')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'photo_contest_votes' },
        () => {
          void fetchAll({ silent: true });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'photo_contest' },
        () => {
          void fetchAll({ silent: true });
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
    votes,
    closed,
    loading,
    voting,
    error,
    fetchAll,
    castVote,
    setClosed,
    clearError,
    startRealtime,
    stopRealtime
  };
});
