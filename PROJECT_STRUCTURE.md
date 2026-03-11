/**
 * Omni-Gen 项目结构
 * 
 * 优化后的完整项目架构
 */

src/
├── api/                          # API 层
│   ├── index.ts                  # 统一导出
│   ├── client.ts                 # HTTP 客户端封装
│   ├── auth.ts                   # 认证相关 API
│   ├── ai.ts                     # AI 生成相关 API
│   └── user.ts                   # 用户相关 API
│
├── assets/                       # 静态资源
│
├── components/                   # 组件层
│   ├── index.ts                  # 统一导出
│   ├── ImageUpload.vue           # 图片上传组件
│   ├── ProgressBar.vue           # 进度条组件
│   ├── ImagePreview.vue          # 图片预览组件
│   ├── EmptyState.vue            # 空状态组件
│   └── LoadingSkeleton.vue       # 骨架屏组件
│
├── composables/                  # 组合式函数
│   ├── index.ts                  # 统一导出
│   ├── useLoading.ts             # 加载状态管理
│   ├── useToast.ts               # 消息提示管理
│   ├── usePagination.ts          # 分页管理
│   └── useDebounce.ts            # 防抖处理
│
├── config/                       # 配置文件
│   └── ai.config.ts              # AI 相关配置
│
├── layout/                       # 布局组件
│   ├── MainLayout.vue
│   ├── ToolsLayout.vue
│   └── WorkbenchLayout.vue
│
├── router/                       # 路由配置
│   └── index.ts
│
├── services/                     # 服务层
│   ├── index.ts                  # 统一导出
│   ├── gemini.service.ts         # Gemini AI 服务
│   ├── sora.service.ts           # Sora 视频服务
│   ├── tryOn.service.ts          # 虚拟试穿服务（重构版）
│   ├── atomic/                   # 原子能力服务
│   │   ├── imageAnalysis.service.ts
│   │   ├── imageGeneration.service.ts
│   │   └── promptBuilder.service.ts
│   └── orchestration/            # 编排服务
│       └── workflowRunner.service.ts
│
├── stores/                       # 状态管理
│   ├── index.ts                  # 统一导出
│   ├── auth.ts                   # 用户认证状态
│   ├── workflow.ts               # 工作流状态
│   ├── asset.ts                  # 资产库状态
│   ├── tool.ts                   # 工具定义状态
│   └── task.ts                   # 任务队列状态
│
├── types/                        # 类型定义
│   └── ai.types.ts               # AI 相关类型
│
├── utils/                        # 工具函数
│   ├── index.ts                  # 统一导出
│   ├── errorHandler.ts           # 错误处理
│   ├── imageUtils.ts             # 图片处理
│   ├── common.ts                 # 通用工具
│   └── guards.ts                 # 类型守卫
│
├── views/                        # 页面视图
│   ├── HomeView.vue
│   ├── LoginView.vue
│   ├── RegisterView.vue
│   ├── ToolsView.vue
│   ├── WorkbenchView.vue
│   ├── WorkflowView.vue
│   └── tools/                    # 工具页面
│       ├── AssetsView.vue
│       ├── TemplatesView.vue
│       ├── HistoryView.vue
│       └── ...
│
├── workflows/                    # 工作流定义
│
├── App.vue                       # 根组件
├── main.ts                       # 入口文件
└── style.css                     # 全局样式
