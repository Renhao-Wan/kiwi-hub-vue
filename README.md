# KiwiHub Vue 前端社交应用

基于 Vue 3 + Vite 构建的现代化社交内容分享平台的 C 端 Web 应用。

## 技术栈

- **框架**: Vue 3 (Composition API + `<script setup>`)
- **构建工具**: Vite 5.x
- **路由**: Vue Router 4.x
- **状态管理**: Pinia 2.x
- **UI 组件库**: Element Plus 2.x
- **HTTP 客户端**: Axios 1.x
- **语言**: JavaScript (ES6+)

## 项目结构

```
kiwi-hub-vue-frontend/
├── public/                      # 静态资源
├── src/
│   ├── api/                     # API 接口层
│   │   ├── user.js             # 用户服务接口
│   │   ├── content.js          # 内容服务接口
│   │   └── link.js             # 短链接服务接口
│   ├── assets/                  # 资源文件
│   │   ├── styles/             # 全局样式
│   │   └── images/             # 图片资源
│   ├── components/              # 组件
│   │   ├── common/             # 公共组件
│   │   └── business/           # 业务组件
│   ├── layout/                  # 布局组件
│   ├── router/                  # 路由配置
│   ├── store/                   # 状态管理
│   │   ├── index.js            # Pinia 实例
│   │   └── modules/            # Store 模块
│   ├── utils/                   # 工具函数
│   ├── views/                   # 页面组件
│   ├── App.vue                  # 根组件
│   └── main.js                  # 应用入口
├── .env.development             # 开发环境变量
├── .env.production              # 生产环境变量
├── vite.config.js              # Vite 配置
└── package.json
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:5173 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 环境变量

- `VITE_API_BASE_URL`: 后端 API 基地址

## 核心功能

- 用户认证与授权（注册、登录、登出）
- 文章信息流浏览与搜索
- 文章发布与详情查看
- 点赞互动功能
- 评论系统（一级评论 + 楼中楼回复）
- 短链接生成工具
- 个人主页与资料编辑
- 响应式设计与移动端适配

## 后端 API

后端服务地址: http://47.109.26.32:80

## 开发规范

- 使用 Vue 3 Composition API 和 `<script setup>` 语法
- 使用 JavaScript (ES6+)，不使用 TypeScript
- 组件命名使用 PascalCase
- 文件命名使用 kebab-case
- 遵循 ESLint 代码规范

## License

MIT
