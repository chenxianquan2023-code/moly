/**
 * 工作流服务相关类型定义
 */

/**
 * 工作流执行上下文
 */
export interface WorkflowExecutionContext {
    workflowId: string;
    inputData: Record<string, any>;
    configData: Record<string, any>;
    metadata?: Record<string, any>;
}

/**
 * 工作流执行结果
 */
export interface WorkflowExecutionResult {
    success: boolean;
    data?: any;
    error?: Error;
    metadata?: {
        duration: number;
        timestamp: number;
        [key: string]: any;
    };
}

/**
 * 进度回调函数
 */
export type ProgressCallback = (progress: number, message?: string) => void;

/**
 * 工作流状态
 */
export const WorkflowStatus = {
    IDLE: 'idle',
    VALIDATING: 'validating',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
} as const;

export type WorkflowStatus = typeof WorkflowStatus[keyof typeof WorkflowStatus];
