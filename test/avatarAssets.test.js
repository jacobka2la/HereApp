import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { avatars, getAvatarById } from '../src/lib/avatars.js';

test('every selectable avatar resolves to its own bundled image', () => {
  assert.equal(avatars.length, 12);
  for (const avatar of avatars) {
    assert.equal(getAvatarById(avatar.id)?.id, avatar.id);
    const assetUrl = new URL(`../public${avatar.image}`, import.meta.url);
    assert.equal(existsSync(fileURLToPath(assetUrl)), true, `${avatar.id} is missing ${avatar.image}`);
  }
});
