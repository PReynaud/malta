import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useSupabaseClient } from '#imports';
import { getErrorMessage } from '@/utils/error-message';
import { maltaPhotoExtension, maltaPhotoUploadError } from '@/utils/malta-photo-file';
import type { Database } from '@/types/database.types';

export type MaltaPhoto = Database['public']['Tables']['malta_photos']['Row'];

export interface MaltaGalleryItem extends MaltaPhoto {
  publicUrl: string;
}

const BUCKET = 'malta-photos';

export const useMaltaPhotosStore = defineStore('maltaPhotos', () => {
  const supabase = useSupabaseClient<Database>();

  const photos = ref<MaltaPhoto[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

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

  const fetchAll = async () => {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from('malta_photos')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      photos.value = data ?? [];
      return { data: photos.value, error: null };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Impossible de charger les photos de Malta');
      error.value = errorMessage;
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  const uploadPhoto = async (file: File, sitterId: string | null) => {
    const validationError = maltaPhotoUploadError(file, sitterId);
    if (validationError) {
      error.value = validationError;
      return { data: null, error: validationError };
    }

    const selectedSitterId = sitterId as string;
    const extension = maltaPhotoExtension(file);
    if (!extension) {
      const errorMessage = 'Envoie une image JPEG, PNG, WebP ou GIF.';
      error.value = errorMessage;
      return { data: null, error: errorMessage };
    }

    loading.value = true;
    error.value = null;
    const storagePath = `${selectedSitterId}/${crypto.randomUUID()}.${extension}`;

    try {
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
        contentType: file.type,
        upsert: false
      });

      if (uploadError) {
        throw uploadError;
      }

      const { data, error: insertError } = await supabase
        .from('malta_photos')
        .insert({ sitter_id: selectedSitterId, storage_path: storagePath })
        .select()
        .single();

      if (insertError) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
        throw insertError;
      }

      photos.value = [data, ...photos.value];
      return { data, error: null };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Impossible d\'envoyer la photo');
      error.value = errorMessage;
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    photos,
    loading,
    error,
    photoCounts,
    galleryItems,
    fetchAll,
    uploadPhoto,
    clearError
  };
});
