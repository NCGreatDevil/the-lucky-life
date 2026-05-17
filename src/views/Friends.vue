<template>
  <div class="flex flex-col h-full">
    <div class="flex justify-end items-center gap-3 px-4 py-2 text-xs">
      <template v-if="userStore.isLoggedIn">
        <router-link to="/profile" class="flex items-center gap-1 no-underline text-[#1a1a1a] font-bold">
          <span class="text-sm">👤</span>
          <span>{{ userStore.user?.nickname }}</span>
        </router-link>
        <span class="text-base relative">🔔</span>
      </template>
    </div>

    <header class="flex justify-between items-center px-6 pt-0 pb-2">
      <router-link to="/" class="text-2xl no-underline text-inherit w-10">←</router-link>
      <h1 class="text-xl font-bold sketch-font">我的好友</h1>
      <div class="w-10"></div>
    </header>

    <div class="flex-1 px-6 pb-6 overflow-y-auto">
      <div v-if="isPageLoading" class="flex flex-col gap-4">
        <div class="skeleton-card h-[140px]"></div>
        <div class="skeleton-card h-20"></div>
        <div class="skeleton-card h-20"></div>
        <div class="skeleton-card h-20"></div>
      </div>

      <template v-else>
      <div class="mb-6" v-if="availableNPCs.length > 0">
        <h3 class="text-base font-bold mb-3">可添加的 NPC</h3>
        <div class="flex flex-col gap-4">
          <template v-for="npc in availableNPCs" :key="npc.id">
            <wired-card v-if="!isFriendAdded(npc.id)" class="p-4" fill="#ffffff">
              <div class="flex gap-3 mb-3">
                <div class="w-16 h-16 border-2 border-black rounded bg-white overflow-hidden flex-shrink-0">
                  <img :src="npc.avatarUrl" :alt="npc.name" class="w-full h-full object-cover">
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <p class="text-lg font-bold m-0">{{ npc.name }}</p>
                    <span class="px-2 py-0.5 bg-gray-200 text-[#1a1a1a] border border-black rounded text-xs">NPC</span>
                  </div>
                  <p class="text-sm text-[#1a1a1a] m-0 mb-1">{{ npc.title }}</p>
                  <p class="text-xs text-[#1a1a1a] m-0 leading-relaxed">{{ npc.description || '神秘的 NPC 角色。' }}</p>
                </div>
              </div>
              <wired-button class="w-full py-2.5 bg-white text-[#1a1a1a] text-sm font-bold cursor-pointer flex items-center justify-center gap-2 sketch-font text-center" @click="addNPCFriend(npc)">
                <span>🐾</span>
                <span>添加为好友</span>
              </wired-button>
            </wired-card>
          </template>
        </div>
      </div>

      <div class="mb-6">
        <h3 class="text-base font-bold mb-3">好友列表 ({{ roleStore.friends.length }})</h3>
        <div class="flex flex-col gap-3" v-if="roleStore.friends.length > 0">
          <wired-card v-for="friend in roleStore.friends" :key="friend.id" class="cursor-pointer active:translate-x-0.5 active:translate-y-0.5" fill="#ffffff">
            <div class="flex items-center gap-3 p-3">
            <div class="w-12 h-12 border-2 border-black rounded bg-[#fafafa] overflow-hidden flex-shrink-0 flex items-center justify-center">
              <img v-if="friend.isNpc" :src="friend.avatar" :alt="friend.name" class="w-full h-full object-cover">
              <span v-else class="text-2xl">{{ friend.avatar }}</span>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-1.5 mb-0.5">
                <p class="text-sm font-bold m-0">{{ friend.name }}</p>
                <span class="text-[10px] bg-[#1a1a1a] text-white px-1 py-0.5 rounded border border-black">Lv.{{ friend.level }}</span>
                <span v-if="friend.isNpc" class="text-[9px] bg-gray-200 text-[#1a1a1a] border border-black rounded px-1 py-0.5">NPC</span>
              </div>
              <p class="text-xs text-[#1a1a1a] m-0 mb-1">{{ friend.title }}</p>
              <div class="flex gap-1 flex-wrap" v-if="friend.tags.length">
                <span v-for="tag in friend.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </div>
            <div class="flex gap-2">
              <wired-button v-if="friend.isNpc" class="w-8 h-8 bg-white text-base cursor-pointer flex items-center justify-center" @click="openChat(friend)">
                💬
              </wired-button>
              <div class="relative">
                <wired-button class="w-8 h-8 bg-white text-lg cursor-pointer flex items-center justify-center leading-none" @click="toggleMoreMenu(friend.id)">⋮</wired-button>
                <wired-card v-if="showMoreMenu === friend.id" class="absolute top-full right-0 mt-1 overflow-hidden z-10 min-w-[100px]" fill="#fafafa">
                  <wired-button class="w-full py-2 px-3 border-0 border-b border-gray-200 bg-transparent text-xs cursor-pointer text-left active:bg-[#f5e8e8]" @click="confirmDelete(friend.id)">删除好友</wired-button>
                </wired-card>
              </div>
            </div>
            </div>
          </wired-card>
        </div>
        <div v-else class="text-center opacity-50 py-8 text-sm">
          还没有好友，添加一个 NPC 开始聊天吧！
        </div>
      </div>

      <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="cancelDelete">
        <wired-card class="p-6 max-w-[320px] w-[90%] text-center" fill="#ffffff">
          <p class="text-sm mb-5 leading-relaxed">确定要删除好友「{{ deleteFriendName }}」吗？</p>
          <div class="flex gap-3 justify-center">
            <wired-button class="px-6 py-2 text-sm cursor-pointer sketch-font bg-white text-[#1a1a1a]" @click="cancelDelete">取消</wired-button>
            <wired-button class="px-6 py-2 text-sm cursor-pointer sketch-font bg-[#1a1a1a] text-white" @click="executeDelete">确定</wired-button>
          </div>
        </wired-card>
      </div>

      <div v-if="showChat" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" @click.self="closeChat">
        <wired-card class="w-[90%] max-w-[400px] h-[80vh] flex flex-col overflow-hidden">
          <div class="flex items-center gap-3 p-4 border-b-2 border-black">
            <div class="w-10 h-10 border-2 border-black rounded bg-[#fafafa] overflow-hidden flex-shrink-0 flex items-center justify-center">
              <img v-if="currentFriend?.isNpc" :src="currentFriend.avatar" :alt="currentFriend.name" class="w-full h-full object-cover">
              <span v-else>{{ currentFriend?.avatar }}</span>
            </div>
            <div class="flex-1">
              <p class="text-base font-bold m-0">{{ currentFriend?.name }}</p>
              <div class="inline-block px-1.5 py-0.5 bg-gray-200 text-[#1a1a1a] border border-black rounded text-[10px] mt-0.5" v-if="currentFriend?.isNpc">NPC</div>
            </div>
            <wired-button class="w-8 h-8 bg-white text-lg cursor-pointer flex items-center justify-center" @click="closeChat">×</wired-button>
          </div>
          <div class="flex-1 p-4 overflow-y-auto flex flex-col gap-3" ref="chatMessagesRef">
            <div v-for="(msg, index) in chatMessagesList" :key="index + '-' + msg.content" :class="['flex', msg.isUser ? 'justify-end' : 'justify-start']">
              <div class="max-w-[70%] py-2 px-3 text-sm leading-relaxed" :class="msg.isUser ? 'bg-[#1a1a1a] text-white' : 'bg-[#fafafa] text-[#1a1a1a]'">
                {{ msg.content }}
              </div>
            </div>
            <div ref="lastMessageRef"></div>
          </div>
          <div class="flex gap-2 p-3 border-t-2 border-black" v-if="!isRefused">
            <wired-input type="text" :value="chatInput" @input="chatInput = $event.target.value" class="flex-1" placeholder="说点什么..." @keyup.enter="sendMessage"></wired-input>
            <wired-button class="px-4 py-2 bg-[#1a1a1a] text-white text-sm cursor-pointer sketch-font" @click="sendMessage" :disabled="isSending">{{ isSending ? '发送中...' : '发送' }}</wired-button>
          </div>
          <div class="p-4 text-center border-t-2 border-black" v-else>
            <p class="m-0 text-sm text-[#1a1a1a]">{{ currentFriend?.name }}不想说话了，下次再来吧 😴</p>
          </div>
        </wired-card>
      </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoleStore } from '@/stores/role';
import { useUserStore } from '@/stores/user';
import { getNpcAvatar } from '@/constants/npc';

const roleStore = useRoleStore();
const userStore = useUserStore();

const showChat = ref(false);
const currentFriend = ref(null);
const chatMessagesList = ref([]);
const chatInput = ref('');
const isSending = ref(false);
const isRefused = ref(false);
const showMoreMenu = ref(null);
const chatMessagesRef = ref(null);
const lastMessageRef = ref(null);
const showDeleteConfirm = ref(false);
const deleteFriendId = ref(null);
const deleteFriendName = ref('');
const availableNPCs = ref([]);
const loadingNPCs = ref(true);
const isPageLoading = ref(true);
const friendsLoaded = ref(false);
const npcMessages = ref({});

const chatHistory = ref([]);
const userTag = ref({});

const allNPCsAdded = computed(() => {
  return availableNPCs.value.length > 0 && 
         availableNPCs.value.every(npc => isFriendAdded(npc.id));
});

function isFriendAdded(npcId) {
  return roleStore.friends.some(f => f.isNpc && f.npcId === npcId);
}

async function loadNPCList() {
  try {
    loadingNPCs.value = true;
    
    const [npcResponse, favResponse] = await Promise.all([
      fetch('/api/npc-list', { method: 'GET', credentials: 'include' }),
      fetch('/api/favorability', { method: 'GET', credentials: 'include' })
    ]);
    
    if (npcResponse.ok && favResponse.ok) {
      const npcResult = await npcResponse.json();
      const favResult = await favResponse.json();
      
      if (npcResult.success && npcResult.data.npcs && favResult.success) {
        const allNPCs = npcResult.data.npcs;
        const favorabilityMap = {};
        
        (favResult.favorability || []).forEach(fav => {
          if (fav.targetType === 'npc') {
            favorabilityMap[fav.targetId] = fav.favorability;
          }
        });
        
        availableNPCs.value = allNPCs.filter(npc => {
          const fav = favorabilityMap[npc.id] || 0;
          return fav >= 100 && !isFriendAdded(npc.id);
        });
        
        allNPCs.forEach(npc => {
          npcMessages.value[npc.id] = {
            defaultFallbackMessage: npc.defaultFallbackMessage,
            errorMessage: npc.errorMessage
          };
        });
      }
    }
  } catch (error) {
    console.error('加载 NPC 列表错误:', error);
  } finally {
    loadingNPCs.value = false;
    friendsLoaded.value = true;
  }
}

function addNPCFriend(npc) {
  if (isFriendAdded(npc.id)) {
    return;
  }
  roleStore.addFriend({
    id: Date.now(),
    npcId: npc.id,
    name: npc.name,
    avatar: npc.avatarUrl,
    title: npc.title,
    isNpc: true,
    tags: [],
    level: 1
  });
}

function getNPCMessages(npcId) {
  return npcMessages.value[npcId] || {
    defaultFallbackMessage: '...',
    errorMessage: '...'
  };
}

async function openChat(friend) {
  currentFriend.value = friend;
  showChat.value = true;
  isRefused.value = false;
  chatHistory.value = [];
  userTag.value = {};
  
  const hour = new Date().getHours();
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        content: '',
        hour: hour,
        npcId: friend.npcId,
        userInfo: {
          name: userStore.user?.nickname || '玩家',
          age: '未知',
          job: userStore.user?.occupation || '无',
          bio: userStore.user?.bio || ''
        }
      })
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        await userStore.logout();
        window.location.href = '/login';
        return;
      }
      throw new Error('AI 服务异常');
    }
    
    const data = await response.json();
    const messages = getNPCMessages(friend.npcId);
    chatMessagesList.value = [{
      isUser: false,
      content: data.reply || messages.defaultFallbackMessage
    }];
    
    if (data.chatHistory) chatHistory.value = data.chatHistory;
    if (data.userTag) userTag.value = data.userTag;
    if (data.isRefused) isRefused.value = true;
  } catch (error) {
    console.error('AI 请求失败:', error);
    const messages = getNPCMessages(friend.npcId);
    chatMessagesList.value = [{
      isUser: false,
      content: messages.errorMessage
    }];
  }
}

async function sendMessage() {
  if (isRefused.value) {
    return;
  }
  
  if (isSending.value || !chatInput.value.trim()) {
    return;
  }
  
  isSending.value = true;
  const inputContent = chatInput.value.trim();
  chatInput.value = '';
  
  chatMessagesList.value.push({
    isUser: true,
    content: inputContent
  });
  
  await nextTick();
  
  setTimeout(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
    }
  }, 100);
  
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        content: inputContent,
        chatHistory: chatHistory.value,
        userTag: userTag.value,
        npcId: currentFriend.value?.npcId,
        hour: new Date().getHours(),
        userInfo: {
          name: userStore.user?.nickname || '玩家',
          age: '未知',
          job: userStore.user?.occupation || '无',
          bio: userStore.user?.bio || ''
        }
      })
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        await userStore.logout();
        window.location.href = '/login';
        return;
      }
      throw new Error('AI 服务异常');
    }
    
    const data = await response.json();
    const messages = getNPCMessages(currentFriend.value?.npcId);
    
    if (data && data.reply && data.reply.trim()) {
      chatMessagesList.value.push({
        isUser: false,
        content: data.reply.trim()
      });
    } else {
      chatMessagesList.value.push({
        isUser: false,
        content: messages.defaultFallbackMessage
      });
    }
    
    if (data.chatHistory) chatHistory.value = data.chatHistory;
    if (data.userTag) userTag.value = data.userTag;
    if (data.isRefused) isRefused.value = true;
  } catch (error) {
    console.error('API error:', error);
    const messages = getNPCMessages(currentFriend.value?.npcId);
    chatMessagesList.value.push({
      isUser: false,
      content: messages.errorMessage
    });
  } finally {
    isSending.value = false;
  }
  
  setTimeout(() => {
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }, 100);
}

function closeChat() {
  showChat.value = false;
  currentFriend.value = null;
  chatMessagesList.value = [];
  chatInput.value = '';
  isRefused.value = false;
  showMoreMenu.value = null;
  chatHistory.value = [];
  userTag.value = {};
}

function toggleMoreMenu(friendId) {
  showMoreMenu.value = showMoreMenu.value === friendId ? null : friendId;
}

function confirmDelete(friendId) {
  const friend = roleStore.friends.find(f => f.id === friendId);
  if (friend) {
    deleteFriendId.value = friendId;
    deleteFriendName.value = friend.name;
    showDeleteConfirm.value = true;
    showMoreMenu.value = null;
  }
}

function cancelDelete() {
  showDeleteConfirm.value = false;
  deleteFriendId.value = null;
  deleteFriendName.value = '';
}

function executeDelete() {
  if (deleteFriendId.value) {
    roleStore.removeFriend(deleteFriendId.value);
    cancelDelete();
  }
}

function removeFriend(friendId) {
  roleStore.removeFriend(friendId);
}

onMounted(async () => {
  await Promise.all([
    roleStore.loadFriendsFromBackend(),
    loadNPCList()
  ]);
  await roleStore.mergeNPCMetadata();
  isPageLoading.value = false;
});

onUnmounted(() => {
  chatHistory.value = [];
  userTag.value = [];
});
</script>

<style scoped>
</style>
