import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  categoryCount,
  contestTally,
  photoVoteMarks,
  voteCountLabel,
  voteMutation,
  voterCategoriesForPhoto,
  type ContestVote
} from '../../app/utils/photo-contest';

const votes: ContestVote[] = [
  { id: 'v1', voter_sitter_id: 'sitter-a', photo_id: 'photo-1', category: 'cutest' },
  { id: 'v2', voter_sitter_id: 'sitter-b', photo_id: 'photo-1', category: 'cutest' },
  { id: 'v3', voter_sitter_id: 'sitter-a', photo_id: 'photo-2', category: 'lamest' }
];

describe('photo contest votes', () => {
  it('inserts, moves, and retracts one vote per sitter and category', () => {
    expect(voteMutation(votes, 'sitter-c', 'photo-2', 'funniest')).toEqual({
      type: 'insert',
      voterSitterId: 'sitter-c',
      photoId: 'photo-2',
      category: 'funniest'
    });

    expect(voteMutation(votes, 'sitter-a', 'photo-2', 'cutest')).toEqual({
      type: 'move',
      voteId: 'v1',
      photoId: 'photo-2'
    });

    expect(voteMutation(votes, 'sitter-a', 'photo-1', 'cutest')).toEqual({
      type: 'retract',
      voteId: 'v1'
    });
  });

  it('lets a sitter vote for their own photo by not looking at authorship', () => {
    expect(voteMutation([], 'author', 'own-photo', 'cutest').type).toBe('insert');
  });

  it('counts a category on one photo and lists the voter marks', () => {
    expect(categoryCount(votes, 'photo-1', 'cutest')).toBe(2);
    expect(categoryCount(votes, 'photo-1', 'lamest')).toBe(0);
    expect(voteCountLabel(1)).toBe('1 vote');
    expect(voteCountLabel(2)).toBe('2 votes');
    expect(voterCategoriesForPhoto(votes, 'sitter-a', 'photo-1')).toEqual(['cutest']);
    expect(voterCategoriesForPhoto(votes, 'sitter-a', 'photo-2')).toEqual(['lamest']);
  });

  it('tallies authors per category without inventing empty rows', () => {
    const tally = contestTally(
      votes,
      [
        { id: 'photo-1', sitterId: 'author-1' },
        { id: 'photo-2', sitterId: 'author-2' }
      ],
      { 'author-1': 'Camille', 'author-2': 'Alex' }
    );

    expect(tally.cutest).toEqual([{ photoId: 'photo-1', author: 'Camille', count: 2 }]);
    expect(tally.funniest).toEqual([]);
    expect(tally.lamest).toEqual([{ photoId: 'photo-2', author: 'Alex', count: 1 }]);
  });

  it('lists vote marks in category order and skips zeroes', () => {
    const mixed: ContestVote[] = [
      { id: 'm1', voter_sitter_id: 'sitter-b', photo_id: 'photo-1', category: 'funniest' },
      { id: 'm2', voter_sitter_id: 'sitter-a', photo_id: 'photo-1', category: 'cutest' },
      { id: 'm3', voter_sitter_id: 'sitter-c', photo_id: 'photo-1', category: 'cutest' },
      { id: 'm4', voter_sitter_id: 'sitter-a', photo_id: 'photo-2', category: 'lamest' }
    ];

    expect(photoVoteMarks(mixed, 'photo-1')).toEqual([
      { category: 'cutest', count: 2 },
      { category: 'funniest', count: 1 }
    ]);
    expect(photoVoteMarks(mixed, 'photo-2')).toEqual([
      { category: 'lamest', count: 1 }
    ]);
    expect(photoVoteMarks(mixed, 'photo-3')).toEqual([]);
    expect(photoVoteMarks([], 'photo-1')).toEqual([]);
  });

  it('shows a voted photo in each of its categories and omits a photo with zero votes', () => {
    const mixed: ContestVote[] = [
      { id: 'm1', voter_sitter_id: 'sitter-b', photo_id: 'photo-1', category: 'funniest' },
      { id: 'm2', voter_sitter_id: 'sitter-a', photo_id: 'photo-1', category: 'cutest' },
      { id: 'm3', voter_sitter_id: 'sitter-c', photo_id: 'photo-1', category: 'cutest' }
    ];
    const tally = contestTally(
      mixed,
      [
        { id: 'photo-1', sitterId: 'author-1' },
        { id: 'photo-2', sitterId: 'author-1' }
      ],
      { 'author-1': 'Camille' }
    );

    expect(tally.cutest).toEqual([{ photoId: 'photo-1', author: 'Camille', count: 2 }]);
    expect(tally.funniest).toEqual([{ photoId: 'photo-1', author: 'Camille', count: 1 }]);
    expect(tally.lamest).toEqual([]);
    expect(tally.cutest.some(row => row.photoId === 'photo-2')).toBe(false);
    expect(tally.funniest.some(row => row.photoId === 'photo-2')).toBe(false);
    expect(tally.lamest.some(row => row.photoId === 'photo-2')).toBe(false);
    expect(photoVoteMarks(mixed, 'photo-2')).toEqual([]);
  });

  it('keeps Photo retirée and the count when votes point at a missing photo', () => {
    const tally = contestTally(
      [{ id: 'gone-1', voter_sitter_id: 'sitter-a', photo_id: 'gone', category: 'cutest' }],
      [],
      {}
    );

    expect(tally.cutest).toEqual([{ photoId: 'gone', author: 'Photo retirée', count: 1 }]);
    expect(tally.funniest).toEqual([]);
    expect(tally.lamest).toEqual([]);
  });

  it('keeps contest votes from writing patounes and drops public photo upload', () => {
    const migration = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/20261003180000_photo_contest.sql'),
      'utf8'
    );
    const store = readFileSync(resolve(process.cwd(), 'app/stores/photo-contest.ts'), 'utf8');
    const page = readFileSync(resolve(process.cwd(), 'app/pages/index.vue'), 'utf8');

    expect(migration).toMatch(/photo_contest_votes_voter_category_unique/);
    expect(migration).toMatch(/enable row level security/);
    expect(migration).toMatch(/drop policy "Anyone can insert malta photos"/);
    expect(migration).toMatch(/grant select on table public\.sitters to service_role/);
    expect(migration).toMatch(/grant select, update on table public\.photo_contest to service_role/);
    expect(migration).not.toMatch(/bonus_patounes|malus_patounes/);
    expect(store).not.toMatch(/bonus_patounes|malus_patounes/);
    expect(page).toMatch(/Concours photo/);
    expect(page).not.toMatch(/MonthCalendar|TripCountdowns|CareGuide|PatouneBanner|uploadPhoto/);
  });
});
