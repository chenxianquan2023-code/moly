/**
 * 工作流服务抽象基类
 * 所有工作流服务都需要继承此类
 */

import type {
    WorkflowExecutionContext,
    WorkflowExecutionResult,
    ProgressCallback
} from '../types/service';

export abstract class WorkflowService {
    protected progressCallback?: ProgressCallback;
    protected isCancelled = false;

    /**
     * 设置进度回调
     */
    setProgressCallback(callback: ProgressCallback): void {
        this.progressCallback = callback;
    }

    /**
     * 更新进度
     */
    protected updateProgress(progress: number, message?: string): void {
        if (this.progressCallback) {
            this.progressCallback(progress, message);
        }
    }

    /**
     * 验证输入数据（必须实现）
     * @throws Error 验证失败时抛出错误
     */
    abstract validate(context: WorkflowExecutionContext): Promise<boolean>;

    /**
     * 执行工作流（必须实现）
     */
    abstract execute(context: WorkflowExecutionContext): Promise<WorkflowExecutionResult>;

    /**
     * 生命周期钩子：开始前
     */
    async onStart?(context: WorkflowExecutionContext): Promise<void>;

    /**
     * 生命周期钩子：完成后
     */
    async onComplete?(result: WorkflowExecutionResult): Promise<void>;

    /**
     * 生命周期钩子：错误时
     */
    async onError?(error: Error): Promise<void>;

    /**
     * 取消执行
     */
    async cancel(): Promise<void> {
        this.isCancelled = true;
    }

    /**
     * 检查是否已取消
     */
    protected checkCancellation(): void {
        if (this.isCancelled) {
            throw new Error('Workflow execution cancelled');
        }
    }
}
