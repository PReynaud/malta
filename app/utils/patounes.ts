import {
  isWeekend,
  sitterNeedDates
} from '@/utils/calendar';

export const PATOUNE_BASE = 10;
export const PATOUNE_SOLO = 10;
export const PATOUNE_WEEKEND = 5;
export const PATOUNE_STREAK = 5;

export const PATOUNE_TITLES = [
  'Ministre des croquettes',
  'Garde du tigre',
  'Ouvre-boîte officiel',
  'Lieutenant Patoune',
  'Chaton stagiaire'
] as const;

export interface PatouneScore {
  sitterId: string;
  days: number;
  soloDays: number;
  weekendDays: number;
  streakBonus: number;
  total: number;
}

export interface RankedPatoune extends PatouneScore {
  rank: number;
  title: string | null;
}

export interface CoverageMeter {
  covered: number;
  total: number;
  percent: number;
  remaining: number;
}

function nextIsoDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function streakBonusForDates(isoDates: string[]): number {
  if (isoDates.length === 0) {
    return 0;
  }

  const unique = [...new Set(isoDates)].sort();
  let bonus = 0;

  for (let index = 1; index < unique.length; index += 1) {
    const previous = unique[index - 1];
    const current = unique[index];
    if (previous && current && nextIsoDate(previous) === current) {
      bonus += PATOUNE_STREAK;
    }
  }

  return bonus;
}

export function scoreSitter(
  sitterId: string,
  slotsByDate: Record<string, string[]>
): PatouneScore {
  const days: string[] = [];
  let soloDays = 0;
  let weekendDays = 0;

  for (const isoDate of sitterNeedDates()) {
    const sitters = slotsByDate[isoDate] ?? [];
    if (!sitters.includes(sitterId)) {
      continue;
    }

    days.push(isoDate);

    if (sitters.length === 1) {
      soloDays += 1;
    }

    if (isWeekend(isoDate)) {
      weekendDays += 1;
    }
  }

  const streakBonus = streakBonusForDates(days);
  const total
    = days.length * PATOUNE_BASE
      + soloDays * PATOUNE_SOLO
      + weekendDays * PATOUNE_WEEKEND
      + streakBonus;

  return {
    sitterId,
    days: days.length,
    soloDays,
    weekendDays,
    streakBonus,
    total
  };
}

export function rankSitters(
  sitterIds: string[],
  slotsByDate: Record<string, string[]>,
  namesById: Record<string, string> = {}
): RankedPatoune[] {
  const scored = sitterIds.map(id => scoreSitter(id, slotsByDate));

  scored.sort((left, right) => {
    if (right.total !== left.total) {
      return right.total - left.total;
    }

    const leftName = namesById[left.sitterId] ?? left.sitterId;
    const rightName = namesById[right.sitterId] ?? right.sitterId;
    return leftName.localeCompare(rightName, 'fr');
  });

  return scored.map((score, index) => {
    const titled = score.total > 0 && index < PATOUNE_TITLES.length;
    return {
      ...score,
      rank: index + 1,
      title: titled ? PATOUNE_TITLES[index] ?? null : null
    };
  });
}

export function coverageMeter(slotsByDate: Record<string, string[]>): CoverageMeter {
  const dates = sitterNeedDates();
  const covered = dates.filter(isoDate => (slotsByDate[isoDate] ?? []).length > 0).length;

  return {
    covered,
    total: dates.length,
    percent: dates.length === 0 ? 0 : Math.round((covered / dates.length) * 100),
    remaining: dates.length - covered
  };
}

export function patouneLabel(count: number): string {
  return count === 1 ? '1 patoune' : `${count} patounes`;
}

export function formatPatouneDelta(delta: number): string {
  if (delta > 0) {
    return `+${delta}`;
  }

  return String(delta);
}

export function scoreDeltaForToggle(
  sitterId: string,
  isoDate: string,
  slotsByDate: Record<string, string[]>,
  adding: boolean
): number {
  const before = scoreSitter(sitterId, slotsByDate).total;
  const next: Record<string, string[]> = { ...slotsByDate };
  const current = [...(next[isoDate] ?? [])];

  next[isoDate] = adding
    ? (current.includes(sitterId) ? current : [...current, sitterId])
    : current.filter(id => id !== sitterId);

  return scoreSitter(sitterId, next).total - before;
}
