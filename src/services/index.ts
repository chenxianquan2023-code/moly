/**
 * 服务层统一导出
 * 
 * 集中导出所有服务，方便使用
 */

// HTTP 基础服务
export { http } from './http'

// Agent 服务
export { agentService, AgentService } from './agent.service'

// 底层 AI 服务
export { geminiService, GeminiService } from './gemini.service'

// 原子能力服务
export { 
    imageAnalysisService, 
    ImageAnalysisService,
    type AnalysisType,
    type AnalysisResult 
} from './atomic/imageAnalysis.service'

export { 
    imageGenerationService, 
    ImageGenerationService,
    type GenerationMode,
    type GenerationOptions,
    type GenerationResult 
} from './atomic/imageGeneration.service'

export { 
    promptBuilderService, 
    PromptBuilderService,
    type PromptTemplate 
} from './atomic/promptBuilder.service'

// 编排服务
export { 
    workflowRunner, 
    WorkflowRunner,
    type WorkflowNode,
    type WorkflowEdge,
    type WorkflowExecutionResult,
    type ProgressCallback as WorkflowProgressCallback
} from './orchestration/workflowRunner.service'

// 业务服务
export { tryOnService, TryOnService } from './tryOn.service'
export { soraService, SoraService } from './sora.service'

// 默认导出
export { default as GeminiServiceDefault } from './gemini.service'
export { default as ImageAnalysisServiceDefault } from './atomic/imageAnalysis.service'
export { default as ImageGenerationServiceDefault } from './atomic/imageGeneration.service'
export { default as PromptBuilderServiceDefault } from './atomic/promptBuilder.service'
export { default as WorkflowRunnerDefault } from './orchestration/workflowRunner.service'
export { default as TryOnServiceDefault } from './tryOn.service'
export { default as SoraServiceDefault } from './sora.service'
export { default as AgentServiceDefault } from './agent.service'
