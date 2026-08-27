export type CareBlock
  = { type: 'p'; text: string }
    | { type: 'image'; alt: string; src?: string }
    | { type: 'link'; href: string; label: string };

export interface CareSection {
  id: string;
  title: string;
  emoji: string;
  blocks: CareBlock[];
}

export const CARE_SECTIONS: CareSection[] = [
  {
    id: 'food',
    title: 'Nourriture',
    emoji: '🍽️',
    blocks: [
      {
        type: 'p',
        text: 'Le point le plus important pour Malta ! Les croquettes sont distribuées automatiquement par le distributeur dans le couloir. Il faut vérifier qu\'il reste bien quelques croquettes au fond. C\'est un équilibre compliqué : ni trop, ni trop peu. Si le niveau du distributeur baisse trop, c\'est facile : le paquet de croquettes est juste à côté.'
      },
      {
        type: 'image',
        alt: 'Le distributeur automatique de croquettes de Malta',
        src: '/care/food-feeder.jpg'
      },
      {
        type: 'p',
        text: 'Si le sac est vide, on rachète uniquement celui-là : Hill\'s Science Plan.'
      },
      {
        type: 'image',
        alt: 'Le sac de croquettes Hill\'s Science Plan',
        src: '/care/food-kibble-bag.jpg'
      },
      {
        type: 'p',
        text: 'Et maintenant la pâtée : le plaisir ultime de Malta. Rien n\'a de sens sans la pâtée. Chaque jour, on lui accorde donc la moitié d\'un sachet. La moitié non utilisée va au frigo pour le lendemain.'
      },
      {
        type: 'p',
        text: 'Attention : mademoiselle est compliquée et n\'accepte que cette pâtée-ci. S\'il faut en racheter, c\'est uniquement celle-là, pas une autre. Si jamais elle ne la mange pas, il faudra jeter le reste à la poubelle. Dans ce cas, au bout de 2 ou 3 jours, on jette la poubelle pour éviter les vers. Le nécessaire pour changer est dans la cuisine.'
      },
      {
        type: 'image',
        alt: 'La pâtée de Malta'
      }
    ]
  },
  {
    id: 'water',
    title: 'Eau',
    emoji: '💧',
    blocks: [
      {
        type: 'p',
        text: 'C\'est automatique ! Mais attention : au bout de 10 jours, il faudra remettre un peu d\'eau. Le mécanisme est ultraaaa sensible, mieux vaut récupérer un verre et remplir tout doucement.'
      },
      {
        type: 'image',
        alt: 'La fontaine à eau automatique de Malta',
        src: '/care/water-fountain.jpg'
      },
      {
        type: 'p',
        text: 'Si jamais la fontaine ne fonctionne plus, il faut la nettoyer un peu. Pour la remettre en marche, les connecteurs doivent être très secs… et il faut souvent s\'y reprendre à plusieurs fois. Appelez-moi si besoin.'
      },
      {
        type: 'p',
        text: 'Il y a aussi des gamelles à remplir de temps en temps, comme celle-ci, en plus de la fontaine automatique.'
      },
      {
        type: 'image',
        alt: 'Une gamelle à remplir de temps en temps',
        src: '/care/water-bowl.jpg'
      }
    ]
  },
  {
    id: 'litter',
    title: 'Litières',
    emoji: '🧹',
    blocks: [
      {
        type: 'p',
        text: 'Toutes les semaines, il serait bien de nettoyer un peu les litières 💩. C\'est facile : un petit sac plastique blanc, la pelle, et on ramasse. Une fois les 3 litières nettoyées, le sac peut être jeté.'
      },
      {
        type: 'p',
        text: 'Il y a un vide-ordures sur le palier, pas besoin de descendre. En face de l\'appart, c\'est la porte à gauche (en face des portes des deux autres voisins).'
      },
      {
        type: 'image',
        alt: 'Les litières de Malta'
      }
    ]
  },
  {
    id: 'pets',
    title: 'Gratouilles',
    emoji: '🫶',
    blocks: [
      {
        type: 'p',
        text: 'À fond ! Si vous êtes chanceux, le ventre sera vite exposé : c\'est sa zone préférée. Pour les personnes à barbe, elle adore s\'y frotter. Si vous n\'avez pas de barbe, faites un effort et laissez pousser.'
      },
      {
        type: 'p',
        text: 'Vous pouvez aussi utiliser la brosse de temps en temps pour la dépoiler : elle aime bien, mais il faut y aller doucement.'
      },
      {
        type: 'image',
        alt: 'Malta en mode gratouilles'
      }
    ]
  },
  {
    id: 'toys',
    title: 'Jouets',
    emoji: '🧸',
    blocks: [
      {
        type: 'p',
        text: 'Une bonne session de jeu, c\'est l\'idéal pour oublier la solitude : boulettes, ficelles, bouchon de champagne, balles… Si possible autour du canapé, ou dans toutes les petites boîtes disséminées dans l\'appart.'
      },
      {
        type: 'p',
        text: 'Si elle a la flemme, il faut insister un peu — mais pas trop : ce n\'est peut-être juste pas son moment.'
      },
      {
        type: 'image',
        alt: 'Les jouets de Malta'
      }
    ]
  },
  {
    id: 'mess',
    title: 'Saletés',
    emoji: '🧻',
    blocks: [
      {
        type: 'p',
        text: 'Il n\'est pas rare qu\'un chat vomisse. Tant que c\'est de temps en temps, ce n\'est pas trop grave. Pour ramasser : papier toilette, on en prend le plus possible, et on tire la chasse.'
      },
      {
        type: 'p',
        text: 'Pour finir de nettoyer, il y a des chiffons près de l\'évier de la cuisine, et de la javel en dessous.'
      },
      {
        type: 'image',
        alt: 'Le coin nettoyage'
      }
    ]
  },
  {
    id: 'emergency',
    title: 'Urgences',
    emoji: '🚨',
    blocks: [
      {
        type: 'p',
        text: 'Espérons ne pas en arriver là 😱. Au cas où, il faut surveiller les vomissements, les pertes de poils ou de poids. Si jamais ça devient inquiétant, contactez-moi au plus vite et on verra ce qu\'on fait.'
      },
      {
        type: 'p',
        text: 'Si besoin, le sac de transport est dans l\'entrée, avec son carnet de santé dedans. L\'adresse de son vétérinaire habituel :'
      },
      {
        type: 'link',
        href: 'https://maps.app.goo.gl/dJxzphBvdmXNpLaH8',
        label: 'Vétérinaire de Malta (Google Maps)'
      },
      {
        type: 'image',
        alt: 'Le sac de transport de Malta'
      }
    ]
  }
];
