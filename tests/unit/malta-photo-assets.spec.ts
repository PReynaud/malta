import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const assetRoot = resolve(process.cwd(), 'public/malta-photos');
const manifestPath = resolve(
  process.cwd(),
  'tests/unit/fixtures/malta-photo-storage-paths.json'
);

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function jpegDimensions(bytes: Buffer): { width: number; height: number } {
  expect(bytes.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));

  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf
  ]);
  let offset = 2;

  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1]!;
    if (startOfFrameMarkers.has(marker)) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7)
      };
    }

    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }

    const segmentLength = bytes.readUInt16BE(offset + 2);
    if (segmentLength < 2) {
      break;
    }
    offset += segmentLength + 2;
  }

  throw new Error('JPEG dimensions not found');
}

function containsExifPayload(bytes: Buffer): boolean {
  const exifSignature = Buffer.from('Exif\0\0', 'ascii');
  let offset = 2;

  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1]!;
    if (marker === 0xda || marker === 0xd9) {
      return false;
    }

    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }

    const segmentLength = bytes.readUInt16BE(offset + 2);
    if (segmentLength < 2 || offset + segmentLength + 2 > bytes.length) {
      return false;
    }

    if (
      marker === 0xe1
      && bytes.subarray(offset + 4, offset + 10).equals(exifSignature)
    ) {
      return true;
    }
    offset += segmentLength + 2;
  }

  return false;
}

describe('committed Malta photo assets', () => {
  it('contains every production-referenced path and no unexpected files', () => {
    const expectedPaths = JSON.parse(readFileSync(manifestPath, 'utf8')) as string[];
    const actualPaths = listFiles(assetRoot)
      .map(path => relative(assetRoot, path).replaceAll('\\', '/'))
      .sort();

    expect(expectedPaths).toHaveLength(126);
    expect(new Set(expectedPaths).size).toBe(expectedPaths.length);
    expect(actualPaths).toEqual([...expectedPaths].sort());
  });

  it('stores each referenced asset as an optimized JPEG at most 1920 pixels', () => {
    const expectedPaths = JSON.parse(readFileSync(manifestPath, 'utf8')) as string[];

    for (const storagePath of expectedPaths) {
      const assetPath = resolve(assetRoot, storagePath);
      expect(existsSync(assetPath), storagePath).toBe(true);
      expect(extname(assetPath).toLowerCase(), storagePath).toBe('.jpg');

      const bytes = readFileSync(assetPath);
      expect(bytes.subarray(-2), storagePath).toEqual(Buffer.from([0xff, 0xd9]));
      expect(containsExifPayload(bytes), storagePath).toBe(false);

      const { width, height } = jpegDimensions(bytes);
      expect(width, storagePath).toBeGreaterThan(0);
      expect(height, storagePath).toBeGreaterThan(0);
      expect(Math.max(width, height), storagePath).toBeLessThanOrEqual(1920);
    }
  });
});
