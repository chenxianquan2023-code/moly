/**
 * 工作流日志系统
 */

export class WorkflowLogger {
    private workflowId: string;

    constructor(workflowId: string) {
        this.workflowId = workflowId;
    }

    /**
     * 记录配置加载
     */
    logConfigLoad(config: any): void {
        console.group(`[Workflow:${this.workflowId}] Config Loaded`);
        console.table({
            'Input Sections': config.inputPanel?.sections?.length || 0,
            'Config Groups': config.configPanel?.groups?.length || 0,
            'Canvas Nodes': config.canvas?.nodes?.length || 0,
            'Canvas Edges': config.canvas?.edges?.length || 0
        });
        console.groupEnd();
    }

    /**
     * 记录字段渲染
     */
    logFieldRender(componentType: string, fieldId: string): void {
        console.log(
            `[Workflow:${this.workflowId}] Rendering ${componentType} for field "${fieldId}"`
        );
    }

    /**
     * 记录验证
     */
    logValidation(isValid: boolean, errors?: Record<string, string>): void {
        if (isValid) {
            console.log(`[Workflow:${this.workflowId}] ✓ Validation passed`);
        } else {
            console.warn(`[Workflow:${this.workflowId}] ✗ Validation failed:`, errors);
        }
    }

    /**
     * 记录执行开始
     */
    logExecutionStart(context: any): void {
        console.group(`[Workflow:${this.workflowId}] Execution Started`);
        console.log('Input Data:', context.inputData);
        console.log('Config Data:', context.configData);
        console.groupEnd();
    }

    /**
     * 记录执行完成
     */
    logExecutionComplete(result: any): void {
        const duration = result.metadata?.duration || 0;
        console.log(
            `[Workflow:${this.workflowId}] ✓ Execution completed in ${duration}ms`
        );
    }

    /**
     * 记录错误
     */
    logError(context: string, error: Error, additionalInfo?: any): void {
        console.error(`[Workflow:${this.workflowId}] Error in ${context}:`, {
            message: error.message,
            stack: error.stack,
            ...additionalInfo
        });
    }

    /**
     * 记录进度
     */
    logProgress(progress: number, message?: string): void {
        const progressBar = '▓'.repeat(Math.floor(progress / 10)) +
            '░'.repeat(10 - Math.floor(progress / 10));
        console.log(
            `[Workflow:${this.workflowId}] [${progressBar}] ${progress}% ${message || ''}`
        );
    }
}
