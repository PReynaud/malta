export const CALENDAR_YEAR = 2026;
export const CALENDAR_MONTH = 9;

export const DEPARTURE_ISO = '2026-09-14';
export const RETURN_ISO = '2026-10-01';
export const SAD_CAT_ISO = '2026-09-13';
export const HAPPY_CAT_ISO = RETURN_ISO;

export const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;

const FRENCH_MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre'
] as const;

const FRENCH_WEEKDAYS = [
  'dimanche',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi'
] as const;

export const PRESET_COLORS = [
  '#FF1744',
  '#FF3D00',
  '#FF6D00',
  '#FFD600',
  '#76FF03',
  '#00E676',
  '#1DE9B6',
  '#00E5FF',
  '#2979FF',
  '#651FFF',
  '#D500F9',
  '#FF4081'
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
  const name = FRENCH_MONTHS[month - 1] ?? 'mois';
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

export function formatDayLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const weekday = FRENCH_WEEKDAYS[date.getUTCDay()] ?? 'jour';
  const monthName = FRENCH_MONTHS[date.getUTCMonth()] ?? 'mois';
  return `${weekday} ${date.getUTCDate()} ${monthName} ${date.getUTCFullYear()}`;
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

export function buildVacationGrid(): CalendarCell[] {
  const cells = buildMonthGrid(CALENDAR_YEAR, CALENDAR_MONTH);
  const slot = cells.findIndex((cell, index) => !cell.inMonth && cells[index - 1]?.inMonth);

  if (slot !== -1) {
    cells[slot] = {
      isoDate: RETURN_ISO,
      day: 1,
      inMonth: true
    };
  }

  return cells;
}

export function dayEmoji(isoDate: string): string | null {
  if (isoDate === SAD_CAT_ISO) {
    return '😿';
  }

  if (isoDate === HAPPY_CAT_ISO) {
    return '😺';
  }

  return null;
}

export function isOctoberOverflow(isoDate: string): boolean {
  return isoDate === RETURN_ISO;
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

export function needsSitter(isoDate: string): boolean {
  if (!isoDate.startsWith(`${CALENDAR_YEAR}-${pad2(CALENDAR_MONTH)}-`)) {
    return false;
  }

  const day = Number(isoDate.slice(-2));
  return day === 4 || day === 5 || (day >= 14 && day <= 30);
}

export function isUncoveredDate(
  isoDate: string,
  slotsByDate: Record<string, string[]>
): boolean {
  return needsSitter(isoDate) && (slotsByDate[isoDate] ?? []).length === 0;
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
  const readable = formatDayLabel(isoDate);

  if (isoDate === SAD_CAT_ISO) {
    return `${readable}, Malta est tout triste, le maître part demain`;
  }

  if (isoDate === HAPPY_CAT_ISO) {
    return `${readable}, Malta est tout content, le maître rentre`;
  }

  if (!needsSitter(isoDate)) {
    return readable;
  }

  if (sitterNames.length === 0) {
    return `${readable}, personne n'est encore prévu`;
  }

  return `${readable}, nourri par ${sitterNames.join(', ')}`;
}
