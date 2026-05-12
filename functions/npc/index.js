import { TaizaiNPC } from './TaizaiNPC.js';
import { HuangshanNPC } from './HuangshanNPC.js';
import { XianyuNPC } from './XianyuNPC.js';

const npcRegistry = {
  'taizai_npc': TaizaiNPC,
  'huangshan_npc': HuangshanNPC,
  'xianyu_npc': XianyuNPC
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
