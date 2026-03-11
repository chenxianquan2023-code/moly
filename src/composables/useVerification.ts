import { ref, onUnmounted } from 'vue';

const DEFAULT_COOLDOWN = 60;

export function useVerification(cooldownSeconds = DEFAULT_COOLDOWN) {
  const countdown = ref(0);
  let timer: ReturnType<typeof setInterval> | null = null;

  function start() {
    if (countdown.value > 0) return;
    countdown.value = cooldownSeconds;
    timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    }, 1000);
  }

  function reset() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    countdown.value = 0;
  }

  onUnmounted(() => reset());

  return { countdown, start, reset };
}
