/**
 * agent.js - Agent API 路由
 */

import express from 'express';
import { agentRegistry } from '../services/agent/core/index.js';
import { APlusDesigner, KeywordMaster, VideoCreator } from '../services/agent/agents/index.js';
import { imageGenerationTool, textGenerationTool } from '../services/agent/tools/index.js';
import { toolRegistry } from '../services/agent/core/index.js';

const router = express.Router();

// 初始化：注册工具和 Agents
function initializeAgents() {
  // 注册工具
  toolRegistry.register('imageGeneration', imageGenerationTool);
  toolRegistry.register('textGeneration', textGenerationTool);
  
  // 注册 Agents
  agentRegistry.register(new APlusDesigner());
  agentRegistry.register(new KeywordMaster());
  agentRegistry.register(new VideoCreator());
  
  console.log('[Agent API] Agents initialized');
}

// 获取所有 Agent 列表
router.get('/agents', (req, res) => {
  try {
    const agents = agentRegistry.list();
    res.json({
      success: true,
      agents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 获取单个 Agent 信息
router.get('/agents/:id', (req, res) => {
  try {
    const agent = agentRegistry.get(req.params.id);
    res.json({
      success: true,
      agent: agent.getInfo(),
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// 主对话接口
router.post('/chat', async (req, res) => {
  try {
    const { agentId, message, images = [], context = {} } = req.body;
    
    if (!agentId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentId, message',
      });
    }
    
    console.log(`[Agent API] Chat request: ${agentId}, message: ${message.slice(0, 50)}...`);
    
    const result = await agentRegistry.handle(agentId, {
      message,
      images,
      context,
    });
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Agent API] Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 工具执行接口
router.post('/tools/:toolName', async (req, res) => {
  try {
    const { toolName } = req.params;
    const params = req.body;
    
    const result = await toolRegistry.execute(toolName, params);
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 获取工具列表
router.get('/tools', (req, res) => {
  try {
    const tools = toolRegistry.list();
    res.json({
      success: true,
      tools,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 初始化
initializeAgents();

export default router;
