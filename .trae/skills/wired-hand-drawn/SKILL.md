---
name: wired-hand-drawn
description: 使用 Wired-Elements + 自定义手绘样式生成纯手绘线条风前端界面，所有组件自动变成手绘质感，风格统一
usage: 生成前端页面、重构页面、美化UI、编写Vue组件/JS/CSS/MD文档
---

# 手绘风强制规则（Wired-Elements + 自定义样式）

## 1. 组件使用规范

### 1.1 Wired-Elements 组件（优先使用）
所有交互组件必须使用 `<wired-*>` 标签：
- 按钮 → `<wired-button>`
- 卡片 → `<wired-card>`
- 输入框 → `<wired-input>`
- 复选框 → `<wired-checkbox>`
- 单选框 → `<wired-radio>`
- 下拉框 → `<wired-combo>`
- 文本域 → `<wired-textarea>`
- 面板 → `<wired-panel>`
- 分割线 → `<wired-divider>`
- 开关 → `<wired-toggle>`
- 进度条 → `<wired-progress>`

### 1.2 自定义手绘组件（Wired-Elements 未覆盖时）
对于 wired-elements 未覆盖的组件，使用项目已有的手绘样式类或按以下规范自定义：

**通用样式类：**
- `.hand-drawn-border` - 手绘边框效果（双层边框 + 轻微偏移）
- `.sketch-font` - 手写字体（用于标题、标签等）
- `.click-feedback` - 点击反馈效果（按下时位移 2px）
- `.modal-overlay` - 弹窗遮罩层
- `.modal-content` - 弹窗内容框
- `.hide-scrollbar` - 隐藏滚动条但保持滚动功能

**自定义组件必须遵循的样式规范：**
- 边框：`2.5px solid #000` + 伪元素双层边框效果
- 圆角：`border-radius: 4px`
- 背景：白色或浅灰 `#fafafa`
- 阴影：无阴影，纯线条风格
- 交互：点击时 `transform: translate(2px, 2px)`

## 2. 字体规范

### 2.1 全局字体引入
在 HTML 头部引入 Google 开源中文字体 Ma Shan Zheng 和英文字体 Indie Flower：
```html
<link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Indie+Flower&display=swap" rel="stylesheet">
```

### 2.2 字体应用
- `body` 和所有 `wired-*` 组件使用 `Ma Shan Zheng` 作为中文字体，`Indie Flower` 作为英文/数字字体
- 确保中文显示具有原生手绘质感，英文和数字圆润可爱
- fallback 到 `cursive`

CSS 示例：
```css
body {
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}

wired-button, wired-card, wired-input, wired-textarea, wired-combo {
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive !important;
}
```

## 3. 输出格式

### 3.1 Vue 单文件组件
- 输出 `.vue` 文件，包含 `<template>`、`<script setup>`、`<style scoped>`
- 使用 Vue 3 Composition API
- 样式使用 scoped 避免污染全局

### 3.2 其他文件类型
根据项目实际情况输出对应格式：
- `.js` - JavaScript 逻辑文件
- `.css` - 全局样式文件
- `.md` - 文档说明文件
- `.html` - 入口 HTML 文件（如需要引入 CDN）

## 4. 配色规范

- 主背景：白色 `#ffffff`
- 卡片背景：浅灰 `#fafafa`
- 文字颜色：深灰 `#1a1a1a`（非纯黑，稍微柔和）
- 强调色：避免花哨颜色，保持黑白灰为主
- 渐变色：增加灰度，不要太亮（详见各组件规范）

## 5. 布局规范

- 使用普通 `div` + `flex` / `grid` 布局
- 样式干净、宽松、留白充足
- 组件间距：`16px` - `24px`
- 内边距：`16px` - `20px`
- 移动端适配：使用 `@media` 查询

## 6. 组件样式规范

### 6.1 按钮类组件

**标准按钮（白底黑字 + 边框）：**
```css
.btn-standard {
  background-color: #fff;
  color: #000;
  border: 2px solid #000;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.1s ease;
  font-family: 'Ma Shan Zheng', 'Comic Sans MS', cursive;
}

.btn-standard:active:not(:disabled) {
  transform: translate(2px, 2px);
}

.btn-standard:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**触发按钮（用于主要操作，如触发事件）：**
```css
.trigger-btn {
  background-color: #fff;
  color: #000;
  border: 2.5px solid #000;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.1s ease;
  font-family: 'Ma Shan Zheng', 'Comic Sans MS', cursive;
}

.trigger-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
}

.trigger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**祈祷按钮（用于祈祷操作）：**
```css
.prayer-btn {
  background-color: #fff;
  color: #000;
  border: 2.5px solid #000;
  padding: 16px 32px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 18px;
  cursor: pointer;
  transition: transform 0.1s ease;
  font-family: 'Ma Shan Zheng', 'Comic Sans MS', cursive;
}

.prayer-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
}

.prayer-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 6.2 卡片类组件

**NPC 卡片：**
```css
.npc-card {
  background: #fafafa;
  border: 2.5px solid #000;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
}

.npc-card::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 1px solid #000;
  border-radius: 6px;
  pointer-events: none;
  opacity: 0.3;
}
```

**关系卡片：**
```css
.relation-card {
  background: #fafafa;
  border: 2.5px solid #000;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 12px;
}

.relation-card.worshipping {
  background: #f0f0f0;
  border-color: #666;
}
```

**好友列表项：**
```css
.friend-item {
  background: #fff;
  border: 2.5px solid #000;
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}
```

### 6.3 列表类组件

**标签：**
```css
.tag {
  display: inline-block;
  padding: 2px 8px;
  background: #f0f0f0;
  border: 1px solid #000;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 4px;
}
```

**徽章/角标：**
```css
.badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background: #f44336;
  color: #fff;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}
```

### 6.4 弹窗类组件

**遮罩层：**
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
```

**内容框：**
```css
.modal-content {
  background-color: #fff;
  border: 2.5px solid #000;
  border-radius: 4px;
  padding: 20px;
  max-width: 300px;
  width: 90%;
}
```

### 6.5 状态类组件

**进度条（增加灰度的渐变色）：**
```css
.progress-bar {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8a9bb5, #9a85a8);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  opacity: 0.6;
  white-space: nowrap;
  font-family: 'Ma Shan Zheng', 'Comic Sans MS', cursive;
}
```

**属性条（能量/活力显示，增加灰度的渐变色）：**
```css
.attr-bar {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.attr-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.attr-fill.energy {
  background: linear-gradient(90deg, #7a9a6d, #8fa87a);
}

.attr-fill.vitality {
  background: linear-gradient(90deg, #c48a4a, #d4a85a);
}

.attr-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.attr-name {
  font-size: 12px;
  opacity: 0.6;
  white-space: nowrap;
  font-family: 'Ma Shan Zheng', 'Comic Sans MS', cursive;
}

.attr-value {
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
  min-width: 24px;
  text-align: right;
  font-family: 'Ma Shan Zheng', 'Comic Sans MS', cursive;
}
```

**骨架屏加载（闪烁减慢 50%）：**
```css
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

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 常见骨架屏变体 */
.skeleton-trigger { height: 80px; }
.skeleton-attr-bar { display: flex; gap: 24px; }
.skeleton-attr-item { flex: 1; height: 20px; }
.skeleton-history { display: flex; flex-direction: column; gap: 12px; }
.skeleton-history-item { height: 100px; }
.skeleton-npc-card { height: 120px; }
.skeleton-friend-item { height: 60px; }
.skeleton-faith { height: 100px; }
.skeleton-prayer { height: 150px; }
.skeleton-relations { display: flex; flex-direction: column; gap: 12px; }
.skeleton-relation { height: 100px; }
```

## 7. 禁止事项

- 禁止使用原生 `button`、`input`、`card` 等组件（除非 wired-elements 不支持）
- 禁止使用 Material Design、Ant Design 等现代 UI 框架风格
- 禁止使用圆角过大（> 8px）的设计
- 禁止使用复杂阴影效果
- 禁止使用高饱和度渐变色（必须增加灰度）
- 禁止使用花哨的动画效果（骨架屏闪烁除外）
