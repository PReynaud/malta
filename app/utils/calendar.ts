export const CALENDAR_YEAR = 2026;
export const CALENDAR_MONTH = 9;

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const PRESET_COLORS = [
  '#6B7280',
  '#9CA3AF',
  '#E5E7EB',
  '#F5F0E8',
  '#D97736',
  '#E8A87C',
  '#C45C26',
  '#7A8B7A'
] as const;

export interface CalendarCell {
  isoDate: string;
  day: number;
  inMonth: boolean;
}

export interface DateSlot {
  feed_date: string;
  sitter_id: string;
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function monthTitle(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const mondayIndex = (first.getUTCDay() + 6) % 7;
  const cells: CalendarCell[] = [];

  for (let index = 0; index < mondayIndex; index += 1) {
    cells.push({ isoDate: '', day: 0, inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      isoDate: toIsoDate(year, month, day),
      day,
      inMonth: true
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ isoDate: '', day: 0, inMonth: false });
  }

  return cells;
}

export function groupSlotsByDate(slots: DateSlot[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const slot of slots) {
    const current = grouped[slot.feed_date] ?? [];
    current.push(slot.sitter_id);
    grouped[slot.feed_date] = current;
  }

  return grouped;
}

export function isUncoveredDate(
  isoDate: string,
  slotsByDate: Record<string, string[]>
): boolean {
  return (slotsByDate[isoDate] ?? []).length === 0;
}

export function isLightHex(color: string): boolean {
  const hex = color.replace('#', '');
  if (hex.length !== 6) {
    return false;
  }

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  return (red * 299 + green * 587 + blue * 114) / 1000 > 160;
}

export function dayAriaLabel(
  isoDate: string,
  sitterNames: string[]
): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const readable = date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  });

  if (sitterNames.length === 0) {
    return `${readable}, nobody signed up yet`;
  }

  return `${readable}, ${sitterNames.join(', ')} feeding Malta`;
}
