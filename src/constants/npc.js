export const R2_BASE_URL = '/r2';

export const NPC_AVATARS = {
  dog_npc: `${R2_BASE_URL}?path=avatar/cooldog.png`
};

export function getNpcAvatar(npcId) {
  return NPC_AVATARS[npcId] || `${R2_BASE_URL}?path=avatar/default.png`;
}
