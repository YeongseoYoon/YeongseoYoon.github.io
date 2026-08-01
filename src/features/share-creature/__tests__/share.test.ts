import { describe, expect, it } from 'vitest';
import { buildCreatureShareUrl, buildTankShareUrl } from '../model/share';

describe('buildCreatureShareUrl', () => {
  it('builds the production Vercel URL without a repository path', () => {
    expect(buildCreatureShareUrl('sample-id', 'https://endless-aquarium.vercel.app/')).toBe(
      'https://endless-aquarium.vercel.app/?focus=sample-id',
    );
  });

  it('builds a deep link that preserves the GitHub Pages base path', () => {
    expect(buildCreatureShareUrl('fish 1', 'https://example.com/endless-aquarium/')).toBe(
      'https://example.com/endless-aquarium/?focus=fish+1',
    );
  });

  it('replaces an existing focus parameter without dropping other parameters', () => {
    expect(buildCreatureShareUrl('new-id', 'https://example.com/app/?focus=old&from=friend')).toBe(
      'https://example.com/app/?focus=new-id&from=friend',
    );
  });
});

describe('buildTankShareUrl', () => {
  it('builds a public tank route for the owner', () => {
    expect(buildTankShareUrl('owner-id', 'https://endless-aquarium.vercel.app/')).toBe(
      'https://endless-aquarium.vercel.app/tank/owner-id',
    );
  });

  it('preserves a nested deployment base path', () => {
    expect(buildTankShareUrl('owner/id', 'https://example.com/endless-aquarium/')).toBe(
      'https://example.com/endless-aquarium/tank/owner%2Fid',
    );
  });
});
