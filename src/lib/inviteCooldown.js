export const INVITE_COOLDOWN_MS = 5 * 60 * 1000;

export function getInviteCooldownRemaining(lastSentAtMillis, now = Date.now()) {
  const sentAt = Number(lastSentAtMillis);
  if (!Number.isFinite(sentAt) || sentAt <= 0) return 0;
  return Math.max(0, INVITE_COOLDOWN_MS - (now - sentAt));
}

export function getInviteCooldownKey(toUid, barId) {
  return `${toUid || ''}_${barId || ''}`;
}
