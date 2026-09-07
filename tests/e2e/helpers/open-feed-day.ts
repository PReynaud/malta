import { formatDayLabel, parisToday, sitterNeedDates } from '../../../app/utils/calendar';

/** Next September feeding day that is still editable in Paris time. */
export function nextOpenFeedDate(today = parisToday(), offset = 0): string {
  const open = sitterNeedDates().filter(date => date >= today);
  const picked = open[offset];
  if (!picked) {
    throw new Error(`No open feeding day left after ${today} (offset ${offset})`);
  }
  return picked;
}

export function feedDayButtonName(isoDate: string): RegExp {
  return new RegExp(`^${formatDayLabel(isoDate)},`);
}
