import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { qw, PROMPTS, PROMPT_TYPES } from '../mastra';
import { streamSSE } from 'hono/streaming';

// 创建自动修复路由
const autoHealingRoutes = new Hono();

// 获取自动修复规则
autoHealingRoutes.get('/rules', (c) => {
  return c.json({ rules: generateMockRules() });
});

// 获取单个规则详情
autoHealingRoutes.get('/rules/:id', (c) => {
  const id = c.req.param('id');
  const rule = generateMockRules().find(r => r.id === id);
  
  if (!rule) {
    return c.json({ error: '规则不存在' }, { status: 404 });
  }
  
  return c.json({ rule });
});

// 创建新规则
autoHealingRoutes.post('/rules', zValidator('json', z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  condition: z.object({
    type: z.enum(['metric', 'log', 'alert']),
    metric: z.string().optional(),
    threshold: z.number().optional(),
    operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte', 'contains']).optional(),
    pattern: z.string().optional(),
  }),
  action: z.object({
    type: z.enum(['restart', 'scale', 'execute', 'notify']),
    service: z.string().optional(),
    command: z.string().optional(),
    scale_to: z.number().optional(),
    retry: z.number().optional(),
  }),
  enabled: z.boolean().default(true),
})), (c) => {
  const body = c.req.valid('json');
  
  // 生成ID和创建时间
  const newRule = {
    id: `rule-${Math.random().toString(36).substring(2, 10)}`,
    ...body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_triggered: null,
    execution_count: 0,
  };
  
  return c.json({ message: '规则创建成功', rule: newRule }, { status: 201 });
});

// 更新规则
autoHealingRoutes.put('/rules/:id', zValidator('json', z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  condition: z.object({
    type: z.enum(['metric', 'log', 'alert']).optional(),
    metric: z.string().optional(),
    threshold: z.number().optional(),
    operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte', 'contains']).optional(),
    pattern: z.string().optional(),
  }).optional(),
  action: z.object({
    type: z.enum(['restart', 'scale', 'execute', 'notify']).optional(),
    service: z.string().optional(),
    command: z.string().optional(),
    scale_to: z.number().optional(),
    retry: z.number().optional(),
  }).optional(),
  enabled: z.boolean().optional(),
})), (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  
  // 在实际应用中会更新数据库
  const updatedRule = {
    id,
    ...body,
    updated_at: new Date().toISOString(),
  };
  
  return c.json({ message: '规则更新成功', rule: updatedRule });
});

// 删除规则
autoHealingRoutes.delete('/rules/:id', (c) => {
  const id = c.req.param('id');
  
  // 在实际应用中会从数据库中删除
  return c.json({ message: `规则 ${id} 已删除` });
});

// 规则执行历史
autoHealingRoutes.get('/history', (c) => {
  return c.json({ history: generateMockRuleHistory() });
});

// 手动触发规则
autoHealingRoutes.post('/rules/:id/trigger', (c) => {
  const id = c.req.param('id');
  const rule = generateMockRules().find(r => r.id === id);
  
  if (!rule) {
    return c.json({ error: '规则不存在' }, { status: 404 });
  }
  
  // 创建执行记录
  const execution = {
    id: `exec-${Math.random().toString(36).substring(2, 10)}`,
    rule_id: id,
    rule_name: rule.name,
    timestamp: new Date().toISOString(),
    status: Math.random() > 0.2 ? 'success' : 'failed',
    execution_time: Math.floor(Math.random() * 2000),
    details: '执行详情...'
  };
  
  return c.json({ 
    message: `规则 ${rule.name} 已手动触发`, 
    execution 
  });
});

// 生成测试数据：规则
function generateMockRules(count = 5) {
  const rules = [];
  
  const conditionTypes = ['metric', 'log', 'alert'];
  const metrics = ['cpu_usage', 'memory_usage', 'disk_space', 'request_latency', 'error_rate'];
  const operators = ['gt', 'lt', 'eq', 'gte', 'lte', 'contains'];
  const actionTypes = ['restart', 'scale', 'execute', 'notify'];
  const services = ['api-service', 'auth-service', 'database', 'cache', 'worker'];
  
  for (let i = 0; i < count; i++) {
    const conditionType = conditionTypes[Math.floor(Math.random() * conditionTypes.length)];
    const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
    
    const rule = {
      id: `rule-${Math.random().toString(36).substring(2, 10)}`,
      name: `自动修复规则 ${i + 1}`,
      description: `当${conditionType}满足条件时，对${actionType}执行操作`,
      condition: {
        type: conditionType,
      },
      action: {
        type: actionType,
        service: services[Math.floor(Math.random() * services.length)],
      },
      enabled: Math.random() > 0.2,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      updated_at: new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)).toISOString(),
      last_triggered: Math.random() > 0.3 ? new Date(Date.now() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000)).toISOString() : null,
      execution_count: Math.floor(Math.random() * 20),
    };
    
    // 根据条件类型填充条件详情
    if (conditionType === 'metric') {
      rule.condition.metric = metrics[Math.floor(Math.random() * metrics.length)];
      rule.condition.threshold = Math.floor(Math.random() * 100);
      rule.condition.operator = operators[Math.floor(Math.random() * (operators.length - 1))]; // 不使用contains
    } else if (conditionType === 'log') {
      rule.condition.pattern = '错误|异常|失败|timeout|error|exception|failed';
      rule.condition.operator = 'contains';
    } else if (conditionType === 'alert') {
      rule.condition.pattern = 'critical|high';
      rule.condition.operator = 'contains';
    }
    
    // 根据操作类型填充操作详情
    if (actionType === 'restart') {
      // 已经有service了
    } else if (actionType === 'scale') {
      rule.action.scale_to = Math.floor(Math.random() * 5) + 1;
    } else if (actionType === 'execute') {
      rule.action.command = 'systemctl restart nginx || docker restart web-server || kubectl rollout restart deployment/frontend';
      rule.action.retry = Math.floor(Math.random() * 3);
    }
    
    rules.push(rule);
  }
  
  return rules;
}

// 生成测试数据：执行历史
function generateMockRuleHistory(count = 10) {
  const history = [];
  const rules = generateMockRules();
  
  for (let i = 0; i < count; i++) {
    const rule = rules[Math.floor(Math.random() * rules.length)];
    const success = Math.random() > 0.3;
    
    history.push({
      id: `exec-${Math.random().toString(36).substring(2, 10)}`,
      rule_id: rule.id,
      rule_name: rule.name,
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      status: success ? 'success' : 'failed',
      execution_time: Math.floor(Math.random() * 2000), // 毫秒
      details: success 
        ? `成功执行操作: ${rule.action.type} 在 ${rule.action.service || 'system'}`
        : `执行失败: ${['权限不足', '服务不可用', '连接超时', '依赖错误'][Math.floor(Math.random() * 4)]}`,
      trigger_condition: {
        type: rule.condition.type,
        details: rule.condition.type === 'metric' 
          ? `${rule.condition.metric} ${rule.condition.operator} ${rule.condition.threshold}`
          : `发现匹配模式: ${rule.condition.pattern}`
      }
    });
  }
  
  // 按时间排序
  return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// 验证自动修复请求
const autoHealingRequestSchema = z.object({
  issue: z.string().min(10, '问题描述太短，无法进行有效分析'),
  systemType: z.enum(['linux', 'windows', 'database', 'web', 'network', 'custom']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  context: z.record(z.unknown()).optional(), // 额外上下文信息
  autoApply: z.boolean().optional(), // 是否自动应用修复
});

// 验证修复方案请求
const repairPlanSchema = z.object({
  planId: z.string().uuid(),
  approve: z.boolean(),
  comments: z.string().optional(),
});

// 模拟修复计划ID生成
function generatePlanId() {
  return 'plan-' + Math.random().toString(36).substring(2, 15);
}

// 预设修复方案
const repairPlans = {
  'high-cpu': {
    id: 'plan-cpu-001',
    issue: '服务器CPU使用率过高',
    diagnosis: '可能存在资源密集型进程或应用程序内存泄漏',
    steps: [
      '1. 识别消耗CPU的进程: `top -c -b -n 1`',
      '2. 分析具体进程详情: `ps aux | grep [PID]`',
      '3. 如为Web服务，检查并限制并发连接: `nginx -s reload`',
      '4. 如为数据库，优化查询或增加连接池'
    ],
    risks: '进程重启可能导致短暂服务中断',
    eta: '5-15分钟'
  },
  'disk-full': {
    id: 'plan-disk-001',
    issue: '磁盘空间不足',
    diagnosis: '日志文件、临时文件或应用数据过大',
    steps: [
      '1. 识别大文件: `find / -type f -size +100M | sort -rh`',
      '2. 清理日志文件: `find /var/log -name "*.log" -mtime +7 -delete`',
      '3. 清理临时文件: `rm -rf /tmp/*`',
      '4. 压缩历史数据'
    ],
    risks: '删除文件操作不可逆，需备份重要数据',
    eta: '10-30分钟'
  },
  'service-down': {
    id: 'plan-service-001',
    issue: '关键服务宕机',
    diagnosis: '服务崩溃、配置错误或依赖服务不可用',
    steps: [
      '1. 检查服务状态: `systemctl status [service]`',
      '2. 检查错误日志: `journalctl -u [service] -n 100`',
      '3. 尝试重启服务: `systemctl restart [service]`',
      '4. 验证服务健康检查'
    ],
    risks: '重启可能无法解决根本问题，需进一步分析',
    eta: '3-10分钟'
  }
};

// 获取常见问题修复方案端点
autoHealingRoutes.get('/common-issues', async (c) => {
  try {
    // 返回预设修复方案列表
    return c.json({
      issues: Object.keys(repairPlans).map(key => {
        const plan = repairPlans[key];
        return {
          id: plan.id,
          issue: plan.issue,
          diagnosis: plan.diagnosis,
          eta: plan.eta
        };
      })
    });
  } catch (error) {
    console.error('获取常见问题修复方案错误:', error);
    return c.json(
      { error: '获取常见问题修复方案失败' },
      { status: 500 }
    );
  }
});

// 根据ID获取具体修复方案端点
autoHealingRoutes.get('/repair-plan/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // 查找匹配的修复方案
    const plan = Object.values(repairPlans).find(p => p.id === id);
    
    if (!plan) {
      return c.json(
        { error: '修复方案不存在' },
        { status: 404 }
      );
    }
    
    return c.json(plan);
  } catch (error) {
    console.error('获取修复方案错误:', error);
    return c.json(
      { error: '获取修复方案失败' },
      { status: 500 }
    );
  }
});

// 提交修复方案执行请求端点
autoHealingRoutes.post('/execute-plan', async (c) => {
  try {
    const body = await c.req.json();
    const result = repairPlanSchema.safeParse(body);
    
    if (!result.success) {
      return c.json(
        { error: '无效请求', details: result.error.format() },
        { status: 400 }
      );
    }
    
    // 使用解构赋值时忽略不需要的参数
    const { planId, approve } = result.data;
    
    if (!approve) {
      return c.json({
        status: 'rejected',
        planId,
        message: '修复方案已被拒绝',
        timestamp: new Date().toISOString()
      });
    }
    
    // 模拟执行修复方案
    return c.json({
      status: 'executing',
      planId,
      message: '修复方案正在执行',
      executionId: 'exec-' + Math.random().toString(36).substring(2, 10),
      startedAt: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 60000).toISOString(),
    });
  } catch (error) {
    console.error('执行修复方案错误:', error);
    return c.json(
      { error: '执行修复方案失败' },
      { status: 500 }
    );
  }
});

// AI分析问题并生成修复方案端点 - 流式响应
autoHealingRoutes.post('/analyze', async (c) => {
  return streamSSE(c, async (stream) => {
    try {
      console.log('接收到自动修复分析请求');
      const body = await c.req.json();
      
      // 验证请求
      const result = autoHealingRequestSchema.safeParse(body);
      if (!result.success) {
        console.error('请求验证失败:', JSON.stringify(result.error.format()));
        await stream.writeSSE({
          data: JSON.stringify({ 
            error: '无效请求',
            details: result.error.format()
          })
        });
        return;
      }
      
      const { issue, systemType = 'linux', severity = 'medium', context = {} } = result.data;
      
      // 生成修复方案ID
      const planId = generatePlanId();
      
      // 构建分析提示
      const analysisPrompt = `
我需要你分析以下系统问题并提供修复方案:
- 问题描述: ${issue}
- 系统类型: ${systemType}
- 严重级别: ${severity}
- 上下文信息: ${JSON.stringify(context)}

请提供详细的修复方案，包括:
1. 问题诊断: 系统问题的可能原因
2. 修复步骤: 逐步详细的修复操作指南
3. 风险评估: 修复操作可能带来的风险和副作用
4. 预防措施: 如何避免此类问题再次发生
5. 恢复方案: 如果修复失败，如何恢复系统
`;

      // 通知开始处理
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'start',
          planId,
          message: '正在分析问题并生成修复方案...',
          timestamp: new Date().toISOString(),
        })
      });
      
      console.log('开始AI分析问题');
      try {
        // 使用千问AI进行分析
        const response = await qw({
          messages: [
            { role: 'system', content: PROMPTS[PROMPT_TYPES.AUTO_HEALING] },
            { role: 'user', content: analysisPrompt }
          ],
          stream: true,
        });
        
        let fullResponse = '';
        
        // 处理流式响应
        for await (const chunk of response) {
          const content = chunk.choices?.[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            await stream.writeSSE({
              data: JSON.stringify({
                type: 'chunk',
                content,
                planId,
                timestamp: new Date().toISOString(),
              })
            });
          }
        }
        
        console.log('AI分析问题完成');
        
        // 提取修复步骤
        const stepRegex = /步骤(\s\d+)?[:：](.+?)(?=步骤\s\d+[:：]|$)/gs;
        const steps = [];
        let match;
        while ((match = stepRegex.exec(fullResponse)) !== null) {
          steps.push(match[2].trim());
        }
        
        // 发送完成信号和修复方案
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'complete',
            planId,
            plan: {
              issue,
              systemType,
              severity,
              diagnosis: fullResponse.substring(0, 200) + '...',
              steps: steps.length > 0 ? steps : ['详细分析请查看完整响应'],
              generatedAt: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          })
        });
      } catch (err) {
        console.error('AI分析问题错误:', err);
        await stream.writeSSE({
          data: JSON.stringify({ 
            type: 'error',
            error: 'AI处理问题分析失败',
            message: err instanceof Error ? err.message : '未知错误'
          })
        });
      }
      
    } catch (error) {
      console.error('自动修复分析请求处理错误:', error);
      await stream.writeSSE({
        data: JSON.stringify({ 
          type: 'error',
          error: '处理自动修复分析请求失败',
          message: error instanceof Error ? error.message : '未知错误'
        })
      });
    }
  });
});

export { autoHealingRoutes }; 