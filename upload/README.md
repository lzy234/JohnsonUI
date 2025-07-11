# 强生—AI手术复盘助手

这是一个基于 Figma 设计实现的 AI 手术复盘助手界面，用于上传手术视频和完善手术信息。

## 项目结构

```
upload/
├── index.html          # 主页面
├── styles.css          # 样式文件
├── script.js           # 交互功能
├── images/             # 图标资源
│   ├── arrow_back.svg
│   ├── arrow_drop_down.svg
│   ├── check_circle.svg
│   ├── check_circle_small.svg
│   ├── movie_info.svg
│   ├── play_arrow.svg
│   ├── subscriptions.svg
│   └── tab_search.svg
└── README.md           # 项目说明
```

## 功能特性

### 🎥 视频选择
- 显示已上传的手术视频列表
- 支持视频项目的选择切换
- 显示视频详细信息（文件大小、时长、上传时间）

### 📝 手术信息表单
- 医生和医院信息（只读）
- 术式选择（下拉菜单）
- 必填项验证：出血量、BMI、年龄、性别
- 性别单选按钮交互

### ✅ 表单验证
- 实时字段验证
- 必填项检查
- 错误状态提示
- 提交前完整性验证

### 🎨 视觉效果
- 忠实还原 Figma 设计
- 玻璃拟态（Glassmorphism）效果
- 渐变背景和边框
- 悬浮和点击动画
- 响应式布局

## 使用方法

1. 直接在浏览器中打开 `index.html` 文件
2. 选择要分析的手术视频
3. 完善手术信息表单
4. 点击"提交并开始分析"按钮

## 技术实现

- **HTML5**: 语义化结构
- **CSS3**: 
  - Flexbox 布局
  - CSS Grid
  - 玻璃拟态效果
  - 渐变和动画
  - 响应式设计
- **JavaScript (ES6+)**:
  - 事件处理
  - 表单验证
  - DOM 操作
  - 状态管理

## 浏览器兼容性

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 设计规范

- 容器宽度: 390px (移动端)
- 主色调: #EB1700 (强生红)
- 字体: PingFang SC
- 圆角: 8px-48px
- 阴影: 多层次玻璃效果

## 开发者信息

基于 Figma 设计文件实现：
- 文件名: 强生—AI手术复盘助手
- 页面: 02.上传视频和信息
- 设计尺寸: 390x1241px 