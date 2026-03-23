/**
 * 工作流执行引擎
 * 
 * 负责解析和执行节点工作流
 */

import { imageAnalysisService } from '../atomic/imageAnalysis.service'
import { imageGenerationService } from '../atomic/imageGeneration.service'
import { promptBuilderService } from '../atomic/promptBuilder.service'

export type NodeType = 
  | 'input'
  | 'analysis'
  | 'generation'
  | 'upscale'
  | 'enhance'
  | 'output'

export interface WorkflowNode {
  id: string
  type: NodeType
  inputs: Record<string, any>
  params: Record<string, any>
  outputs?: Record<string, any>
  status?: 'pending' | 'running' | 'completed' | 'error'
  error?: string
}

export interface WorkflowEdge {
  from: string
  to: string
  inputKey: string
}

export interface WorkflowExecutionResult {
  success: boolean
  results: Map<string, any>
  errors: Map<string, string>
  executionTime: number
}

export type ProgressCallback = (progress: number, message: string, currentNode: string) => void

export class WorkflowRunner {
  /**
   * 拓扑排序：确定节点执行顺序
   */
  private topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
    const graph = new Map<string, string[]>()
    const inDegree = new Map<string, number>()

    // 初始化
    nodes.forEach(node => {
      graph.set(node.id, [])
      inDegree.set(node.id, 0)
    })

    // 构建图
    edges.forEach(edge => {
      const neighbors = graph.get(edge.from) || []
      neighbors.push(edge.to)
      graph.set(edge.from, neighbors)
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1)
    })

    // Kahn算法
    const queue: string[] = []
    const result: WorkflowNode[] = []

    nodes.forEach(node => {
      if (inDegree.get(node.id) === 0) {
        queue.push(node.id)
      }
    })

    while (queue.length > 0) {
      const nodeId = queue.shift()!
      const node = nodes.find(n => n.id === nodeId)!
      result.push(node)

      const neighbors = graph.get(nodeId) || []
      neighbors.forEach(neighborId => {
        const newDegree = (inDegree.get(neighborId) || 0) - 1
        inDegree.set(neighborId, newDegree)
        if (newDegree === 0) {
          queue.push(neighborId)
        }
      })
    }

    if (result.length !== nodes.length) {
      throw new Error('工作流包含循环依赖，无法执行')
    }

    return result
  }

  /**
   * 执行单个节点
   */
  private async executeNode(
    node: WorkflowNode,
    context: Map<string, any>
  ): Promise<any> {
    console.log(`[WorkflowRunner] Executing node: ${node.id} (${node.type})`)

    switch (node.type) {
      case 'input':
        // 输入节点直接返回输入值
        return node.inputs.image || node.inputs.value

      case 'analysis':
        // 分析节点
        const inputImage = context.get(node.inputs.sourceNode)
        const analysisType = node.params.analysisType || 'generic'
        return await imageAnalysisService.analyze(inputImage, analysisType)

      case 'generation':
        // 生成节点
        const mode = node.params.mode || 'custom'
        const prompt = node.params.prompt || ''
        const refImages = node.params.referenceImages || []
        
        // 解析引用图片
        const resolvedImages = refImages.map((ref: string) => context.get(ref))
        
        const result = await imageGenerationService.generate(
          mode,
          prompt,
          resolvedImages,
          {
            aspectRatio: node.params.aspectRatio,
            imageSize: node.params.imageSize,
            temperature: node.params.temperature
          }
        )
        
        if (!result.success) {
          throw new Error(result.error)
        }
        return result.imageUrl

      case 'upscale':
        // 放大节点
        const sourceImage = context.get(node.inputs.sourceNode)
        const scale = node.params.scale || 2
        const upscaleResult = await imageGenerationService.upscale(
          sourceImage,
          scale,
          { imageSize: scale === 4 ? '4K' : '2K' }
        )
        
        if (!upscaleResult.success) {
          throw new Error(upscaleResult.error)
        }
        return upscaleResult.imageUrl

      case 'output':
        // 输出节点
        return context.get(node.inputs.sourceNode)

      default:
        throw new Error(`未知的节点类型: ${node.type}`)
    }
  }

  /**
   * 执行工作流
   */
  async execute(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    onProgress?: ProgressCallback
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now()
    const results = new Map<string, any>()
    const errors = new Map<string, string>()

    try {
      // 1. 拓扑排序
      const sortedNodes = this.topologicalSort(nodes, edges)
      const totalNodes = sortedNodes.length

      // 2. 按顺序执行节点
      for (let i = 0; i < sortedNodes.length; i++) {
        const node = sortedNodes[i]
        const progress = Math.round((i / totalNodes) * 100)
        
        node.status = 'running'
        onProgress?.(progress, `正在执行: ${node.type}`, node.id)

        try {
          const output = await this.executeNode(node, results)
          results.set(node.id, output)
          node.status = 'completed'
          node.outputs = { result: output }
        } catch (error) {
          node.status = 'error'
          const errorMsg = error instanceof Error ? error.message : '执行失败'
          node.error = errorMsg
          errors.set(node.id, errorMsg)
          throw error
        }
      }

      onProgress?.(100, '执行完成', 'output')

      return {
        success: errors.size === 0,
        results,
        errors,
        executionTime: Date.now() - startTime
      }

    } catch (error) {
      console.error('[WorkflowRunner] Workflow execution failed:', error)
      return {
        success: false,
        results,
        errors,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * 验证工作流是否有效
   */
  validate(nodes: WorkflowNode[], edges: WorkflowEdge[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 检查是否有输入节点
    const hasInput = nodes.some(n => n.type === 'input')
    if (!hasInput) {
      errors.push('工作流必须包含至少一个输入节点')
    }

    // 检查是否有输出节点
    const hasOutput = nodes.some(n => n.type === 'output')
    if (!hasOutput) {
      errors.push('工作流必须包含至少一个输出节点')
    }

    // 检查节点ID唯一性
    const ids = nodes.map(n => n.id)
    const uniqueIds = new Set(ids)
    if (ids.length !== uniqueIds.size) {
      errors.push('节点ID必须唯一')
    }

    // 检查边的引用是否有效
    edges.forEach(edge => {
      if (!nodes.find(n => n.id === edge.from)) {
        errors.push(`边的起始节点不存在: ${edge.from}`)
      }
      if (!nodes.find(n => n.id === edge.to)) {
        errors.push(`边的目标节点不存在: ${edge.to}`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// 导出单例
export const workflowRunner = new WorkflowRunner()
export default WorkflowRunner
