/**
 * Chain.js - 链式执行引擎
 * 复用 LangChain 的 Chain 概念，但极简实现
 */

export class Chain {
  constructor(steps, options = {}) {
    this.steps = steps; // [{ name, fn, description }]
    this.name = options.name || 'UnnamedChain';
    this.onStepStart = options.onStepStart || (() => {});
    this.onStepEnd = options.onStepEnd || (() => {});
  }

  /**
   * 执行链
   * @param {any} input - 初始输入
   * @param {object} context - 共享上下文
   * @returns {Promise<any>} - 最终结果
   */
  async run(input, context = {}) {
    let result = input;
    const executionLog = [];

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      
      try {
        // 通知步骤开始
        this.onStepStart({
          chain: this.name,
          step: i + 1,
          total: this.steps.length,
          stepName: step.name,
          description: step.description,
        });

        console.log(`[Chain:${this.name}] Step ${i + 1}/${this.steps.length}: ${step.name}`);

        // 执行步骤
        const stepResult = await step.fn(result, context);
        
        // 如果步骤返回结果，更新 result
        if (stepResult !== undefined) {
          result = stepResult;
        }

        executionLog.push({
          step: step.name,
          status: 'success',
          timestamp: Date.now(),
        });

        // 通知步骤完成
        this.onStepEnd({
          chain: this.name,
          step: i + 1,
          total: this.steps.length,
          stepName: step.name,
          status: 'success',
        });

      } catch (error) {
        console.error(`[Chain:${this.name}] Step ${step.name} failed:`, error);
        
        executionLog.push({
          step: step.name,
          status: 'error',
          error: error.message,
          timestamp: Date.now(),
        });

        this.onStepEnd({
          chain: this.name,
          step: i + 1,
          total: this.steps.length,
          stepName: step.name,
          status: 'error',
          error: error.message,
        });

        throw error;
      }
    }

    return {
      result,
      context,
      executionLog,
    };
  }

  /**
   * 创建条件分支链
   */
  static branch(condition, trueChain, falseChain) {
    return {
      name: 'Branch',
      fn: async (input, context) => {
        const conditionResult = await condition(input, context);
        if (conditionResult) {
          return await trueChain.run(input, context);
        } else {
          return await falseChain.run(input, context);
        }
      },
    };
  }

  /**
   * 创建并行执行链
   */
  static parallel(steps) {
    return {
      name: 'Parallel',
      fn: async (input, context) => {
        const results = await Promise.all(
          steps.map(step => step.fn(input, context))
        );
        return results;
      },
    };
  }
}

export default Chain;
