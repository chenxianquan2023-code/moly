# Moly Agent 架构定义文档

## 1. Agent 核心概念

### 1.1 什么是 Agent？

Agent 是一个能够**理解用户意图**、**收集必要信息**、**调用工具完成任务**的 AI 助手。

核心能力：
- **对话理解**：理解用户的自然语言输入
- **信息收集**：通过提问获取缺失的必要信息
- **工具调用**：调用图片生成、文本生成等工具
- **结果输出**：格式化输出结果，支持迭代优化

### 1.2 Agent 与 Chatbot 的区别

| Chatbot | Agent |
|---------|-------|
| 一问一答 | 多轮对话，主动提问 |
| 被动响应 | 主动引导用户 |
| 单次交互 | 状态保持，上下文理解 |
| 仅文本回复 | 可调用工具，生成图片/视频等 |

---

## 2. Agent 架构定义

### 2.1 核心组件

```
┌─────────────────────────────────────────────────────────────┐
│                        Agent 架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1. 输入层 (Input Layer)                             │   │
│  │  ├─ 用户消息 (文本)                                  │   │
│  │  ├─ 图片上传                                         │   │
│  │  └─ 上下文 (历史对话、已收集信息)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  2. 理解层 (Understanding Layer)                     │   │
│  │  ├─ 意图识别：用户想做什么？                         │   │
│  │  ├─ 实体提取：产品类型、卖点等                       │   │
│  │  └─ 信息完整性检查：是否缺少必需信息？               │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│           ┌───────────────┴───────────────┐                 │
│           │                               │                 │
│           ▼                               ▼                 │
│  ┌─────────────────────┐    ┌─────────────────────────┐    │
│  │  信息不完整         │    │  信息完整               │    │
│  │                     │    │                         │    │
│  │  生成问题 → 提问    │    │  生成执行计划 → 执行    │    │
│  └─────────────────────┘    └─────────────────────────┘    │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  3. 执行层 (Execution Layer)                         │   │
│  │  ├─ 调用工具（图片生成、文本生成等）                 │   │
│  │  ├─ 调用其他 Agent（协作）                           │   │
│  │  └─ 执行 Chain（链式操作）                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  4. 输出层 (Output Layer)                            │   │
│  │  ├─ 格式化结果                                       │   │
│  │  ├─ 展示给用户                                       │   │
│  │  └─ 保存上下文（用于下一轮对话）                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Agent 实现规范

### 3.1 Agent 定义结构

```typescript
interface AgentConfig {
  // 基础信息
  id: string;                    // 唯一标识，如 'a-plus-designer'
  name: string;                  // 显示名称，如 'A+设计师'
  description: string;           // 功能描述
  avatar: string;                // 头像 emoji，如 '🎨'
  
  // 系统提示词
  systemPrompt: string;          // 定义 Agent 的角色和能力
  
  // 信息收集配置
  requiredFields: string[];      // 必需字段列表
  questionTemplates: {           // 问题模板
    [field: string]: {
      text: string;              // 问题文本
      options?: string[];        // 选项（可选）
    }
  };
  
  // 工具配置
  tools: string[];               // 可用工具列表
  
  // LLM 配置
  llmService: LLMService;        // 使用的 LLM 服务
}
```

### 3.2 Agent 生命周期

```
初始化 (new Agent())
    │
    ▼
接收输入 (handle(input))
    │
    ├──► 信息收集阶段
    │      ├── 检查 requiredFields
    │      ├── 如缺失，调用 generateQuestion()
    │      └── 返回 question 类型响应
    │
    └──► 执行阶段（信息完整后）
           ├── 调用 createExecutionPlan()
           ├── 调用 executePlan()
           └── 返回 result 类型响应
```

### 3.3 具体 Agent 定义示例

#### A+设计师 Agent

```javascript
// server/services/agent/agents/APlusDesigner.js

import { BaseAgent } from '../core/BaseAgent.js';
import { claudeService } from '../../../services/llm/ClaudeService.js';

export class APlusDesigner extends BaseAgent {
  constructor() {
    super({
      // 基础信息
      id: 'a-plus-designer',
      name: 'A+设计师',
      description: '专业的亚马逊A+页面设计师，擅长视觉排版和转化优化',
      avatar: '🎨',
      
      // 系统提示词 - 定义 Agent 的角色
      systemPrompt: `你是专业的亚马逊A+页面设计师，拥有丰富的电商设计经验。

你的职责：
1. 分析产品卖点和目标受众
2. 规划A+页面结构（主图、场景图、信息图、对比图等）
3. 协调其他Agent完成图片和文案
4. 输出完整的A+页面方案

设计原则：
- 突出产品核心卖点
- 视觉层次清晰
- 符合亚马逊A+页面规范
- 提高转化率

你必须收集以下信息才能开始设计：
- productType: 产品类型
- sellingPoints: 核心卖点
- targetAudience: 目标受众（可选，默认"通用"）
- brandStyle: 品牌风格（可选，默认"简约现代"）`,

      // 必需字段
      requiredFields: ['productType', 'sellingPoints'],
      
      // 问题模板
      questionTemplates: {
        productType: {
          text: '这是什么类型的产品？',
          options: ['数码电子', '家居用品', '服装配饰', '美妆护肤', '户外运动', '其他'],
        },
        sellingPoints: {
          text: '产品的核心卖点是什么？（可多选）',
          options: ['高品质', '性价比', '创新设计', '便携', '耐用', '多功能', '环保', '其他'],
        },
        targetAudience: {
          text: '目标受众是谁？',
          options: ['商务人士', '学生', '家庭主妇', '户外爱好者', '科技爱好者', '其他'],
        },
        brandStyle: {
          text: '希望呈现什么样的品牌风格？',
          options: ['简约现代', '高端奢华', '活力年轻', '专业可靠', '温馨亲切', '其他'],
        },
      },
      
      // 可用工具
      tools: ['imageGeneration', 'textGeneration'],
      
      // LLM 服务
      llmService: claudeService,
    });
  }

  /**
   * 创建执行计划
   * 当信息收集完整后，制定具体的执行步骤
   */
  async createExecutionPlan(message, context) {
    // 可以直接返回预设计划，也可以调用 LLM 生成动态计划
    return {
      steps: [
        {
          type: 'transform',
          description: '分析产品信息',
          fn: async () => ({
            analysis: {
              productType: context.productType,
              sellingPoints: context.sellingPoints,
              targetAudience: context.targetAudience || '通用受众',
              brandStyle: context.brandStyle || '简约现代',
            }
          }),
        },
        {
          type: 'transform',
          description: '规划A+页面结构',
          fn: async (input, ctx) => {
            const layout = await this.planLayout(input.analysis);
            ctx.layout = layout;
            return input;
          },
        },
        {
          type: 'tool',
          tool: 'textGeneration',
          params: {
            type: 'a-plus-copy',
            productInfo: context,
          },
          description: '生成A+页面文案',
        },
        {
          type: 'transform',
          description: '生成图片需求列表',
          fn: async (input, ctx) => {
            const imageRequirements = await this.generateImageRequirements(
              ctx.layout, 
              context
            );
            ctx.imageRequirements = imageRequirements;
            return input;
          },
        },
      ],
      expectedOutput: '完整的A+页面设计方案，包括文案和图片需求',
    };
  }

  /**
   * 规划页面布局
   */
  async planLayout(analysis) {
    const prompt = `
基于以下产品信息，规划亚马逊A+页面结构：
产品类型：${analysis.productType}
核心卖点：${analysis.sellingPoints}
目标受众：${analysis.targetAudience}
品牌风格：${analysis.brandStyle}

请返回 JSON 格式的页面结构：
{
  "sections": [
    {
      "type": "hero|lifestyle|infographic|comparison|specs",
      "title": "区块标题",
      "description": "区块描述",
      "images": [{ "type": "主图|场景图|信息图", "description": "图片描述" }],
      "copy": "文案要点"
    }
  ]
}`;

    return await claudeService.generateJSON(prompt);
  }

  /**
   * 生成图片需求
   */
  async generateImageRequirements(layout, context) {
    const images = [];
    
    for (const section of layout.sections) {
      if (section.images) {
        for (const img of section.images) {
          images.push({
            section: section.type,
            type: img.type,
            description: img.description,
            style: context.brandStyle,
          });
        }
      }
    }
    
    return images;
  }

  /**
   * 格式化结果
   */
  formatResult(result) {
    return {
      type: 'a-plus-design',
      layout: result.layout,
      copy: result.copy,
      imageRequirements: result.imageRequirements,
      summary: `已为您规划 ${result.layout.sections.length} 个区块的A+页面方案`,
    };
  }
}
```

---

## 4. Agent 注册和使用

### 4.1 注册 Agent

```javascript
// server/routes/agent.js

import { agentRegistry } from '../services/agent/core/index.js';
import { APlusDesigner } from '../services/agent/agents/APlusDesigner.js';
import { KeywordMaster } from '../services/agent/agents/KeywordMaster.js';

// 初始化时注册
function initializeAgents() {
  agentRegistry.register(new APlusDesigner());
  agentRegistry.register(new KeywordMaster());
  // ... 注册其他 Agent
}
```

### 4.2 使用 Agent

```javascript
// 处理用户消息
const result = await agentRegistry.handle('a-plus-designer', {
  message: '我要做充电宝的A+页面',
  images: [],
  context: {},
});

// 返回结果
{
  type: 'question',           // 或 'result'
  content: '这是什么类型的产品？',
  options: ['数码电子', '家居用品', ...],
  field: 'productType',
  context: { ... },
}
```

---

## 5. Agent 扩展指南

### 5.1 创建新 Agent 的步骤

1. **创建文件** `server/services/agent/agents/YourAgent.js`

2. **继承 BaseAgent**
   ```javascript
   import { BaseAgent } from '../core/BaseAgent.js';
   
   export class YourAgent extends BaseAgent {
     constructor() {
       super({
         id: 'your-agent',
         name: '你的Agent',
         // ... 配置
       });
     }
   }
   ```

3. **定义必需字段和问题模板**

4. **实现 createExecutionPlan 方法**

5. **注册到 AgentRegistry**

### 5.2 Agent 配置模板

```javascript
export class NewAgent extends BaseAgent {
  constructor() {
    super({
      // 1. 基础信息
      id: 'new-agent',
      name: '新Agent',
      description: '描述这个Agent的功能',
      avatar: '🤖',
      
      // 2. 系统提示词
      systemPrompt: `你是...`,
      
      // 3. 必需字段
      requiredFields: ['field1', 'field2'],
      
      // 4. 问题模板
      questionTemplates: {
        field1: {
          text: '问题文本',
          options: ['选项1', '选项2'], // 可选
        },
      },
      
      // 5. 工具
      tools: ['tool1', 'tool2'],
      
      // 6. LLM
      llmService: claudeService,
    });
  }
  
  // 7. 执行计划
  async createExecutionPlan(message, context) {
    return {
      steps: [
        // 定义执行步骤
      ],
    };
  }
}
```

---

## 6. Agent 协作机制（未来扩展）

### 6.1 Agent 调用 Agent

```javascript
// APlusDesigner 调用 KeywordMaster
async createExecutionPlan(message, context) {
  return {
    steps: [
      {
        type: 'agent',
        agentId: 'keyword-master',
        params: { productType: context.productType },
        description: '生成关键词',
      },
      {
        type: 'transform',
        fn: async (input, ctx) => {
          // 使用关键词结果
          const keywords = ctx.keywordMasterResult;
          // ...
        },
      },
    ],
  };
}
```

### 6.2 工作流编排

```javascript
// 定义跨 Agent 的工作流
const workflow = {
  name: '完整Listing创建',
  steps: [
    { agent: 'keyword-master', output: 'keywords' },
    { agent: 'listing-writer', input: ['keywords'], output: 'copy' },
    { agent: 'a-plus-designer', input: ['copy'], output: 'design' },
  ],
};
```

---

## 7. 当前实现状态

### 7.1 已完成的 Agent

| Agent | 状态 | 功能 |
|-------|------|------|
| APlusDesigner | ✅ 已实现 | A+页面设计 |
| KeywordMaster | ✅ 已实现 | 关键词优化 |
| VideoCreator | ✅ 已实现 | 视频创作 |

### 7.2 待实现的功能

- [ ] Agent 间协作调用
- [ ] 工作流可视化编排
- [ ] 自定义 Agent（用户可配置）
- [ ] Agent 性能监控
- [ ] Agent 版本管理

---

**文档版本**: v1.0
**更新时间**: 2026-03-23
