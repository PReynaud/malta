import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('MaltaPhotoGallery lightbox wiring', () => {
  const component = readFileSync(
    resolve(process.cwd(), 'app/components/MaltaPhotoGallery.vue'),
    'utf8'
  );
  const css = readFileSync(resolve(process.cwd(), 'app/assets/css/main.css'), 'utf8');
  const photoStore = readFileSync(resolve(process.cwd(), 'app/stores/malta-photos.ts'), 'utf8');
  const adminStore = readFileSync(resolve(process.cwd(), 'app/stores/admin.ts'), 'utf8');

  it('uses index-based lightbox state with wrap navigation and metadata caption', () => {
    expect(component).toMatch(/selectedIndex/);
    expect(component).toMatch(/selectedPhotoId/);
    expect(component).toMatch(/adjacentPhotoIndex/);
    expect(component).toMatch(/formatMaltaPhotoPublishedAt/);
    expect(component).toMatch(/swipeNavigationDelta/);
    expect(component).toMatch(/malta-photo-lightbox-author/);
    expect(component).toMatch(/malta-photo-lightbox-published/);
    expect(component).toMatch(/malta-photo-lightbox-prev/);
    expect(component).toMatch(/malta-photo-lightbox-next/);
    expect(component).toMatch(/ArrowLeft/);
    expect(component).toMatch(/ArrowRight/);
    expect(component).toMatch(/Par un sitter inconnu/);
    expect(component).toMatch(/suppressLightboxClick/);
    expect(component).toMatch(/touchcancel/);
    expect(component).toMatch(/malta-photo-grid/);
    expect(component).toMatch(/contest-vote-\$\{category\.id\}/);
    expect(component).toMatch(/category\.id === 'lamest'/);
    expect(component).not.toMatch(/type="file"/);
    expect(component).not.toMatch(/malta-photo-input/);
  });

  it('uses static same-origin URLs without runtime Storage mutations', () => {
    expect(photoStore).toMatch(/maltaPhotoStaticUrl\(photo\.storage_path\)/);
    expect(adminStore).toMatch(/maltaPhotoStaticUrl\(photo\.storage_path\)/);
    expect(photoStore).not.toMatch(/storage\.from|uploadPhoto|uploading/);
    expect(adminStore).not.toMatch(/storage\.from/);
  });

  it('disables marquee animation for mobile scroll-snap strip', () => {
    expect(css).toMatch(/scroll-snap-type:\s*x mandatory/);
    expect(css).toMatch(/@media \(max-width: 639px\), \(pointer: coarse\)/);
    expect(css).toMatch(/animation:\s*none\s*!important/);
    expect(css).toMatch(/width:\s*max-content\s*!important/);
    expect(css).toMatch(/justify-content:\s*flex-start\s*!important/);
  });
});
