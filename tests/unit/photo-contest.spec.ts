import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  categoryCount,
  contestTally,
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
    expect(migration).not.toMatch(/bonus_patounes|malus_patounes/);
    expect(store).not.toMatch(/bonus_patounes|malus_patounes/);
    expect(page).toMatch(/Concours photo/);
    expect(page).not.toMatch(/MonthCalendar|TripCountdowns|CareGuide|PatouneBanner|uploadPhoto/);
  });
});
