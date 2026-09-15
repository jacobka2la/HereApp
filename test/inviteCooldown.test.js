import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INVITE_COOLDOWN_MS,
  getInviteCooldownKey,
  getInviteCooldownRemaining,
} from '../src/lib/inviteCooldown.js';

test('a user who has never invited anyone has no cooldown', () => {
  assert.equal(getInviteCooldownRemaining(0, 1_000_000), 0);
  assert.equal(getInviteCooldownRemaining(undefined, 1_000_000), 0);
});

test('cooldown lasts exactly five minutes after a successful send', () => {
  const sentAt = 1_000_000;
  assert.equal(getInviteCooldownRemaining(sentAt, sentAt), INVITE_COOLDOWN_MS);
  assert.equal(getInviteCooldownRemaining(sentAt, sentAt + INVITE_COOLDOWN_MS - 1), 1);
  assert.equal(getInviteCooldownRemaining(sentAt, sentAt + INVITE_COOLDOWN_MS), 0);
});

test('cooldowns are isolated by recipient and bar', () => {
  assert.notEqual(getInviteCooldownKey('friend-a', 'bar-a'), getInviteCooldownKey('friend-b', 'bar-a'));
  assert.notEqual(getInviteCooldownKey('friend-a', 'bar-a'), getInviteCooldownKey('friend-a', 'bar-b'));
});
