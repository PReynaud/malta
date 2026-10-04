export const CONTEST_CATEGORIES = [
  {
    id: 'cutest',
    label: 'La plus mignonne',
    shortLabel: 'Mignonne',
    mark: '🥰'
  },
  {
    id: 'funniest',
    label: 'La plus marrante',
    shortLabel: 'Marrante',
    mark: '😂'
  },
  {
    id: 'lamest',
    label: 'La plus nulle',
    shortLabel: 'Nulle',
    mark: '🙃'
  }
] as const;

export type ContestCategory = (typeof CONTEST_CATEGORIES)[number]['id'];

export interface ContestVote {
  id: string;
  voter_sitter_id: string;
  photo_id: string;
  category: ContestCategory;
}

export interface ContestPhotoRef {
  id: string;
  sitterId: string;
}

export interface ContestTallyRow {
  photoId: string;
  author: string;
  count: number;
}

export type ContestTally = Record<ContestCategory, ContestTallyRow[]>;

export type VoteMutation
  = { type: 'insert'; voterSitterId: string; photoId: string; category: ContestCategory }
    | { type: 'move'; voteId: string; photoId: string }
    | { type: 'retract'; voteId: string };

const CATEGORY_IDS: ContestCategory[] = CONTEST_CATEGORIES.map(category => category.id);

export function isContestCategory(value: string): value is ContestCategory {
  return CATEGORY_IDS.includes(value as ContestCategory);
}

export function contestCategory(id: ContestCategory) {
  const category = CONTEST_CATEGORIES.find(item => item.id === id);
  if (!category) {
    throw new Error(`Unknown contest category: ${id}`);
  }

  return category;
}

export function voteCountLabel(count: number): string {
  return count === 1 ? '1 vote' : `${count} votes`;
}

export function voteMutation(
  votes: ContestVote[],
  voterSitterId: string,
  photoId: string,
  category: ContestCategory
): VoteMutation {
  const existing = votes.find(vote =>
    vote.voter_sitter_id === voterSitterId && vote.category === category
  );

  if (!existing) {
    return {
      type: 'insert',
      voterSitterId,
      photoId,
      category
    };
  }

  if (existing.photo_id === photoId) {
    return {
      type: 'retract',
      voteId: existing.id
    };
  }

  return {
    type: 'move',
    voteId: existing.id,
    photoId
  };
}

export function categoryCount(
  votes: ContestVote[],
  photoId: string,
  category: ContestCategory
): number {
  return votes.filter(vote => vote.photo_id === photoId && vote.category === category).length;
}

export function voterPhotoIdForCategory(
  votes: ContestVote[],
  voterSitterId: string,
  category: ContestCategory
): string | null {
  return votes.find(vote =>
    vote.voter_sitter_id === voterSitterId && vote.category === category
  )?.photo_id ?? null;
}

export function voterCategoriesForPhoto(
  votes: ContestVote[],
  voterSitterId: string,
  photoId: string
): ContestCategory[] {
  return CATEGORY_IDS.filter(category =>
    votes.some(vote =>
      vote.voter_sitter_id === voterSitterId
      && vote.photo_id === photoId
      && vote.category === category
    )
  );
}

export function contestTally(
  votes: ContestVote[],
  photos: ContestPhotoRef[],
  namesBySitterId: Record<string, string>
): ContestTally {
  const tally = {
    cutest: [],
    funniest: [],
    lamest: []
  } as ContestTally;

  for (const category of CATEGORY_IDS) {
    const counts = new Map<string, number>();

    for (const vote of votes) {
      if (vote.category !== category) {
        continue;
      }

      counts.set(vote.photo_id, (counts.get(vote.photo_id) ?? 0) + 1);
    }

    const rows: ContestTallyRow[] = [];

    for (const [photoId, count] of counts) {
      const photo = photos.find(item => item.id === photoId);
      const author = photo
        ? namesBySitterId[photo.sitterId] ?? 'Inconnu'
        : 'Photo retirée';

      rows.push({ photoId, author, count });
    }

    rows.sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.author.localeCompare(right.author, 'fr');
    });

    tally[category] = rows;
  }

  return tally;
}
