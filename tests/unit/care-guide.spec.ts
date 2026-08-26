import { describe, expect, it } from 'vitest';
import { CARE_SECTIONS } from '../../app/data/care-guide';

describe('care guide', () => {
  it('covers every care topic with real copy and a photo slot', () => {
    expect(CARE_SECTIONS.map(section => section.id)).toEqual([
      'food',
      'water',
      'litter',
      'pets',
      'toys',
      'mess',
      'emergency'
    ]);

    const byId = Object.fromEntries(CARE_SECTIONS.map(section => [section.id, section]));

    expect(byId.food?.blocks.some(block => block.type === 'p' && block.text.includes('distributeur dans le couloir'))).toBe(true);
    expect(byId.food?.blocks.some(block => block.type === 'p' && block.text.includes('pâtée'))).toBe(true);
    expect(byId.water?.blocks.some(block => block.type === 'p' && block.text.includes('ultraaaa'))).toBe(true);
    expect(byId.litter?.blocks.some(block => block.type === 'p' && block.text.includes('vide-ordures'))).toBe(true);
    expect(byId.pets?.blocks.some(block => block.type === 'p' && block.text.includes('barbe'))).toBe(true);
    expect(byId.toys?.blocks.some(block => block.type === 'p' && block.text.includes('bouchon de champagne'))).toBe(true);
    expect(byId.mess?.blocks.some(block => block.type === 'p' && block.text.includes('papier toilette'))).toBe(true);
    expect(byId.emergency?.blocks.some(block =>
      block.type === 'link' && block.href === 'https://maps.app.goo.gl/dJxzphBvdmXNpLaH8'
    )).toBe(true);

    for (const section of CARE_SECTIONS) {
      expect(section.blocks.some(block => block.type === 'image')).toBe(true);
    }
  });
});
