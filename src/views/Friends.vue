<template>
  <div class="friends-page">
    <header class="header">
      <router-link to="/" class="back-btn">←</router-link>
      <h1 class="title sketch-font">我的好友</h1>
      <div class="placeholder"></div>
    </header>

    <div class="content-area">
      <div class="npc-section" v-if="friendsLoaded && !allNPCsAdded">
        <h3 class="section-title">可添加的 NPC</h3>
        <div class="npc-list">
          <template v-for="npc in availableNPCs" :key="npc.id">
            <div v-if="!isFriendAdded(npc.id)" class="npc-card hand-drawn-border">
              <div class="npc-header">
                <div class="npc-avatar">
                  <img :src="getNpcAvatar(npc.id)" :alt="npc.name" class="npc-avatar-img">
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
              <button class="add-npc-btn" @click="addNPCFriend(npc)">
                <span>🐾</span>
                <span>添加为好友</span>
              </button>
            </div>
          </template>
        </div>
      </div>

      <div class="friends-section">
        <h3 class="section-title">好友列表 ({{ roleStore.friends.length }})</h3>
        <div class="friends-list" v-if="roleStore.friends.length > 0">
          <div v-for="friend in roleStore.friends" :key="friend.id" class="friend-item hand-drawn-border">
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
              <button v-if="friend.isNpc" class="chat-btn" @click="openChat(friend)">
                💬
              </button>
              <div class="more-menu-wrapper">
                <button class="more-btn" @click="toggleMoreMenu(friend.id)">⋮</button>
                <div v-if="showMoreMenu === friend.id" class="more-menu hand-drawn-border">
                  <button class="menu-item" @click="confirmDelete(friend.id)">删除好友</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-tip">
          还没有好友，添加一个 NPC 开始聊天吧！
        </div>
      </div>

      <div v-if="showDeleteConfirm" class="delete-modal modal-overlay" @click.self="cancelDelete">
        <div class="delete-dialog hand-drawn-border">
          <p class="delete-message">确定要删除好友「{{ deleteFriendName }}」吗？</p>
          <div class="delete-actions">
            <button class="cancel-btn" @click="cancelDelete">取消</button>
            <button class="confirm-btn" @click="executeDelete">确定</button>
          </div>
        </div>
      </div>

      <div v-if="showChat" class="chat-modal modal-overlay" @click.self="closeChat">
        <div class="chat-window hand-drawn-border">
          <div class="chat-header">
            <div class="chat-avatar">
              <img v-if="currentFriend?.isNpc" :src="currentFriend.avatar" :alt="currentFriend.name" class="chat-avatar-img">
              <span v-else>{{ currentFriend?.avatar }}</span>
            </div>
            <div class="chat-info">
              <p class="chat-name">{{ currentFriend?.name }}</p>
              <div class="chat-npc-tag" v-if="currentFriend?.isNpc">NPC</div>
            </div>
            <button class="close-chat-btn" @click="closeChat">×</button>
          </div>
          <div class="chat-messages" ref="chatMessages">
            <div v-for="(msg, index) in chatMessagesList" :key="index" :class="['message', msg.isUser ? 'user-message' : 'bot-message']">
              <div class="message-content hand-drawn-border">
                {{ msg.content }}
              </div>
            </div>
          </div>
          <div class="chat-input-area" v-if="!isRefused">
            <input type="text" v-model="chatInput" class="chat-input" placeholder="说点什么..." @keyup.enter="sendMessage">
            <button class="send-btn" @click="sendMessage" :disabled="isSending">{{ isSending ? '发送中...' : '发送' }}</button>
          </div>
          <div class="chat-refused-tip" v-else>
            <p>太宰不想说话了，下次再来吧 😴</p>
          </div>
        </div>
      </div>

      <div class="info-section">
        <div class="info-card">
          <p class="info-icon">💡</p>
          <p class="info-text">好友功能说明</p>
          <ul class="info-list">
            <li>点击 NPC 卡片可以添加为好友</li>
            <li>添加后可以点击 💬 图标和 NPC 聊天</li>
            <li>每个 NPC 都有独特的性格和对话风格</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoleStore } from '@/stores/role';
import { useUserStore } from '@/stores/user';
import { getNpcAvatar } from '@/constants/npc';

const roleStore = useRoleStore();
const userStore = useUserStore();

const showChat = ref(false);
const currentFriend = ref(null);
const chatMessagesList = ref([]);
const chatInput = ref('');
const chatRound = ref(0);
const tempAlwaysAskQ = ref(false);
const isSending = ref(false);
const isRefused = ref(false);
const showMoreMenu = ref(null);
const showDeleteConfirm = ref(false);
const deleteFriendId = ref(null);
const deleteFriendName = ref('');
const availableNPCs = ref([]);
const loadingNPCs = ref(true);
const friendsLoaded = ref(false);

const chatHistory = ref([]);
const userTag = ref({});

const allNPCsAdded = computed(() => {
  if (!friendsLoaded.value) return false;
  return availableNPCs.value.length > 0 && 
         availableNPCs.value.every(npc => isFriendAdded(npc.id));
});

function isFriendAdded(npcId) {
  return roleStore.friends.some(f => f.isNpc && f.npcId === npcId);
}

async function loadNPCList() {
  try {
    loadingNPCs.value = true;
    const response = await fetch('/api/npc-list', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data.npcs) {
        availableNPCs.value = result.data.npcs;
      }
    }
  } catch (error) {
    console.error('加载 NPC 列表错误:', error);
  } finally {
    loadingNPCs.value = false;
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
    avatar: getNpcAvatar(npc.id),
    title: npc.title,
    tags: [],
    level: 1,
    isNpc: true
  });
}

async function openChat(friend) {
  currentFriend.value = friend;
  chatRound.value = 0;
  tempAlwaysAskQ.value = false;
  showChat.value = true;
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
    chatMessagesList.value = [{
      isUser: false,
      content: data.reply || '...有事？'
    }];
    
    if (data.chatHistory) chatHistory.value = data.chatHistory;
    if (data.userTag) userTag.value = data.userTag;
    if (data.isRefused) isRefused.value = true;
  } catch (error) {
    console.error('AI 请求失败:', error);
    chatMessagesList.value = [{
      isUser: false,
      content: '...有事？'
    }];
  }
}

async function sendMessage() {
  if (isRefused.value) {
    chatMessagesList.value.push({
      isUser: false,
      content: '太宰已经不想说话了...'
    });
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
  chatRound.value++;
  
  if (!tempAlwaysAskQ.value && chatRound.value >= 6 && chatRound.value <= 10) {
    if (Math.random() > 0.5) {
      tempAlwaysAskQ.value = true;
    }
  }
  
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
    
    if (data && data.reply && data.reply.trim()) {
      chatMessagesList.value.push({
        isUser: false,
        content: data.reply.trim()
      });
    } else {
      chatMessagesList.value.push({
        isUser: false,
        content: '懒得多说。'
      });
    }
    
    if (data.chatHistory) chatHistory.value = data.chatHistory;
    if (data.userTag) userTag.value = data.userTag;
    if (data.isRefused) isRefused.value = true;
  } catch (error) {
    console.error('API error:', error);
    chatMessagesList.value.push({
      isUser: false,
      content: '网络出错了...'
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
  chatRound.value = 0;
  tempAlwaysAskQ.value = false;
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
  await roleStore.loadFriendsFromBackend();
  friendsLoaded.value = true;
  await loadNPCList();
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

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 48px 24px 24px;
}

.back-btn {
  font-size: 24px;
  text-decoration: none;
  color: inherit;
  width: 40px;
}

.title {
  font-size: 24px;
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

.npc-section {
  margin-bottom: 24px;
}

.npc-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.npc-card {
  background: linear-gradient(135deg, #fff5f5 0%, #fff 100%);
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
  border-radius: 50%;
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
  color: #666;
  border-radius: 4px;
  font-size: 11px;
}

.npc-title {
  font-size: 13px;
  color: #666;
  margin: 0 0 4px 0;
}

.npc-desc {
  font-size: 12px;
  color: #888;
  margin: 0;
  line-height: 1.5;
}

.add-npc-btn {
  width: 100%;
  padding: 10px;
  border: 2px solid #000;
  border-radius: 6px;
  background: #000;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.1s ease;
}

.add-npc-btn:hover {
  background: #333;
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
  border-radius: 50%;
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
  background: #000;
  color: #fff;
  padding: 1px 4px;
  border-radius: 2px;
}

.npc-tag-small {
  padding: 1px 4px;
  background: #e0e0e0;
  color: #666;
  border-radius: 2px;
  font-size: 9px;
  opacity: 0.5;
}

.friend-title {
  font-size: 12px;
  color: #666;
  margin: 0 0 4px 0;
}

.friend-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag {
  padding: 2px 6px;
  background: #f5f5f5;
  border-radius: 2px;
  font-size: 10px;
}

.friend-actions {
  display: flex;
  gap: 8px;
}

.chat-btn {
  width: 32px;
  height: 32px;
  border: 2px solid #000;
  border-radius: 50%;
  background: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease;
}

.chat-btn:hover {
  background: #f0f0f0;
}

.more-menu-wrapper {
  position: relative;
}

.more-btn {
  width: 32px;
  height: 32px;
  border: 2px solid #000;
  border-radius: 50%;
  background: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease;
  line-height: 1;
}

.more-btn:hover {
  background: #f0f0f0;
}

.more-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
  z-index: 10;
  min-width: 100px;
}

.menu-item {
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s ease;
}

.menu-item:hover {
  background: #ffebee;
  color: #f44336;
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
  border-radius: 8px;
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
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.1s ease;
}

.cancel-btn {
  border: 2px solid #000;
  background: #fff;
  color: #000;
}

.cancel-btn:hover {
  background: #f5f5f5;
}

.confirm-btn {
  border: 2px solid #f44336;
  background: #f44336;
  color: #fff;
}

.confirm-btn:hover {
  background: #d32f2f;
  border-color: #d32f2f;
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
  border-radius: 8px;
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
  border-radius: 50%;
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
  color: #666;
  border-radius: 3px;
  font-size: 10px;
  margin-top: 2px;
}

.close-chat-btn {
  width: 32px;
  height: 32px;
  border: 2px solid #000;
  border-radius: 50%;
  background: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease;
}

.close-chat-btn:hover {
  background: #f0f0f0;
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
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}

.user-message .message-content {
  background: #000;
  color: #fff;
}

.bot-message .message-content {
  background: #f5f5f5;
  color: #000;
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
  border: 2px solid #000;
  border-radius: 4px;
  background: #000;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.1s ease;
}

.send-btn:hover:not(:disabled) {
  background: #333;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-refused-tip {
  padding: 16px;
  text-align: center;
  border-top: 2px solid #000;
}

.chat-refused-tip p {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.info-section {
  margin-top: 24px;
}

.info-card {
  background: #f9f9f9;
  border: 2px solid #000;
  border-radius: 8px;
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
  color: #666;
  margin-bottom: 4px;
  line-height: 1.5;
}
</style>
