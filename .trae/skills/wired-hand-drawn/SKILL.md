---
name: wired-hand-drawn
description: 使用 Wired-Elements + 自定义手绘样式生成纯手绘线条风前端界面，所有组件自动变成手绘质感，风格统一
usage: 生成前端页面、重构页面、美化UI、编写Vue组件/JS/CSS/MD文档
---

# 手绘风强制规则（Wired-Elements + 自定义样式）

## 核心原则

**所有 UI 元素必须使用 `<wired-*>` 组件，禁止用 div + CSS 模拟手绘风格。**

## 1. 组件映射表（强制）

| UI 元素 | 必须使用的组件 | 禁止的做法 |
|---------|--------------|-----------|
| 按钮 | `<wired-button>` | `<button>` 或 `<div>` + CSS 边框 |
| 图标按钮 | `<wired-icon-button>` | `<button>` + CSS 边框 |
| 卡片容器 | `<wired-card>` | `<div>` + `border: 2px solid #000` |
| 面板容器 | `<wired-card>` | `<div>` + CSS 双层边框 |
| 输入框 | `<wired-input>` | `<input>` |
| 文本域 | `<wired-textarea>` | `<textarea>` |
| 复选框 | `<wired-checkbox>` | `<input type="checkbox">` |
| 单选框 | `<wired-radio>` | `<input type="radio">` |
| 下拉框 | `<wired-combo>` | `<select>` |
| 进度条 | `<wired-progress>` | `<div>` + CSS 渐变进度条 |
| 分割线 | `<wired-divider>` | `<hr>` 或 `<div>` + CSS 边框 |
| 开关 | `<wired-toggle>` | 自定义开关 |
| 弹窗 | `<wired-dialog>` | `<div>` + CSS 弹窗 |
| 加载 | `<wired-spinner>` | 自定义加载动画 |
| 浮动按钮 | `<wired-fab>` | 自定义浮动按钮 |
| 链接 | `<wired-link>` | `<a>` 标签 |
| 图片 | `<wired-image>` | `<img>` 标签 |

## 2. 组件使用示例

### 2.1 wired-card（替代所有卡片 div）
```html
<!-- ✅ 正确：使用 wired-card，通过 fill 属性设置背景色 -->
<wired-card fill="#ffffff">
  <div class="card-content">
    ...
  </div>
</wired-card>

<!-- ✅ 正确：浅灰背景卡片 -->
<wired-card fill="#fafafa">
  ...
</wired-card>

<!-- ❌ 错误：用 div 模拟 -->
<div class="npc-card" style="border: 2px solid #000; border-radius: 4px;">
  ...
</div>

<!-- ❌ 错误：用 CSS background 设置 wired-card 背景（Shadow DOM 隔离无效） -->
<wired-card class="my-card" style="background: #fff;">
  ...
</wired-card>
```

### 2.2 wired-progress（替代所有进度条 div）
```html
<!-- ✅ 正确：使用 wired-progress -->
<wired-progress :value="energyPercent" style="flex: 1;"></wired-progress>

<!-- ❌ 错误：用 div 模拟 -->
<div class="attr-bar">
  <div class="attr-fill energy" :style="{ width: energyPercent + '%' }"></div>
</div>
```

### 2.3 wired-button（替代所有按钮）
```html
<!-- ✅ 正确 -->
<wired-button @click="handleClick">点击</wired-button>

<!-- ❌ 错误 -->
<button class="btn-standard" @click="handleClick">点击</button>
```

### 2.4 wired-divider（替代所有分割线）
```html
<!-- ✅ 正确 -->
<wired-divider></wired-divider>

<!-- ❌ 错误 -->
<hr>
<div style="border-top: 2px solid #000;"></div>
```

### 2.5 wired-dialog（替代弹窗 div）
```html
<!-- ✅ 正确 -->
<wired-dialog :open="showDialog">
  <div class="dialog-content">...</div>
</wired-dialog>

<!-- ❌ 错误 -->
<div v-if="showDialog" class="modal-overlay">
  <div class="modal-content">...</div>
</div>
```

## 3. 字体规范

### 3.1 全局字体引入
在 HTML 头部引入 Google 开源中文字体 Ma Shan Zheng 和英文字体 Indie Flower：
```html
<link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Indie+Flower&display=swap" rel="stylesheet">
```

### 3.2 字体应用
```css
body {
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive;
}

wired-button, wired-card, wired-input, wired-textarea, wired-combo {
  font-family: 'Ma Shan Zheng', 'Indie Flower', cursive !important;
}
```

## 4. 配色规范

- 主背景：白色 `#ffffff`
- 卡片背景：浅灰 `#fafafa`
- 文字颜色：深灰 `#1a1a1a`
- 强调色：避免花哨颜色，保持黑白灰为主
- 禁止使用高饱和度渐变色
- **卡片背景色必须通过 `fill` 属性设置**，不可用 CSS `background`

## 5. 布局规范

- 使用普通 `div` + `flex` / `grid` 布局
- 样式干净、宽松、留白充足
- 组件间距：`16px` - `24px`
- 内边距：`16px` - `20px`

## 6. 全局 CSS 覆盖规则

项目已在 `main.css` 中设置了以下全局覆盖，编写组件 CSS 时需注意：

```css
/* wired-card 默认 display: block, padding: 0 */
/* 需要 flex 布局时加 !important */
.my-card {
  display: flex !important;
  flex-direction: column;
  padding: 16px;
}

/* wired-progress 默认 width: 100%, height: 24px */
/* wired-button 已取消 text-transform: uppercase */
```

## 7. 仅允许的自定义 CSS（wired 组件内部布局用）

以下 CSS 仅用于 wired 组件内部的布局调整，**不得用于模拟手绘边框**：

```css
/* ✅ 允许：wired-card 内部的 flex 布局（需 !important 覆盖全局） */
.card-content {
  display: flex !important;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

/* ❌ 禁止：给 div 加手绘边框 */
.my-card {
  border: 2px solid #000;  /* 禁止！用 wired-card */
  border-radius: 4px;       /* 禁止！用 wired-card */
}

/* ❌ 禁止：给 wired-card 设置 background（Shadow DOM 无效） */
wired-card {
  background: #fff;  /* 无效！用 fill 属性 */
}
```

## 8. 禁止事项

- **禁止** 使用 `div` + CSS 边框模拟手绘卡片 → 用 `<wired-card>`
- **禁止** 使用 `div` + CSS 渐变模拟进度条 → 用 `<wired-progress>`
- **禁止** 使用 `<button>` 或 `<div>` 模拟按钮 → 用 `<wired-button>`
- **禁止** 使用 `<hr>` 或 div 边框模拟分割线 → 用 `<wired-divider>`
- **禁止** 使用 div 模拟弹窗 → 用 `<wired-dialog>`
- **禁止** 使用 `::before` 伪元素模拟双层边框
- **禁止** 使用 CSS `background` 设置 wired-card 背景色 → 用 `fill` 属性
- **禁止** 嵌套 wired-card（内层改用普通 div）
- **禁止** 使用 Material Design、Ant Design 等现代 UI 框架风格
- **禁止** 使用圆角过大（> 8px）的设计
- **禁止** 使用复杂阴影效果
- **禁止** 使用高饱和度渐变色
- **禁止** 使用花哨的动画效果