/**
 * 工作流注册中心
 * 负责管理和加载所有工作流配置
 */

import type { WorkflowConfig } from './types/config';
import { WorkflowLogger } from './utils/logger';

/**
 * Workflow module mapping
 * Note: try-on uses legacy WorkflowView.vue, not included here
 */
const workflowModules: Record<string, () => Promise<{ default: WorkflowConfig }>> = {
    'marketing': () => import('./marketing/config'),
    // Add new workflows here
};

/**
 * 工作流注册中心类
 */
class WorkflowRegistry {
    private workflows = new Map<string, WorkflowConfig>();
    private loggers = new Map<string, WorkflowLogger>();

    /**
     * 获取工作流配置
     * @param type 工作流类型
     * @returns 工作流配置对象
     */
    async getWorkflow(type: string): Promise<WorkflowConfig> {
        // 从缓存中获取
        if (this.workflows.has(type)) {
            return this.workflows.get(type)!;
        }

        // 检查是否存在
        const loader = workflowModules[type];
        if (!loader) {
            throw new Error(`工作流类型 "${type}" 未找到`);
        }

        // 动态加载
        const module = await loader();
        const config = module.default;

        // 验证配置
        this.validateConfig(config);

        // 缓存配置
        this.workflows.set(type, config);

        // 创建日志器
        const logger = new WorkflowLogger(config.id);
        this.loggers.set(type, logger);
        logger.logConfigLoad(config);

        return config;
    }

    /**
     * 获取所有工作流类型
     */
    getAllTypes(): string[] {
        return Object.keys(workflowModules);
    }

    /**
     * 获取所有工作流配置（用于首页展示）
     */
    async getAllWorkflows(): Promise<WorkflowConfig[]> {
        const types = this.getAllTypes();
        return Promise.all(types.map(type => this.getWorkflow(type)));
    }

    /**
     * 获取工作流日志器
     */
    getLogger(type: string): WorkflowLogger | undefined {
        return this.loggers.get(type);
    }

    /**
     * 验证工作流配置
     */
    private validateConfig(config: WorkflowConfig): void {
        const errors: string[] = [];

        if (!config.id) errors.push('缺少工作流 ID');
        if (!config.name) errors.push('缺少工作流名称');
        if (!config.inputPanel) errors.push('缺少 inputPanel 配置');
        if (!config.configPanel) errors.push('缺少 configPanel 配置');
        if (!config.canvas) errors.push('缺少 canvas 配置');
        if (!config.service) errors.push('缺少 service 类');

        if (errors.length > 0) {
            throw new Error(
                `工作流配置验证失败 (${config.id || 'unknown'}):\n${errors.join('\n')}`
            );
        }
    }

    /**
     * 清除缓存
     */
    clearCache(type?: string): void {
        if (type) {
            this.workflows.delete(type);
            this.loggers.delete(type);
        } else {
            this.workflows.clear();
            this.loggers.clear();
        }
    }
}

// 导出单例
export const workflowRegistry = new WorkflowRegistry();
