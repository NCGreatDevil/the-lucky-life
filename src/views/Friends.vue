<template>
  <div class="friends-page">
    <div class="user-bar">
      <template v-if="userStore.isLoggedIn">
        <router-link to="/profile" class="user-link">
          <span class="user-icon">👤</span>
          <span class="user-name">{{ userStore.user?.nickname }}</span>
        </router-link>
        <span class="notification-bell">🔔</span>
      </template>
    </div>

    <header class="header">
      <router-link to="/" class="back-btn">←</router-link>
      <h1 class="title sketch-font">我的好友</h1>
      <div class="placeholder"></div>
    </header>

    <div class="content-area">
      <div v-if="isPageLoading" class="skeleton-container">
        <div class="skeleton-card skeleton-npc-card"></div>
        <div class="skeleton-card skeleton-friend-item"></div>
        <div class="skeleton-card skeleton-friend-item"></div>
        <div class="skeleton-card skeleton-friend-item"></div>
      </div>

      <template v-else>
      <div class="npc-section" v-if="availableNPCs.length > 0">
        <h3 class="section-title">可添加的 NPC</h3>
        <div class="npc-list">
          <template v-for="npc in availableNPCs" :key="npc.id">
            <wired-card v-if="!isFriendAdded(npc.id)" class="npc-card">
              <div class="npc-header">
                <div class="npc-avatar">
                  <img :src="npc.avatarUrl" :alt="npc.name" class="npc-avatar-img">
                </div>
                <div class="npc-info">
                  <div class="npc-name-row">
                    <p class="npc-name">{{ npc.name }}</p>
                    <span class="npc-tag">NPC</span>
                  </div>
                  <p class="npc-title">{{ npc.title }}</p>
                  <p class="npc-desc">{{ npc.description || '神秘的 NPC 角色。' }}</p>
                </div>
              </div>
              <wired-button class="add-npc-btn" @click="addNPCFriend(npc)">
                <span>🐾</span>
                <span>添加为好友</span>
              </wired-button>
            </wired-card>
          </template>
        </div>
      </div>

      <div class="friends-section">
        <h3 class="section-title">好友列表 ({{ roleStore.friends.length }})</h3>
        <div class="friends-list" v-if="roleStore.friends.length > 0">
          <wired-card v-for="friend in roleStore.friends" :key="friend.id" class="friend-item">
            <div class="friend-avatar">
              <img v-if="friend.isNpc" :src="friend.avatar" :alt="friend.name" class="friend-avatar-img">
              <span v-else class="avatar-emoji">{{ friend.avatar }}</span>
            </div>
            <div class="friend-details">
              <div class="friend-header">
                <p class="friend-name">{{ friend.name }}</p>
                <span class="friend-level">Lv.{{ friend.level }}</span>
                <span v-if="friend.isNpc" class="npc-tag-small">NPC</span>
              </div>
              <p class="friend-title">{{ friend.title }}</p>
              <div class="friend-tags" v-if="friend.tags.length">
                <span v-for="tag in friend.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </div>
            <div class="friend-actions">
              <wired-button v-if="friend.isNpc" class="chat-btn" @click="openChat(friend)">
                💬
              </wired-button>
              <div class="more-menu-wrapper">
                <wired-button class="more-btn" @click="toggleMoreMenu(friend.id)">⋮</wired-button>
                <wired-card v-if="showMoreMenu === friend.id" class="more-menu">
                  <wired-button class="menu-item" @click="confirmDelete(friend.id)">删除好友</wired-button>
                </wired-card>
              </div>
            </div>
          </wired-card>
        </div>
        <div v-else class="empty-tip">
          还没有好友，添加一个 NPC 开始聊天吧！
        </div>
      </div>

      <div v-if="showDeleteConfirm" class="delete-modal modal-overlay" @click.self="cancelDelete">
        <wired-card class="delete-dialog">
          <p class="delete-message">确定要删除好友「{{ deleteFriendName }}」吗？</p>
          <div class="delete-actions">
            <wired-button class="cancel-btn" @click="cancelDelete">取消</wired-button>
            <wired-button class="confirm-btn" @click="executeDelete">确定</wired-button>
          </div>
        </wired-card>
      </div>

      <div v-if="showChat" class="chat-modal modal-overlay" @click.self="closeChat">
        <wired-card class="chat-window">
          <div class="chat-header">
            <div class="chat-avatar">
              <img v-if="currentFriend?.isNpc" :src="currentFriend.avatar" :alt="currentFriend.name" class="chat-avatar-img">
              <span v-else>{{ currentFriend?.avatar }}</span>
            </div>
            <div class="chat-info">
              <p class="chat-name">{{ currentFriend?.name }}</p>
              <div class="chat-npc-tag" v-if="currentFriend?.isNpc">NPC</div>
            </div>
            <wired-button class="close-chat-btn" @click="closeChat">×</wired-button>
          </div>
          <div class="chat-messages" ref="chatMessagesRef">
            <div v-for="(msg, index) in chatMessagesList" :key="index + '-' + msg.content" :class="['message', msg.isUser ? 'user-message' : 'bot-message']">
              <wired-card class="message-content">
                {{ msg.content }}
              </wired-card>
            </div>
            <div ref="lastMessageRef"></div>
          </div>
          <div class="chat-input-area" v-if="!isRefused">
            <wired-input type="text" :value="chatInput" @input="chatInput = $event.target.value" class="chat-input" placeholder="说点什么..." @keyup.enter="sendMessage" style="flex: 1;"></wired-input>
            <wired-button class="send-btn" @click="sendMessage" :disabled="isSending">{{ isSending ? '发送中...' : '发送' }}</wired-button>
          </div>
          <div class="chat-refused-tip" v-else>
            <p>{{ currentFriend?.name }}不想说话了，下次再来吧 😴</p>
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
  // console.log('检查 NPC 是否已添加:', npcId, '好友列表:', roleStore.friends.map(f => ({ id: f.id, npcId: f.npcId, isNpc: f.isNpc })));
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
    isNpc: true
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
.friends-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.user-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  font-size: 12px;
}

.user-link {
  display: flex;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: #1a1a1a;
  font-weight: bold;
}

.user-icon {
  font-size: 14px;
}

.notification-bell {
  font-size: 16px;
  position: relative;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 24px 8px 24px;
}

.back-btn {
  font-size: 24px;
  text-decoration: none;
  color: inherit;
  width: 40px;
}

.title {
  font-size: 20px;
  font-weight: bold;
}

.placeholder {
  width: 40px;
}

.content-area {
  flex: 1;
  padding: 0 24px 24px;
  overflow-y: auto;
}

/* 骨架屏 */
.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-card {
  background: linear-gradient(90deg, #e8e8e8 25%, #d8d8d8 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 2.25s infinite;
  border-radius: 4px;
}

.skeleton-npc-card {
  height: 140px;
}

.skeleton-friend-item {
  height: 80px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.npc-section {
  margin-bottom: 24px;
}

.npc-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.npc-card {
  background: #fafafa;
  padding: 16px;
}

.npc-header {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.npc-avatar {
  width: 64px;
  height: 64px;
  border: 2px solid #000;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  overflow: hidden;
  flex-shrink: 0;
}

.npc-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.npc-info {
  flex: 1;
}

.npc-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.npc-name {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
}

.npc-tag {
  padding: 2px 8px;
  background: #e0e0e0;
  color: #1a1a1a;
  border: 1px solid #000;
  border-radius: 4px;
  font-size: 11px;
}

.npc-title {
  font-size: 13px;
  color: #1a1a1a;
  margin: 0 0 4px 0;
}

.npc-desc {
  font-size: 12px;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.5;
}

.add-npc-btn {
  width: 100%;
  padding: 10px;
  background: #fff;
  color: #1a1a1a;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}

.friends-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
}

.friends-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.friend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
}

.friend-avatar {
  width: 48px;
  height: 48px;
  border: 2px solid #000;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-emoji {
  font-size: 24px;
}

.friend-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.friend-details {
  flex: 1;
}

.friend-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.friend-header .friend-name {
  font-size: 14px;
  font-weight: bold;
  margin: 0;
}

.friend-header .friend-level {
  font-size: 10px;
  background: #1a1a1a;
  color: #fff;
  padding: 1px 4px;
  border-radius: 4px;
  border: 1px solid #000;
}

.npc-tag-small {
  padding: 1px 4px;
  background: #e0e0e0;
  color: #1a1a1a;
  border: 1px solid #000;
  border-radius: 4px;
  font-size: 9px;
}

.friend-title {
  font-size: 12px;
  color: #1a1a1a;
  margin: 0 0 4px 0;
}

.friend-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag {
  padding: 2px 8px;
  background: #f0f0f0;
  border: 1px solid #000;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}

.friend-actions {
  display: flex;
  gap: 8px;
}

.chat-btn {
  width: 32px;
  height: 32px;
  background: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.more-menu-wrapper {
  position: relative;
}

.more-btn {
  width: 32px;
  height: 32px;
  background: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.more-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: #fff;
  overflow: hidden;
  z-index: 10;
  min-width: 100px;
}

.menu-item {
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-bottom: 1px solid #e0e0e0;
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s ease;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background: #f5e8e8;
}

.delete-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.delete-dialog {
  background: #fff;
  padding: 24px;
  max-width: 320px;
  width: 90%;
  text-align: center;
}

.delete-message {
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.5;
}

.delete-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.cancel-btn,
.confirm-btn {
  padding: 8px 24px;
  font-size: 13px;
  cursor: pointer;
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}

.cancel-btn {
  background: #fff;
  color: #1a1a1a;
}

.confirm-btn {
  background: #1a1a1a;
  color: #fff;
}

.empty-tip {
  text-align: center;
  opacity: 0.5;
  padding: 32px;
  font-size: 14px;
}

.chat-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.chat-window {
  width: 90%;
  max-width: 400px;
  height: 80vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 2px solid #000;
}

.chat-avatar {
  width: 40px;
  height: 40px;
  border: 2px solid #000;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  overflow: hidden;
  flex-shrink: 0;
}

.chat-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-info {
  flex: 1;
}

.chat-name {
  font-size: 16px;
  font-weight: bold;
  margin: 0;
}

.chat-npc-tag {
  display: inline-block;
  padding: 1px 6px;
  background: #e0e0e0;
  color: #1a1a1a;
  border: 1px solid #000;
  border-radius: 4px;
  font-size: 10px;
  margin-top: 2px;
}

.close-chat-btn {
  width: 32px;
  height: 32px;
  background: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
}

.user-message {
  justify-content: flex-end;
}

.bot-message {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1.5;
}

.user-message .message-content {
  background: #1a1a1a;
  color: #fff;
}

.bot-message .message-content {
  background: #fafafa;
  color: #1a1a1a;
}

.chat-input-area {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 2px solid #000;
}

.chat-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #000;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}

.chat-input:focus {
  border-color: #333;
}

.send-btn {
  padding: 8px 16px;
  background: #1a1a1a;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}

.chat-refused-tip {
  padding: 16px;
  text-align: center;
  border-top: 2px solid #000;
}

.chat-refused-tip p {
  margin: 0;
  font-size: 13px;
  color: #1a1a1a;
}

.info-section {
  margin-top: 24px;
}

.info-card {
  background: #fafafa;
  border: 2px solid #000;
  border-radius: 4px;
  padding: 16px;
  text-align: center;
}

.info-icon {
  font-size: 24px;
  margin: 0 0 8px 0;
}

.info-text {
  font-size: 14px;
  font-weight: bold;
  margin: 0 0 12px 0;
}

.info-list {
  text-align: left;
  padding-left: 20px;
  margin: 0;
}

.info-list li {
  font-size: 12px;
  color: #1a1a1a;
  margin-bottom: 4px;
  line-height: 1.5;
}
</style>
