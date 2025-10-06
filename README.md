# 个人主页 - 单页面应用

一个现代化的个人主页，采用单页面应用设计，包含AI助手对话功能。

## 功能特性

### 🎨 设计特色
- **响应式设计** - 完美适配桌面端、平板和手机
- **现代UI** - 采用卡片式设计，柔和渐变背景
- **流畅动画** - 滚动动画、悬停效果、页面过渡
- **优雅配色** - 2-3种主色调，保持视觉协调

### 📱 页面结构
1. **导航栏** - 固定顶部，半透明背景，移动端汉堡菜单
2. **英雄区** - 个人介绍和照片展示
3. **AI助手引导** - 醒目的AI对话功能入口
4. **照片轮播** - 全宽度轮播器，支持触摸滑动
5. **关于我** - 个人介绍和技能展示
6. **作品集** - 网格布局，点击查看详情
7. **联系表单** - 简洁的联系表单
8. **页脚** - 社交媒体链接

### 🤖 AI助手功能
- **智能对话** - 模拟AI助手回复
- **打字机效果** - AI回复逐字显示
- **对话历史** - 保存和导出对话记录
- **清空功能** - 一键清空对话历史
- **全屏模态框** - 沉浸式对话体验

### 🎯 交互功能
- **平滑滚动** - 点击导航链接平滑滚动到对应区域
- **返回顶部** - 滚动时显示返回顶部按钮
- **模态框** - 作品集详情弹窗展示
- **表单验证** - 联系表单基础验证
- **通知系统** - 操作反馈通知

## 技术栈

- **HTML5** - 语义化标签，无障碍访问
- **CSS3** - Flexbox/Grid布局，CSS变量，动画效果
- **JavaScript (ES6+)** - 原生JS，无框架依赖
- **Font Awesome** - 图标库 (CDN)
- **Google Fonts** - Inter字体 (CDN)

## 使用方法

1. **直接打开** - 双击 `index.html` 文件在浏览器中打开
2. **本地服务器** - 使用任何本地服务器运行
3. **自定义内容** - 修改HTML中的个人信息和图片链接

### 启用真实 AI 对话（智谱AI/OPENAI）

已内置后端服务 `server.js` 暴露 `POST /api/chat`。优先使用智谱AI(大模型)；未配置时回退 OpenAI。

1) 安装依赖

```
npm install
```

2) 配置环境变量（二选一或同时配置）

- PowerShell 临时生效：

```
$env:ZHIPU_API_KEY = "<你的智谱API Key>"
$env:ZHIPU_MODEL = "glm-4.6"
$env:OPENAI_API_KEY = "<可选：你的OpenAI Key>"
$env:OPENAI_MODEL = "gpt-4o-mini"
$env:CORS_ORIGIN = "http://localhost:5500"
$env:PORT = "8787"
```

- 或在项目根目录新建 `.env`：

```
ZHIPU_API_KEY=<你的智谱API Key>
ZHIPU_MODEL=glm-4.6
OPENAI_API_KEY=<可选：你的OpenAI Key>
OPENAI_MODEL=gpt-4o-mini
CORS_ORIGIN=http://localhost:5500
PORT=8787
```

3) 启动后端

```
npm run dev
```

4) 打开前端页面

- 使用任意本地静态服务器预览 `index.html`（如 VSCode Live Server）。
- 确保访问地址与 `CORS_ORIGIN` 一致（例如 `http://localhost:5500`）。
- 页面内 AI 对话窗口将调用 `/api/chat` 实时回复。

接口说明：`POST /api/chat`，请求体：

```
{
  "messages": [
    { "role": "system", "content": "你是一个友好的中文AI助手" },
    { "role": "user", "content": "你好" }
  ]
}
```

安全建议：不要把密钥提交到代码库，使用环境变量或 `.env` 文件本地保存。

## 自定义指南

### 个人信息修改
在 `index.html` 中修改以下内容：
- 姓名：`<h2>您的名字</h2>`
- 职业：`<p class="hero-subtitle">前端开发工程师 | UI/UX设计师</p>`
- 个人介绍：`<p class="hero-description">...</p>`
- 联系方式：邮箱、电话、地址

### 图片替换
替换以下图片链接：
- 个人照片：`src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"`
- 轮播图片：轮播区域的4张图片
- 作品集图片：作品集网格中的图片

### 颜色主题
在 `style.css` 的 `:root` 中修改CSS变量：
```css
:root {
    --primary-color: #667eea;    /* 主色调 */
    --secondary-color: #764ba2;  /* 辅助色 */
    --accent-color: #f093fb;     /* 强调色 */
}
```

### 技能标签
在 `index.html` 的 `.skills-grid` 中修改技能项：
```html
<div class="skill-item">
    <i class="fab fa-html5"></i>
    <span>HTML5</span>
</div>
```

## 浏览器兼容性

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ 移动端浏览器

## 性能优化

- **CDN资源** - 使用CDN加载字体和图标
- **图片优化** - 使用Unsplash的优化图片服务
- **防抖处理** - 滚动事件防抖优化
- **懒加载** - 图片和动画按需加载
- **压缩资源** - CSS和JS代码优化

## 部署建议

1. **静态托管** - 可直接部署到GitHub Pages、Netlify、Vercel
2. **CDN加速** - 建议使用CDN加速静态资源
3. **HTTPS** - 确保使用HTTPS协议
4. **压缩** - 生产环境建议压缩CSS和JS文件

## 许可证

MIT License - 可自由使用和修改

## 联系方式

如有问题或建议，欢迎通过以下方式联系：
- 邮箱：your.email@example.com
- GitHub：your-github-username

---

**享受您的个人主页！** 🚀

