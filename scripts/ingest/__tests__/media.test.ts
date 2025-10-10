import { describe, expect, it } from 'vitest';

import { isAcceptableCommonsLicense } from '../media';

describe('isAcceptableCommonsLicense', () => {
  it('returns true for Creative Commons names', () => {
    expect(
      isAcceptableCommonsLicense({
        name: 'Creative Commons Attribution-Share Alike 4.0 International',
      })
    ).toBe(true);
  });

  it('returns true when only the URL indicates a permissive license', () => {
    expect(
      isAcceptableCommonsLicense({
        url: 'https://creativecommons.org/publicdomain/zero/1.0/',
      })
    ).toBe(true);
  });

  it('returns false when license metadata is missing', () => {
    expect(isAcceptableCommonsLicense(undefined)).toBe(false);
    expect(isAcceptableCommonsLicense({})).toBe(false);
  });

  it('returns false for non-permissive licenses', () => {
    expect(
      isAcceptableCommonsLicense({
        name: 'Fair use',
      })
    ).toBe(false);
  });
});

