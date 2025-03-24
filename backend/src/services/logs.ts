import { z } from 'zod';

/**
 * 日志条目接口
 */
export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  message: string;
  service?: string;
  context?: Record<string, any>;
}

/**
 * 日志查询参数
 */
export interface LogQueryParams {
  timeRange?: string;
  service?: string;
  level?: string;
  query?: string;
  limit?: number;
}

/**
 * 模拟生成系统日志数据
 * 在实际项目中，这里会从日志存储系统或日志文件中获取数据
 */
export function generateMockLogs(params: LogQueryParams = {}): LogEntry[] {
  const logs: LogEntry[] = [];
  const services = ['api-gateway', 'auth-service', 'user-service', 'billing-service', 'notification-service'];
  const levels = ['debug', 'info', 'warn', 'error', 'critical'] as const;
  
  // 消息模板
  const messageTemplates = {
    debug: [
      '调试: 执行函数 {function}，参数: {params}',
      '调试: 加载模块 {module}，耗时: {time}ms',
      '调试: 数据库查询完成，结果数量: {count}',
      '调试: 缓存命中率: {rate}%',
      '调试: 资源使用: CPU {cpu}%, 内存 {memory}MB',
    ],
    info: [
      '信息: 用户 {user} 登录成功',
      '信息: 处理请求 {path}，耗时: {time}ms',
      '信息: 服务 {service} 启动完成',
      '信息: 任务 {task} 执行完成，状态: 成功',
      '信息: 系统更新完成，版本: {version}',
    ],
    warn: [
      '警告: 请求速率接近限制，当前: {rate}/秒',
      '警告: 数据库连接池使用率高: {usage}%',
      '警告: API 响应时间延长: {time}ms',
      '警告: 磁盘使用率达到: {usage}%',
      '警告: 缓存命中率下降: {rate}%',
    ],
    error: [
      '错误: 请求处理失败，路径: {path}, 错误: {error}',
      '错误: 数据库查询异常，SQL: {sql}, 错误: {error}',
      '错误: 服务 {service} 连接失败，错误: {error}',
      '错误: 第三方API调用失败，API: {api}, 错误: {error}',
      '错误: 文件操作失败，路径: {path}, 错误: {error}',
    ],
    critical: [
      '严重: 服务 {service} 崩溃，错误: {error}',
      '严重: 数据库连接中断，错误: {error}',
      '严重: 系统资源耗尽，类型: {type}',
      '严重: 安全漏洞检测，漏洞: {vulnerability}',
      '严重: 数据损坏，表: {table}, 错误: {error}',
    ],
  };
  
  // 替换模板中的变量
  function fillTemplate(template: string): string {
    return template.replace(/\{(\w+)\}/g, (_, variable) => {
      switch(variable) {
        case 'function': return ['getData', 'processRequest', 'updateRecord', 'validateInput', 'loadConfig'][Math.floor(Math.random() * 5)];
        case 'module': return ['auth', 'database', 'cache', 'api', 'utils'][Math.floor(Math.random() * 5)];
        case 'count': return String(Math.floor(Math.random() * 1000));
        case 'rate': return String(Math.floor(Math.random() * 100));
        case 'cpu': return String(Math.floor(Math.random() * 100));
        case 'memory': return String(Math.floor(Math.random() * 8192));
        case 'user': return [`user_${Math.floor(Math.random() * 1000)}`, 'admin', 'system', 'guest'][Math.floor(Math.random() * 4)];
        case 'path': return [`/api/users/${Math.floor(Math.random() * 1000)}`, '/api/auth/login', '/api/products', '/api/orders', '/api/admin'][Math.floor(Math.random() * 5)];
        case 'service': return services[Math.floor(Math.random() * services.length)];
        case 'task': return [`job_${Math.floor(Math.random() * 100)}`, 'backup', 'cleanup', 'index', 'sync'][Math.floor(Math.random() * 5)];
        case 'version': return `v${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`;
        case 'usage': return String(60 + Math.floor(Math.random() * 40)); // 60-100%
        case 'time': return String(Math.floor(Math.random() * 5000));
        case 'error': return ['连接超时', '权限拒绝', '资源不存在', '无效输入', '内部错误'][Math.floor(Math.random() * 5)];
        case 'sql': return ['SELECT * FROM users', 'UPDATE orders SET status = "completed"', 'INSERT INTO logs', 'DELETE FROM temp_data'][Math.floor(Math.random() * 4)];
        case 'api': return ['payment', 'shipping', 'email', 'analytics', 'storage'][Math.floor(Math.random() * 5)];
        case 'type': return ['内存', 'CPU', '磁盘空间', '连接数', '文件句柄'][Math.floor(Math.random() * 5)];
        case 'vulnerability': return ['SQL注入', 'XSS', 'CSRF', '权限提升', '密码泄露'][Math.floor(Math.random() * 5)];
        case 'table': return ['users', 'orders', 'products', 'logs', 'settings'][Math.floor(Math.random() * 5)];
        case 'params': return `{id: ${Math.floor(Math.random() * 1000)}, action: "${['get', 'update', 'delete', 'create'][Math.floor(Math.random() * 4)]}"}`;
        default: return `{${variable}}`;
      }
    });
  }
  
  const limit = params.limit || 100;
  const now = new Date();
  
  // 根据时间范围计算起始时间
  let startTime = new Date(now);
  if (params.timeRange === 'hour') {
    startTime = new Date(now.getTime() - 60 * 60 * 1000);
  } else if (params.timeRange === 'day') {
    startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (params.timeRange === 'week') {
    startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  for (let i = 0; i < limit; i++) {
    // 生成随机时间戳
    const logTime = new Date(startTime.getTime() + Math.random() * (now.getTime() - startTime.getTime()));
    
    // 生成随机级别，较高概率为info
    const levelIndex = Math.random() < 0.5 ? 1 : // 50% 概率为 info
                      Math.random() < 0.7 ? 0 : // 20% 概率为 debug
                      Math.random() < 0.8 ? 2 : // 10% 概率为 warn
                      Math.random() < 0.9 ? 3 : // 10% 概率为 error
                      4; // 10% 概率为 critical
    const level = levels[levelIndex];
    
    // 生成随机服务
    const service = services[Math.floor(Math.random() * services.length)];
    
    // 选择并填充模板
    const templates = messageTemplates[level];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const message = fillTemplate(template);
    
    // 创建日志条目
    const logEntry: LogEntry = {
      timestamp: logTime.toISOString(),
      level,
      message,
      service,
      context: {
        requestId: `req_${Math.random().toString(36).substring(2, 10)}`,
        userId: Math.random() < 0.8 ? `user_${Math.floor(Math.random() * 1000)}` : null,
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      },
    };
    
    logs.push(logEntry);
  }
  
  // 根据查询条件过滤日志
  let filteredLogs = logs;
  
  if (params.service) {
    filteredLogs = filteredLogs.filter(log => log.service === params.service);
  }
  
  if (params.level) {
    filteredLogs = filteredLogs.filter(log => log.level === params.level);
  }
  
  if (params.query) {
    const query = params.query.toLowerCase();
    filteredLogs = filteredLogs.filter(log => 
      log.message.toLowerCase().includes(query) || 
      log.service?.toLowerCase().includes(query) ||
      JSON.stringify(log.context).toLowerCase().includes(query)
    );
  }
  
  // 按时间排序，最新的在前面
  return filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * 分析日志中的异常模式
 * 在实际项目中，这将使用更复杂的算法和机器学习模型
 */
export function analyzeLogPatterns(logs: LogEntry[]) {
  // 按级别分组
  const levelCounts = logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // 按服务分组
  const serviceCounts = logs.reduce((acc, log) => {
    if (log.service) {
      acc[log.service] = (acc[log.service] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  // 找出错误和警告日志
  const errorLogs = logs.filter(log => log.level === 'error' || log.level === 'critical');
  const warningLogs = logs.filter(log => log.level === 'warn');
  
  // 分析错误日志中的常见模式
  const errorPatterns = findCommonPatterns(errorLogs);
  const warningPatterns = findCommonPatterns(warningLogs);
  
  return {
    summary: {
      total: logs.length,
      byLevel: levelCounts,
      byService: serviceCounts,
      errorCount: errorLogs.length,
      warningCount: warningLogs.length,
    },
    patterns: {
      errors: errorPatterns,
      warnings: warningPatterns,
    },
    insights: generateInsights(logs, errorPatterns, warningPatterns),
  };
}

/**
 * 查找日志中的常见模式
 */
function findCommonPatterns(logs: LogEntry[], threshold: number = 2) {
  const patterns: Record<string, any> = {};
  
  // 简单的模式匹配基于常见错误类型
  logs.forEach(log => {
    // 提取错误类型 (例如从 "错误: 数据库查询异常，SQL: XXX, 错误: 连接超时" 提取 "数据库查询异常")
    const type = log.message.split(',')[0].split(':').slice(1).join(':').trim();
    
    if (!patterns[type]) {
      patterns[type] = {
        count: 0,
        examples: [],
        services: new Set(),
      };
    }
    
    patterns[type].count += 1;
    if (patterns[type].examples.length < 3) {
      patterns[type].examples.push(log);
    }
    if (log.service) {
      patterns[type].services.add(log.service);
    }
  });
  
  // 过滤出超过阈值的模式
  const significantPatterns = Object.entries(patterns)
    .filter(([_, data]) => (data as any).count >= threshold)
    .map(([type, data]) => ({
      type,
      count: (data as any).count,
      examples: (data as any).examples,
      services: Array.from((data as any).services),
    }))
    .sort((a, b) => b.count - a.count);
  
  return significantPatterns;
}

/**
 * 生成日志分析洞察
 */
function generateInsights(logs: LogEntry[], errorPatterns: any[], warningPatterns: any[]) {
  const insights = [];
  
  // 检查错误率
  const errorRate = logs.filter(log => log.level === 'error' || log.level === 'critical').length / logs.length;
  if (errorRate > 0.1) {
    insights.push({
      type: 'high_error_rate',
      severity: 'high',
      message: `错误率异常高 (${(errorRate * 100).toFixed(2)}%)，应立即调查`,
    });
  } else if (errorRate > 0.05) {
    insights.push({
      type: 'elevated_error_rate',
      severity: 'medium',
      message: `错误率较高 (${(errorRate * 100).toFixed(2)}%)，建议关注`,
    });
  }
  
  // 检查常见错误模式
  if (errorPatterns.length > 0) {
    insights.push({
      type: 'common_error_pattern',
      severity: 'high',
      message: `发现常见错误模式: "${errorPatterns[0].type}" 出现了 ${errorPatterns[0].count} 次`,
      details: errorPatterns[0],
    });
  }
  
  // 按服务统计错误
  const serviceErrors = {} as Record<string, number>;
  logs.filter(log => log.level === 'error' || log.level === 'critical').forEach(log => {
    if (log.service) {
      serviceErrors[log.service] = (serviceErrors[log.service] || 0) + 1;
    }
  });
  
  const problematicServices = Object.entries(serviceErrors)
    .sort(([_, countA], [__, countB]) => countB - countA)
    .slice(0, 3);
  
  if (problematicServices.length > 0 && problematicServices[0][1] > 5) {
    insights.push({
      type: 'problematic_service',
      severity: 'high',
      message: `服务 "${problematicServices[0][0]}" 有大量错误 (${problematicServices[0][1]} 个)`,
      service: problematicServices[0][0],
    });
  }
  
  return insights;
} 