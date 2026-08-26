export interface CareSection {
  id: string;
  title: string;
  emoji: string;
  placeholder: string;
  body: string;
  imageSrc: string | null;
  imageAlt: string;
}

export const CARE_SECTIONS: CareSection[] = [
  {
    id: 'food',
    title: 'Nourriture',
    emoji: '🍽️',
    placeholder: 'Où sont les croquettes, quelle quantité, à quelle heure… À remplir.',
    body: '',
    imageSrc: null,
    imageAlt: 'Nourriture de Malta'
  },
  {
    id: 'water',
    title: 'Eau',
    emoji: '💧',
    placeholder: 'Gamelle, fontaine, refill… À remplir.',
    body: '',
    imageSrc: null,
    imageAlt: 'Eau de Malta'
  },
  {
    id: 'litter',
    title: 'Litières',
    emoji: '🧹',
    placeholder: 'Où sont les bacs, comment les vider, où jeter… À remplir.',
    body: '',
    imageSrc: null,
    imageAlt: 'Litières de Malta'
  },
  {
    id: 'pets',
    title: 'Gratouilles',
    emoji: '🫶',
    placeholder: 'Les coins préférés, le rythme, ce qu\'il n\'aime pas… À remplir.',
    body: '',
    imageSrc: null,
    imageAlt: 'Gratouilles de Malta'
  },
  {
    id: 'toys',
    title: 'Jouets',
    emoji: '🧸',
    placeholder: 'Souris, canne à pêche, règles du jeu… À remplir.',
    body: '',
    imageSrc: null,
    imageAlt: 'Jouets de Malta'
  },
  {
    id: 'emergency',
    title: 'Urgences',
    emoji: '🚨',
    placeholder: 'Véto, voisins, numéros, que faire si… À remplir.',
    body: '',
    imageSrc: null,
    imageAlt: 'Urgences pour Malta'
  }
];
