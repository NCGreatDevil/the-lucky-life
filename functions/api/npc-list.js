import { corsHeaders } from '../_utils.js';
import { listNPCs, getNPC } from '../npc/index.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(context) });
  }

  if (context.request.method === 'GET') {
    try {
      const npcIds = listNPCs();
      const npcList = npcIds.map(id => {
        const npc = getNPC(id);
        const avatarUrlMap = {
          'dog_npc': '/r2?path=avatar/cooldog.png',
          'huangshan_npc': '/r2?path=avatar/fatcat.png',
          'xianyu_npc': '/r2?path=avatar/saltfish.png'
        };
        return {
          id: npc.id,
          name: npc.name,
          avatar: npc.avatar,
          avatarUrl: avatarUrlMap[npc.id] || '/r2?path=avatar/default.png',
          title: npc.title,
          description: npc.description,
          personality: npc.personality,
          greetingHours: npc.greetingHours,
          defaultFallbackMessage: npc.getDefaultFallbackMessage(),
          errorMessage: npc.getErrorMessage()
        };
      });

      return new Response(JSON.stringify({
        success: true,
        data: {
          npcs: npcList
        }
      }), { headers: corsHeaders(context) });
    } catch (error) {
      console.error('获取NPC列表错误:', error);
      return new Response(JSON.stringify({ error: '服务器内部错误' }), {
        status: 500,
        headers: corsHeaders(context)
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: corsHeaders(context)
  });
}
