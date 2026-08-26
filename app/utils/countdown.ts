export const DEPARTURE_AT_MS = Date.parse('2026-09-14T00:00:00+02:00');
export const RETURN_AT_MS = Date.parse('2026-10-01T00:00:00+02:00');

export interface RemainingTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

export function remainingTime(targetMs: number, nowMs: number): RemainingTime {
  const diff = Math.max(0, targetMs - nowMs);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    done: diff === 0
  };
}
