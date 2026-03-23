# Moly

**AI-powered e-commerce assistant platform with Agent support**

Moly 是一个面向跨境电商的 AI 助手平台，通过 Agent 架构让用户通过自然对话完成电商创作任务。

---

## 🏗️ 系统架构

### 整体架构（前后端分离）

```
┌─────────────────────────────────────────────────────────────────┐
│                           前端 (Frontend)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Vue 3 + TypeScript + Vite                               │  │
│  │  ├─ AgentChatView.vue      # Agent 对话主界面            │  │
│  │  ├─ AgentSelector.vue      # Agent 选择器                │  │
│  │  ├─ ChatThread.vue         # 对话历史展示                │  │
│  │  ├─ ResultPreview.vue      # 结果预览                    │  │
│  │  └─ WorkflowView.vue       # 工作流编辑器（原有）        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           │ HTTP API / WebSocket               │
│                           ▼                                     │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                           后端 (Backend)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Node.js + Express                                       │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  Agent Orchestrator Layer                          │ │  │
│  │  │  ├─ AgentRegistry    # Agent 注册管理              │ │  │
│  │  │  ├─ ToolRegistry     # 工具注册管理                │ │  │
│  │  │  └─ Chain            # 链式执行引擎                │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  Agent Layer (业务逻辑层)                          │ │  │
│  │  │  ├─ APlusDesigner    # A+页面设计 Agent            │ │  │
│  │  │  ├─ KeywordMaster    # 关键词优化 Agent            │ │  │
│  │  │  ├─ VideoCreator     # 视频创作 Agent              │ │  │
│  │  │  └─ ListingWriter    # 文案撰写 Agent              │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  Tool Layer (工具层)                               │ │  │
│  │  │  ├─ ImageGenerationTool   # 图片生成               │ │  │
│  │  │  ├─ TextGenerationTool    # 文本生成               │ │  │
│  │  │  └─ VideoGenerationTool   # 视频生成               │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  LLM Service Layer                                 │ │  │
│  │  │  ├─ ClaudeService    # Claude API 封装             │ │  │
│  │  │  └─ GeminiService    # Gemini API 封装             │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  Infrastructure Layer                              │ │  │
│  │  │  ├─ Auth Service     # 认证服务                    │ │  │
│  │  │  ├─ Upload Service   # 文件上传                    │ │  │
│  │  │  └─ Credit Service   # 积分系统                    │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤖 Agent 架构详解

### 核心设计理念

Moly 采用 **"类 LangChain" 轻量级 Agent 架构**：
- 复用 LangChain 的设计思想（Chain、Agent、Tool）
- 但保持代码简洁可控，不引入复杂依赖
- 垂直领域优化，专门针对电商场景

### Agent 运行流程

```
用户输入
    │
    ▼
┌─────────────────────────────────────────┐
│  1. 信息收集阶段 (Information Gathering) │
│     - 检查必需字段是否齐全              │
│     - 如缺失，向用户提问                │
│     - 支持选项式/开放式提问             │
└─────────────────────────────────────────┘
    │
    ▼ (信息齐全后)
┌─────────────────────────────────────────┐
│  2. 执行计划阶段 (Execution Planning)    │
│     - 分析用户意图                      │
│     - 制定执行步骤                      │
│     - 确定需要调用的工具                │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  3. 工具执行阶段 (Tool Execution)        │
│     - 调用图片生成工具                  │
│     - 调用文本生成工具                  │
│     - 调用其他 Agent（协作）            │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  4. 结果输出阶段 (Result Output)         │
│     - 格式化输出结果                    │
│     - 展示给用户                        │
│     - 支持迭代优化                      │
└─────────────────────────────────────────┘
```

### Agent 类型

| Agent | 职责 | 输入 | 输出 |
|-------|------|------|------|
| **A+设计师** | 设计亚马逊 A+ 页面 | 产品类型、卖点、受众 | 页面结构、图片需求、文案 |
| **关键词大师** | SEO 关键词优化 | 产品类型、功能 | 核心词、长尾词、后台词 |
| **短视频摄影师** | 制作产品短视频 | 产品信息、用途 | 视频脚本、分镜、素材需求 |
| **文案策划** | 撰写 Listing 文案 | 产品信息、风格 | 标题、五点描述、详情页 |

### 核心类说明

#### 1. Chain（链式执行引擎）
```javascript
// 顺序执行多个步骤
const chain = new Chain([
  { name: 'analyze', fn: async (input, ctx) => { ... } },
  { name: 'generate', fn: async (input, ctx) => { ... } },
  { name: 'format', fn: async (input, ctx) => { ... } },
]);

const result = await chain.run(input, context);
```

#### 2. BaseAgent（Agent 基类）
```javascript
class MyAgent extends BaseAgent {
  constructor() {
    super({
      id: 'my-agent',
      name: '我的 Agent',
      requiredFields: ['field1', 'field2'],
      systemPrompt: '...',
    });
  }
  
  // 自定义执行计划
  async createExecutionPlan(message, context) {
    return {
      steps: [
        { type: 'tool', tool: 'imageGeneration', params: {...} },
        { type: 'tool', tool: 'textGeneration', params: {...} },
      ]
    };
  }
}
```

#### 3. ToolRegistry（工具注册表）
```javascript
// 注册工具
toolRegistry.register('imageGeneration', {
  name: 'imageGeneration',
  description: '生成图片',
  parameters: { prompt: 'string', style: 'string' },
  execute: async (params) => {
    return await nanoBananaService.generate(params);
  }
});

// 执行工具
const result = await toolRegistry.execute('imageGeneration', params);
```

---

## 📁 项目结构

```
moly/
├── 📁 server/                    # 后端代码
│   ├── index.js                  # 入口文件
│   ├── routes/
│   │   └── agent.js              # Agent API 路由
│   ├── services/
│   │   ├── agent/
│   │   │   ├── core/             # Agent 核心框架
│   │   │   │   ├── Chain.js
│   │   │   │   ├── BaseAgent.js
│   │   │   │   ├── AgentRegistry.js
│   │   │   │   └── ToolRegistry.js
│   │   │   ├── agents/           # Agent 实现
│   │   │   │   ├── APlusDesigner.js
│   │   │   │   ├── KeywordMaster.js
│   │   │   │   └── VideoCreator.js
│   │   │   └── tools/            # 工具实现
│   │   │       ├── imageTools.js
│   │   │       └── textTools.js
│   │   └── llm/
│   │       └── ClaudeService.js  # LLM 服务
│   └── config/
│       └── index.js
│
├── 📁 src/                       # 前端代码
│   ├── views/
│   │   └── AgentChatView.vue     # Agent 对话界面
│   ├── services/
│   │   ├── agent.service.ts      # Agent API 服务
│   │   └── http.ts               # HTTP 封装
│   ├── stores/
│   │   └── agent.store.ts        # Agent 状态管理
│   └── router/
│       └── index.ts
│
├── 📄 package.json
├── 📄 README.md
└── 📄 .env.example
```

---

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
# 克隆仓库
git clone https://github.com/chenxianquan2023-code/moly.git
cd moly

# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

### 配置环境变量

```bash
# 复制示例配置
cp .env.example .env
cp server/.env.example server/.env

# 编辑 .env 文件，添加你的 API Keys
# CLAUDE_API_KEY=your_claude_api_key
```

### 启动开发服务器

```bash
# 启动后端（端口 3001）
cd server
node index.js

# 启动前端（端口 5173）
npm run dev
```

访问 http://localhost:5173/agent

---

## 📡 API 接口

### 获取 Agent 列表
```http
GET /api/agent/agents
```

### 发送消息
```http
POST /api/agent/chat
Content-Type: application/json

{
  "agentId": "a-plus-designer",
  "message": "我要做充电宝的A+页面",
  "context": {}
}
```

### 响应示例
```json
{
  "success": true,
  "type": "question",
  "content": "这是什么类型的产品？",
  "options": ["数码电子", "家居用品", "其他"],
  "field": "productType"
}
```

---

## 👥 团队协作

### 开发流程

1. **Fork 仓库** 或直接克隆
2. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature
   ```
3. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add xxx"
   git push origin feature/your-feature
   ```
4. **提交 Pull Request** 到 main 分支
5. **Code Review** 后合并

### 分支规范

- `main` - 主分支，稳定版本
- `feature/*` - 功能分支
- `fix/*` - 修复分支
- `docs/*` - 文档分支

### 提交规范

- `feat:` 新功能
- `fix:` 修复
- `docs:` 文档
- `style:` 格式调整
- `refactor:` 重构
- `test:` 测试
- `chore:` 构建/工具

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3, TypeScript, Vite, Pinia |
| 后端 | Node.js, Express |
| AI 模型 | Claude, Gemini |
| 图片生成 | NanoBanana |
| 视频生成 | Seedance |
| 数据库 | （待添加）|
| 部署 | Vercel / 自建服务器 |

---

## 📄 许可证

MIT License

---

## 🤝 贡献者

- [chenxianquan2023-code](https://github.com/chenxianquan2023-code)
- [q86545192](https://github.com/q86545192)

---

## 📞 联系方式

如有问题，请提交 Issue 或联系维护者。
