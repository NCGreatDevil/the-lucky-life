<template>
  <div class="friends-page">
    <!-- 顶部标题 -->
    <header class="header">
      <router-link to="/" class="back-btn">←</router-link>
      <h1 class="title sketch-font">我的好友</h1>
      <div class="placeholder"></div>
    </header>

    <!-- 好友列表区域 -->
    <div class="content-area">
      <!-- NPC 小狗添加区域 -->
      <div class="npc-section">
        <div class="npc-card hand-drawn-border" v-if="!hasDogFriend">
          <div class="npc-header">
            <div class="npc-avatar">
              <span class="avatar-emoji">🐶</span>
            </div>
            <div class="npc-info">
              <div class="npc-name-row">
                <p class="npc-name">太宰</p>
                <span class="npc-tag">NPC</span>
              </div>
              <p class="npc-title">高冷小狗</p>
              <p class="npc-desc">一只可以双脚站立、会说人话的高冷小狗。性格孤僻冷淡，非常不爱搭理人类。</p>
            </div>
          </div>
          <button class="add-npc-btn" @click="addDogFriend">
            <span>🐾</span>
            <span>添加为好友</span>
          </button>
        </div>
      </div>

      <!-- 好友列表 -->
      <div class="friends-section">
        <h3 class="section-title">好友列表 ({{ roleStore.friends.length }})</h3>
        <div class="friends-list" v-if="roleStore.friends.length > 0">
          <div v-for="friend in roleStore.friends" :key="friend.id" class="friend-item hand-drawn-border">
            <div class="friend-avatar">
              <span class="avatar-emoji">{{ friend.avatar }}</span>
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
              <button class="remove-btn" @click="removeFriend(friend.id)">×</button>
            </div>
          </div>
        </div>
        <div v-else class="empty-tip">
          还没有好友，先添加高冷小狗太宰吧！
        </div>
      </div>

      <!-- 聊天弹窗 -->
      <div v-if="showChat" class="chat-modal modal-overlay" @click.self="closeChat">
        <div class="chat-window hand-drawn-border">
          <div class="chat-header">
            <div class="chat-avatar">
              <span>{{ currentFriend?.isNpc ? '🐶' : currentFriend?.avatar }}</span>
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
          <div class="chat-input-area">
            <input type="text" v-model="chatInput" class="chat-input" placeholder="说点什么..." @keyup.enter="sendMessage">
            <button class="send-btn" @click="sendMessage">发送</button>
          </div>
        </div>
      </div>

      <!-- 互动说明 -->
      <div class="info-section">
        <div class="info-card">
          <p class="info-icon">💡</p>
          <p class="info-text">好友功能说明</p>
          <ul class="info-list">
            <li>点击 NPC 小狗可以添加为好友</li>
            <li>添加后可以点击 💬 图标和小狗聊天</li>
            <li>小狗性格高冷，回复简短</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>import { ref, computed } from 'vue';
import { useRoleStore } from '@/stores/role';
const roleStore = useRoleStore();
// 聊天相关
const showChat = ref(false);
const currentFriend = ref(null);
const chatMessagesList = ref([]);
const chatInput = ref('');
const chatRound = ref(0);
const tempAlwaysAskQ = ref(false);
// 检查是否已有小狗好友
const hasDogFriend = computed(() => {
 return roleStore.friends.some(f => f.isNpc);
});
// 小狗太宰的信息
const dogFriend = {
 name: '太宰',
 avatar: '🐶',
 title: '高冷小狗',
 tags: ['高冷', '傲娇', '话少'],
 level: 1,
 isNpc: true
};
// 添加小狗好友
function addDogFriend() {
 if (hasDogFriend.value) {
 return;
 }
 roleStore.addFriend({ ...dogFriend, id: Date.now() });
}
// 打开聊天
async function openChat(friend) {
 currentFriend.value = friend;
 chatRound.value = 0;
 tempAlwaysAskQ.value = false;
 showChat.value = true;
 
 try {
 const response = await fetch('/api/ai', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json'
 },
 body: JSON.stringify({
 content: '',
 userInfo: {
 name: roleStore.userName || '玩家',
 age: roleStore.age || '未知',
 job: roleStore.occupation || '无',
 bio: roleStore.bio || ''
 }
 })
 });
 const data = await response.json();
 chatMessagesList.value = [{
 isUser: false,
 content: data.reply || '...有事？'
 }];
 } catch (error) {
 chatMessagesList.value = [{
 isUser: false,
 content: '...有事？'
 }];
 }
}
// 发送消息
async function sendMessage() {
 if (!chatInput.value.trim())
 return;
 // 添加用户消息
 chatMessagesList.value.push({
 isUser: true,
 content: chatInput.value.trim()
 });
 chatRound.value++;
 // 检查是否需要标记爱提问
 if (!tempAlwaysAskQ.value && chatRound.value >= 6 && chatRound.value <= 10) {
 if (Math.random() > 0.5) {
 tempAlwaysAskQ.value = true;
 }
 }
 // 调用 AI
 try {
 const response = await fetch('/api/ai', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json'
 },
 body: JSON.stringify({
 content: chatInput.value.trim(),
 userInfo: {
 name: roleStore.userName || '玩家',
 age: roleStore.age || '未知',
 job: roleStore.occupation || '无',
 bio: roleStore.bio || ''
 }
 })
 });
 const data = await response.json();
 // 添加 AI 回复
 chatMessagesList.value.push({
 isUser: false,
 content: data.reply || '懒得多说。'
 });
 }
 catch (error) {
 chatMessagesList.value.push({
 isUser: false,
 content: '网络出错了...'
 });
 }
 chatInput.value = '';
 // 滚动到底部
 setTimeout(() => {
 const chatMessages = document.querySelector('.chat-messages');
 if (chatMessages) {
 chatMessages.scrollTop = chatMessages.scrollHeight;
 }
 }, 100);
}
// 关闭聊天
function closeChat() {
 showChat.value = false;
 currentFriend.value = null;
 chatMessagesList.value = [];
 chatInput.value = '';
 chatRound.value = 0;
 tempAlwaysAskQ.value = false;
}
// 删除好友
function removeFriend(friendId) {
 roleStore.removeFriend(friendId);
}
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

/* NPC 小狗卡片 */
.npc-section {
  margin-bottom: 24px;
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
}

.npc-avatar .avatar-emoji {
  font-size: 32px;
}

.npc-info {
  flex: 1;
}

.npc-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.npc-name {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
}

.npc-tag {
  padding: 2px 6px;
  background: #e0e0e0;
  color: #666;
  border-radius: 3px;
  font-size: 10px;
  opacity: 0.6;
}

.npc-title {
  font-size: 12px;
  opacity: 0.6;
  margin: 2px 0 4px 0;
}

.npc-desc {
  font-size: 12px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.add-npc-btn {
  width: 100%;
  padding: 12px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: bold;
  transition: transform 0.1s ease;
}

.add-npc-btn:active {
  transform: translate(2px, 2px);
}

/* 好友列表 */
.friends-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
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
}

.avatar-emoji {
  font-size: 24px;
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
  font-size: 11px;
  opacity: 0.6;
  margin: 2px 0 4px 0;
}

.friend-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
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

.remove-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #ddd;
  border-radius: 50%;
  background: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
}

.remove-btn:hover {
  opacity: 1;
  background: #ffebee;
  border-color: #f44336;
  color: #f44336;
}

.empty-tip {
  text-align: center;
  opacity: 0.5;
  padding: 32px;
  font-size: 14px;
}

/* 聊天弹窗 */
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
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  background: #fff;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 2px solid #000;
  background: #fafafa;
}

.chat-avatar {
  width: 40px;
  height: 40px;
  border: 2px solid #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 12px;
}

.chat-info {
  flex: 1;
}

.chat-name {
  font-size: 14px;
  font-weight: bold;
  margin: 0;
}

.chat-npc-tag {
  font-size: 9px;
  opacity: 0.5;
  color: #666;
}

.close-chat-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  opacity: 0.5;
}

.close-chat-btn:hover {
  opacity: 1;
}

.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  min-height: 200px;
}

.message {
  margin-bottom: 12px;
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
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 13px;
  line-height: 1.4;
  position: relative;
}

.user-message .message-content {
  background: #000;
  color: #fff;
  border-radius: 16px 16px 4px 16px;
}

.bot-message .message-content {
  background: #f5f5f5;
  color: #000;
  border-radius: 16px 16px 16px 4px;
}

.chat-input-area {
  display: flex;
  padding: 12px 16px;
  border-top: 2px solid #000;
  gap: 8px;
}

.chat-input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid #000;
  border-radius: 20px;
  font-size: 13px;
  outline: none;
}

.send-btn {
  padding: 10px 20px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
}

/* 互动说明 */
.info-section {
  margin-top: auto;
}

.info-card {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 4px;
  text-align: center;
}

.info-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.info-text {
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 8px;
}

.info-list {
  list-style: none;
  font-size: 11px;
  opacity: 0.6;
  text-align: left;
  padding-left: 16px;
}

.info-list li {
  margin-bottom: 4px;
}

/* 手绘边框样式 */
.hand-drawn-border {
  border: 2.5px solid #000;
  border-radius: 4px;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.1);
}

.modal-overlay {
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

.modal-content {
  background: #fff;
  border: 2.5px solid #000;
  border-radius: 4px;
  padding: 20px;
  max-width: 320px;
  width: 90%;
}
</style>