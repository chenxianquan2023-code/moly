# 架构扩展性分析报告：从单一业务到通用工作流

## 1. 现状评估

当前代码库 (`WorkflowView.vue` 和 `tryOn.service.ts`) 是为了 **"虚拟试穿 (Virtual Try-On)"** 这一特定场景而构建的 "MVP (最小可行性产品)"。

### 主要问题
*   **高耦合 (High Coupling)**: `WorkflowView` 直接依赖了 `inputs.model` 和 `inputs.garment` 这样的特定数据结构，且直接调用了 `tryOnService.quickGenerate`。
*   **硬编码逻辑 (Hardcoded Logic)**: 节点的连接关系和数据流向在代码中是静态定义的（例如 `edges` 初始值），而不是由图数据驱动的动态执行。
*   **单一服务职责**: `TryOnService` 封装了完整的业务流程（分析->生成），这对于单一功能很好，但对于通用工作流来说，它是一个 "黑盒"，无法拆分为可复用的单元（如："图片分析节点"、"提示词组合节点"、"生成节点"）。

---

## 2. 模块通用性分析

如果未来要扩展 IP 生成、周边生成、图片放大等功能，现有模块的复用情况如下：

### ✅ 可通用模块 (Reusable)

1.  **基础设施 (Infrastructure)**
    *   **GeminiService**: 底层的 AI 接口封装（`generateImage`, `generateContent`）是可以完全复用的。它是所有 AI 能力的基础。
    *   **Vue Flow Setup**: 画布配置、背景、控制栏 (`Zoom controls`)、基础拖拽交互都是通用的。

2.  **UI 组件 (High-Level UI)**
    *   **Layout**: Header, Sidebar 的布局结构。
    *   **基础组件**: 如上传组件的样式 (`.upload-area`) 可以抽象为通用的 `FileUploader` 组件。

### ❌ 不可通用 / 需重构模块 (Specific / Needs Refactoring)

1.  **业务服务 (`TryOnService`)**
    *   **现状**: 这是一个“大一统”的服务，专门处理试穿。
    *   **问题**: 如果要做 "图片放大"，你不能复用 `analyzeGarmentImage` 或 `generateTryOn`。
    *   **建议**: 需要将 Service 拆解为颗粒度更细的 **"原子能力 (Atomic Capabilities)"**。例如 `ImageAnalysisService`（通用图片分析）、`ImageGenerationService`（通用文生图/图生图）。

2.  **视图逻辑 (`WorkflowView.vue`)**
    *   **现状**: 左侧面板硬编码了 "模特图输入" 和 "服装图输入"。右侧面板硬编码了 "动作" 和 "光影" 配置。
    *   **问题**: "图片放大" 不需要服装输入，也不需要动作配置，只需要一张原图和一个放大倍数配置。
    *   **建议**: 左侧和右侧面板通过 **"当前选中的节点"** 动态渲染。
        *   选中 "输入节点" -> 左侧显示上传。
        *   选中 "配置节点" -> 右侧显示参数表单。

3.  **节点组件 (`ImageNode`, `ConfigNode`)**
    *   **现状**: `ConfigNode` 里面写死了动作、背景保留等字段。
    *   **建议**: 节点组件应当是 "哑组件 (Dumb Components)"，只负责显示 `data` 中的内容。特定的配置表单应该由 JSON Schema 动态生成，或者针对不同类型节点开发不同的组件（如 `UpscaleConfigNode`, `IpGenConfigNode`）。

---

## 3. 架构改进建议 (The "Engine" Approach)

为了支持无限扩展的功能（IP, Upscale, Video...），你需要从 **"特定页面"** 转向 **"工作流引擎"** 架构。

### 第一阶段：数据结构抽象
不要把输入存为 `inputs.model`，而是抽象为图数据的一部分。

```typescript
// 未来的数据结构示例
interface WorkflowGraph {
  nodes: Node[];
  edges: Edge[];
  globalConfig: any;
}

// 节点定义不再是简单的 UI 元素，而是包含逻辑定义
interface NodeData {
  type: 'input_image' | 'llm_analysis' | 'image_gen' | 'upscale';
  inputs: Record<string, any>; // 端口输入
  params: Record<string, any>; // 用户配置
  output?: any;                // 执行结果
}
```

### 第二阶段：执行引擎 (Execution Engine)
创建一个通用的 `WorkflowRunner`，替代 `tryOnService.quickGenerate`。

*   **当前**: `Button Click` -> `TryOnService.run()`
*   **未来**: `Button Click` -> `WorkflowRunner.execute(nodes, edges)`

`WorkflowRunner` 会遍历节点：
1.  找到起始节点 (Input)。
2.  沿着 Edge 找到下一个节点 (e.g., Upscale Node)。
3.  调用对应的 **Node Processor** (执行器)。
4.  将结果传递给下一个节点。

### 总结
目前的架构对于 **单一功能的 Demo** 是合理的（开发快，逻辑直观）。
但如果你要打造一个 **Moly 平台**，目前的架构是 **不可扩展** 的。下一次加功能时，你不得不复制一份 `WorkflowView` 并改名为 `UpscaleView`，这会导致代码难以维护。

**建议下一步行动**：
1.  **保留现状**作为 "V1.0 试穿版"。
2.  **另外开启**重构，将 `WorkflowView` 改造为通用的 `EditorView`，左侧面板改为 "节点库 (Node Library)"，允许用户拖拽不同类型的节点（图像输入、放大、风格化...）到画布上。
