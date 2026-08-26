import { ref } from 'vue';

export const PATOUNE_BANNER_KEY = 'malta-patoune-banner';

const visible = ref(true);
let hydrated = false;

function readStoredVisible(): boolean {
  if (!import.meta.client) {
    return true;
  }

  return window.localStorage.getItem(PATOUNE_BANNER_KEY) !== '1';
}

export function usePatouneBanner() {
  if (import.meta.client && !hydrated) {
    visible.value = readStoredVisible();
    hydrated = true;
  }

  const dismiss = () => {
    visible.value = false;
    if (import.meta.client) {
      window.localStorage.setItem(PATOUNE_BANNER_KEY, '1');
    }
  };

  const restore = () => {
    visible.value = true;
    if (import.meta.client) {
      window.localStorage.removeItem(PATOUNE_BANNER_KEY);
    }
  };

  return {
    visible,
    dismiss,
    restore
  };
}
