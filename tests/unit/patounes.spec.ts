import { describe, expect, it } from 'vitest';
import { isWeekend, sitterNeedDates } from '../../app/utils/calendar';
import {
  coverageMeter,
  formatPatouneDelta,
  patouneLabel,
  PATOUNE_PHOTO,
  PATOUNE_TITLES,
  rankSitters,
  scoreDeltaForToggle,
  scoreSitter,
  streakBonusForDates
} from '../../app/utils/patounes';

describe('patounes', () => {
  it('counts 19 vacation days that need a sitter', () => {
    const dates = sitterNeedDates();
    expect(dates).toHaveLength(19);
    expect(dates[0]).toBe('2026-09-04');
    expect(dates.at(-1)).toBe('2026-09-30');
    expect(isWeekend('2026-09-05')).toBe(true);
    expect(isWeekend('2026-09-04')).toBe(false);
  });

  it('scores a solo Friday as a 20-patoune rescue', () => {
    const score = scoreSitter('a', { '2026-09-04': ['a'] });
    expect(score).toMatchObject({
      days: 1,
      soloDays: 1,
      weekendDays: 0,
      streakBonus: 0,
      total: 20
    });
  });

  it('adds weekend and streak bonuses, and drops the solo bonus when two sitters share a day', () => {
    expect(streakBonusForDates(['2026-09-14', '2026-09-16', '2026-09-15'])).toBe(10);

    const score = scoreSitter('a', {
      '2026-09-04': ['a', 'b'],
      '2026-09-05': ['a']
    });

    expect(score).toMatchObject({
      days: 2,
      soloDays: 1,
      weekendDays: 1,
      streakBonus: 5,
      total: 10 + 10 + 10 + 5 + 5
    });
  });

  it('ranks sitters and hands silly titles to the top five with a score', () => {
    const ranked = rankSitters(
      ['b', 'a', 'c'],
      {
        '2026-09-14': ['a'],
        '2026-09-15': ['a'],
        '2026-09-05': ['b']
      },
      { a: 'Ada', b: 'Bébé', c: 'Coco' }
    );

    expect(ranked[0]?.sitterId).toBe('a');
    expect(ranked[0]?.title).toBe(PATOUNE_TITLES[0]);
    expect(ranked[1]?.sitterId).toBe('b');
    expect(ranked[1]?.title).toBe(PATOUNE_TITLES[1]);
    expect(ranked[2]?.sitterId).toBe('c');
    expect(ranked[2]?.title).toBeNull();
    expect(ranked[2]?.total).toBe(0);
  });

  it('computes the collective bowl meter', () => {
    const meter = coverageMeter({
      '2026-09-04': ['a'],
      '2026-09-05': ['b']
    });

    expect(meter).toMatchObject({
      covered: 2,
      total: 19,
      remaining: 17,
      percent: 11
    });
    expect(patouneLabel(1)).toBe('1 patoune');
    expect(patouneLabel(20)).toBe('20 patounes');
  });

  it('computes the patoune swing when claiming or leaving a day', () => {
    expect(scoreDeltaForToggle('a', '2026-09-04', {}, true)).toBe(20);
    expect(scoreDeltaForToggle('a', '2026-09-04', { '2026-09-04': ['a'] }, false)).toBe(-20);
    expect(formatPatouneDelta(20)).toBe('+20');
    expect(formatPatouneDelta(-20)).toBe('-20');
  });

  it('adds two patounes per Malta photo without changing day math', () => {
    expect(PATOUNE_PHOTO).toBe(2);

    const score = scoreSitter('a', {}, 3);
    expect(score).toMatchObject({
      days: 0,
      photos: 3,
      total: 6
    });

    expect(scoreDeltaForToggle('a', '2026-09-04', {}, true)).toBe(20);
  });

  it('ranks a feeding-day rescue above a single photo', () => {
    const ranked = rankSitters(
      ['photo', 'feeder'],
      { '2026-09-04': ['feeder'] },
      { photo: 'Paparazzi', feeder: 'Nounou' },
      { photo: 1, feeder: 0 }
    );

    expect(ranked[0]?.sitterId).toBe('feeder');
    expect(ranked[0]?.total).toBe(20);
    expect(ranked[1]?.sitterId).toBe('photo');
    expect(ranked[1]?.total).toBe(2);
    expect(ranked[1]?.photos).toBe(1);
  });

  it('adds stored bonus patounes on top of earned points', () => {
    const score = scoreSitter('a', { '2026-09-04': ['a'] }, 1, 5);
    expect(score).toMatchObject({
      days: 1,
      photos: 1,
      bonus: 5,
      total: 20 + 2 + 5
    });

    const ranked = rankSitters(
      ['bonus', 'feeder'],
      { '2026-09-04': ['feeder'] },
      { bonus: 'Bonus', feeder: 'Nounou' },
      { bonus: 0, feeder: 0 },
      { bonus: 21, feeder: 0 }
    );

    expect(ranked[0]?.sitterId).toBe('bonus');
    expect(ranked[0]?.total).toBe(21);
    expect(ranked[1]?.sitterId).toBe('feeder');
    expect(ranked[1]?.total).toBe(20);
  });
});
