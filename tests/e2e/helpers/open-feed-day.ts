import { formatDayLabel, parisToday, sitterNeedDates } from '../../../app/utils/calendar';

function openFeedDates(today = parisToday()): string[] {
  return sitterNeedDates().filter(date => date >= today);
}

/** Next September feeding day that is still editable in Paris time. */
export function nextOpenFeedDate(today = parisToday(), offset = 0): string {
  const open = openFeedDates(today);
  const picked = open[offset];
  if (!picked) {
    throw new Error(`No open feeding day left after ${today} (offset ${offset})`);
  }
  return picked;
}

/** Prefer late-month days so early-month admin fixtures do not collide. */
export function lateOpenFeedDate(today = parisToday(), offsetFromEnd = 0): string {
  const open = openFeedDates(today);
  const picked = open[open.length - 1 - offsetFromEnd];
  if (!picked) {
    throw new Error(`No open feeding day left after ${today} (offsetFromEnd ${offsetFromEnd})`);
  }
  return picked;
}

export function feedDayButtonName(isoDate: string): RegExp {
  return new RegExp(`^${formatDayLabel(isoDate)},`);
}
