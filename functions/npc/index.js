import { TaizaiNPC } from './TaizaiNPC.js';

const npcRegistry = {
  'dog_npc': TaizaiNPC
};

export function getNPC(npcId) {
  const NPCClass = npcRegistry[npcId];
  if (!NPCClass) {
    throw new Error(`未找到 NPC: ${npcId}`);
  }
  return new NPCClass();
}

export function listNPCs() {
  return Object.keys(npcRegistry);
}
