import { onMounted, onUnmounted, ref } from 'vue';
import { parisToday } from '@/utils/calendar';

export function useParisToday() {
  const today = ref(parisToday());
  let timer: ReturnType<typeof setInterval> | null = null;

  onMounted(() => {
    today.value = parisToday();
    timer = setInterval(() => {
      today.value = parisToday();
    }, 60_000);
  });

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer);
    }
  });

  return today;
}
