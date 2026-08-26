import { describe, expect, it } from 'vitest';
import {
  buildMonthGrid,
  CALENDAR_MONTH,
  CALENDAR_YEAR,
  dayAriaLabel,
  groupSlotsByDate,
  isLightHex,
  isUncoveredDate,
  monthTitle,
  toIsoDate
} from '../../app/utils/calendar';

describe('calendar', () => {
  it('builds a Monday-first September 2026 grid', () => {
    const cells = buildMonthGrid(CALENDAR_YEAR, CALENDAR_MONTH);
    const inMonth = cells.filter(cell => cell.inMonth);

    expect(monthTitle(CALENDAR_YEAR, CALENDAR_MONTH)).toBe('September 2026');
    expect(inMonth).toHaveLength(30);
    expect(cells).toHaveLength(35);
    expect(cells[0]).toMatchObject({ inMonth: false, day: 0 });
    expect(cells[1]).toMatchObject({ inMonth: true, day: 1, isoDate: '2026-09-01' });
    expect(inMonth.at(-1)).toMatchObject({ day: 30, isoDate: '2026-09-30' });
  });

  it('groups slots and flags uncovered days', () => {
    const slotsByDate = groupSlotsByDate([
      { feed_date: '2026-09-01', sitter_id: 'a' },
      { feed_date: '2026-09-01', sitter_id: 'b' }
    ]);

    expect(slotsByDate['2026-09-01']).toEqual(['a', 'b']);
    expect(isUncoveredDate('2026-09-01', slotsByDate)).toBe(false);
    expect(isUncoveredDate('2026-09-02', slotsByDate)).toBe(true);
  });

  it('picks readable contrast for pale sitter colors', () => {
    expect(isLightHex('#F5F0E8')).toBe(true);
    expect(isLightHex('#6B7280')).toBe(false);
  });

  it('describes a day for screen readers', () => {
    expect(dayAriaLabel(toIsoDate(2026, 9, 2), [])).toBe(
      '2 September 2026, nobody signed up yet'
    );
    expect(dayAriaLabel('2026-09-02', ['Pierre'])).toBe(
      '2 September 2026, Pierre feeding Malta'
    );
  });
});
