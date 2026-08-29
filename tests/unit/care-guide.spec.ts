import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CARE_SECTIONS, groupCareBlocks, type CareBlock } from '../../app/data/care-guide';

const imageBlocks = (sectionId: string): Extract<CareBlock, { type: 'image' }>[] => {
  const section = CARE_SECTIONS.find(entry => entry.id === sectionId);
  return (section?.blocks ?? []).filter(block => block.type === 'image');
};

describe('care guide', () => {
  it('covers every care topic with real copy and a photo slot', () => {
    expect(CARE_SECTIONS.map(section => section.id)).toEqual([
      'identify',
      'food',
      'water',
      'litter',
      'pets',
      'toys',
      'mess',
      'emergency'
    ]);

    const byId = Object.fromEntries(CARE_SECTIONS.map(section => [section.id, section]));

    expect(byId.identify?.blocks.some(block => block.type === 'p' && block.text.includes('blanc et gris'))).toBe(true);
    expect(byId.identify?.blocks.some(block => block.type === 'p' && block.text.includes('Appelez la police'))).toBe(true);

    expect(byId.food?.blocks.some(block => block.type === 'p' && block.text.includes('distributeur dans le couloir'))).toBe(true);
    expect(byId.food?.blocks.some(block => block.type === 'p' && block.text.includes('pâtée'))).toBe(true);
    expect(byId.food?.blocks.some(block => block.type === 'image' && block.alt.includes('Hill\'s Science Plan'))).toBe(true);
    expect(byId.water?.blocks.some(block => block.type === 'p' && block.text.includes('ultraaaa'))).toBe(true);
    expect(byId.water?.blocks.some(block => block.type === 'p' && block.text.includes('gamelles à remplir'))).toBe(true);
    expect(byId.litter?.blocks.some(block => block.type === 'p' && block.text.includes('vide-ordures'))).toBe(true);
    expect(byId.pets?.blocks.some(block => block.type === 'p' && block.text.includes('barbe'))).toBe(true);
    expect(byId.toys?.blocks.some(block => block.type === 'p' && block.text.includes('bouchon de champagne'))).toBe(true);
    expect(byId.toys?.blocks.some(block => block.type === 'p' && block.text.includes('Catisfactions'))).toBe(true);
    expect(byId.mess?.blocks.some(block => block.type === 'p' && block.text.includes('papier toilette'))).toBe(true);
    expect(byId.emergency?.blocks.some(block =>
      block.type === 'p' && block.text.includes('carnet de santé')
    )).toBe(true);
    expect(byId.emergency?.blocks.some(block =>
      block.type === 'link' && block.href === 'https://maps.app.goo.gl/dJxzphBvdmXNpLaH8'
    )).toBe(true);

    for (const section of CARE_SECTIONS.filter(section => section.id !== 'mess')) {
      expect(section.blocks.some(block => block.type === 'image')).toBe(true);
    }
  });

  it('serves every care photo from public/', () => {
    for (const section of CARE_SECTIONS) {
      for (const block of section.blocks) {
        if (block.type !== 'image' || !block.src) {
          continue;
        }

        expect(existsSync(resolve('public', block.src.replace(/^\//, '')))).toBe(true);
      }
    }
  });

  it('shows kibble and pâté photos in the food section', () => {
    expect(imageBlocks('food')).toEqual([
      {
        type: 'image',
        alt: 'Le distributeur automatique de croquettes de Malta',
        src: '/care/food-feeder.jpg'
      },
      {
        type: 'image',
        alt: 'Le sac de croquettes Hill\'s Science Plan',
        src: '/care/food-kibble-bag.jpg'
      },
      {
        type: 'image',
        alt: 'Malta qui attend sa pâtée',
        src: '/care/food-pate-malta.jpg'
      },
      {
        type: 'image',
        alt: 'La pâtée de Malta dans son assiette',
        src: '/care/food-pate-plate.jpg'
      }
    ]);
  });

  it('groups consecutive food photos into rows', () => {
    const food = CARE_SECTIONS.find(section => section.id === 'food');
    const imageGroups = groupCareBlocks(food?.blocks ?? []).filter(block => block.type === 'images');

    expect(imageGroups).toEqual([
      {
        type: 'images',
        images: [
          {
            type: 'image',
            alt: 'Le distributeur automatique de croquettes de Malta',
            src: '/care/food-feeder.jpg'
          },
          {
            type: 'image',
            alt: 'Le sac de croquettes Hill\'s Science Plan',
            src: '/care/food-kibble-bag.jpg'
          }
        ]
      },
      {
        type: 'images',
        images: [
          {
            type: 'image',
            alt: 'Malta qui attend sa pâtée',
            src: '/care/food-pate-malta.jpg'
          },
          {
            type: 'image',
            alt: 'La pâtée de Malta dans son assiette',
            src: '/care/food-pate-plate.jpg'
          }
        ]
      }
    ]);
  });

  it('shows the automatic fountain and refill bowls in the water section', () => {
    expect(imageBlocks('water')).toEqual([
      {
        type: 'image',
        alt: 'La fontaine à eau automatique de Malta',
        src: '/care/water-fountain.jpg'
      },
      {
        type: 'image',
        alt: 'Une gamelle à remplir de temps en temps',
        src: '/care/water-bowl.jpg'
      }
    ]);
  });

  it('shows the emergency carrier in the urgences section', () => {
    expect(imageBlocks('emergency')).toEqual([
      {
        type: 'image',
        alt: 'Le sac de transport de Malta',
        src: '/care/emergency-carrier.jpg'
      }
    ]);
  });

  it('shows a litter box in the litières section', () => {
    expect(imageBlocks('litter')).toEqual([
      {
        type: 'image',
        alt: 'Une des litières de Malta, avec la pelle sur le couvercle',
        src: '/care/litter-box.jpg'
      }
    ]);
  });

  it('shows Catisfactions treats in the jouets section', () => {
    expect(imageBlocks('toys')).toEqual([
      {
        type: 'image',
        alt: 'Les jouets de Malta',
        src: '/care/toys-collection.jpg'
      },
      {
        type: 'image',
        alt: 'La canne à plumes de Malta',
        src: '/care/toys-feather-wand.jpg'
      },
      {
        type: 'image',
        alt: 'Le sachet de friandises Catisfactions à l\'herbe à chat',
        src: '/care/treats-catisfactions.jpg'
      }
    ]);
  });

  it('shows Malta belly-up in the gratouilles section', () => {
    expect(imageBlocks('pets')).toEqual([
      {
        type: 'image',
        alt: 'Malta ventre en l\'air sur son arbre à chat, prête pour les gratouilles',
        src: '/care/pets-belly.jpg'
      }
    ]);
  });

  it('shows Malta in the identify section', () => {
    expect(imageBlocks('identify')).toEqual([
      {
        type: 'image',
        alt: 'Malta, le chat blanc et gris',
        src: '/care/identify-malta.jpg'
      }
    ]);
  });
});
