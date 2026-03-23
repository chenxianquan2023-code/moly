/**
 * config/index.js - 配置管理
 */

export const config = {
  // API Keys
  claudeApiKey: process.env.CLAUDE_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  
  // 服务配置
  port: process.env.PORT || 3001,
  
  // Agent 配置
  agent: {
    defaultLLM: 'claude',
    maxContextLength: 10, // 保留最近10条对话
  },
  
  // 积分配置
  credits: {
    textGeneration: 1,    // 3000字 = 1积分
    imageGeneration: 10,  // 1张图 = 10积分
    videoGeneration: 50,  // 1个视频 = 50积分
  },
};

export default config;
