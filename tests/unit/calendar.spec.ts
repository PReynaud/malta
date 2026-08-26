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
  needsSitter,
  toIsoDate
} from '../../app/utils/calendar';

describe('calendar', () => {
  it('builds a Monday-first September 2026 grid', () => {
    const cells = buildMonthGrid(CALENDAR_YEAR, CALENDAR_MONTH);
    const inMonth = cells.filter(cell => cell.inMonth);

    expect(monthTitle(CALENDAR_YEAR, CALENDAR_MONTH)).toBe('Septembre 2026');
    expect(inMonth).toHaveLength(30);
    expect(cells).toHaveLength(35);
    expect(cells[0]).toMatchObject({ inMonth: false, day: 0 });
    expect(cells[1]).toMatchObject({ inMonth: true, day: 1, isoDate: '2026-09-01' });
    expect(inMonth.at(-1)).toMatchObject({ day: 30, isoDate: '2026-09-30' });
  });

  it('marks only vacation days as needing a sitter', () => {
    expect(needsSitter('2026-09-04')).toBe(true);
    expect(needsSitter('2026-09-05')).toBe(true);
    expect(needsSitter('2026-09-14')).toBe(true);
    expect(needsSitter('2026-09-30')).toBe(true);
    expect(needsSitter('2026-09-01')).toBe(false);
    expect(needsSitter('2026-09-03')).toBe(false);
    expect(needsSitter('2026-09-06')).toBe(false);
    expect(needsSitter('2026-09-13')).toBe(false);
  });

  it('groups slots and flags uncovered vacation days', () => {
    const slotsByDate = groupSlotsByDate([
      { feed_date: '2026-09-04', sitter_id: 'a' },
      { feed_date: '2026-09-04', sitter_id: 'b' }
    ]);

    expect(slotsByDate['2026-09-04']).toEqual(['a', 'b']);
    expect(isUncoveredDate('2026-09-04', slotsByDate)).toBe(false);
    expect(isUncoveredDate('2026-09-05', slotsByDate)).toBe(true);
    expect(isUncoveredDate('2026-09-01', slotsByDate)).toBe(false);
  });

  it('picks readable contrast for pale sitter colors', () => {
    expect(isLightHex('#FFD600')).toBe(true);
    expect(isLightHex('#2979FF')).toBe(false);
  });

  it('describes a day for screen readers in French', () => {
    expect(dayAriaLabel(toIsoDate(2026, 9, 2), [])).toBe(
      'mercredi 2 septembre 2026, le maître est un bon maître'
    );
    expect(dayAriaLabel('2026-09-04', [])).toBe(
      'vendredi 4 septembre 2026, personne n\'est encore prévu'
    );
    expect(dayAriaLabel('2026-09-04', ['Pierre'])).toBe(
      'vendredi 4 septembre 2026, nourri par Pierre'
    );
  });
});
