import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Tool to diagnose system problems
export const diagnoseProblemTool = createTool({
  id: 'diagnose-problem',
  description: 'Diagnose system problems based on symptoms and metrics',
  inputSchema: z.object({
    symptoms: z.array(z.string()).describe('Observed symptoms or error messages'),
    metrics: z.record(z.string(), z.any()).optional().describe('System metrics during the issue'),
    affectedServices: z.array(z.string()).optional().describe('Services affected by the issue'),
  }),
  execute: async ({ context }) => {
    // In a real implementation, this would use a diagnosis engine with machine learning
    
    // Simple rule-based diagnoses for demonstration
    const diagnoses = [];
    
    // Check for high CPU patterns
    if (context.metrics?.cpu && Array.isArray(context.metrics.cpu)) {
      const cpuValues = context.metrics.cpu.map((m: any) => m.value);
      const avgCpu = cpuValues.reduce((sum: number, val: number) => sum + val, 0) / cpuValues.length;
      
      if (avgCpu > 85) {
        diagnoses.push({
          issue: 'High CPU Usage',
          confidence: 0.9,
          details: `Average CPU usage of ${avgCpu.toFixed(2)}% indicates resource exhaustion`,
          possibleCauses: ['Resource-intensive processes', 'Infinite loops', 'Inadequate scaling'],
        });
      }
    }
    
    // Check for memory leaks
    if (context.metrics?.memory && Array.isArray(context.metrics.memory)) {
      const memoryValues = context.metrics.memory.map((m: any) => m.value);
      const isIncreasing = memoryValues.every((val: number, i: number, arr: number[]) => 
        i === 0 || val >= arr[i - 1]
      );
      
      if (isIncreasing && memoryValues[memoryValues.length - 1] > 80) {
        diagnoses.push({
          issue: 'Memory Leak',
          confidence: 0.8,
          details: 'Steadily increasing memory usage indicates a memory leak',
          possibleCauses: ['Unclosed resources', 'Memory not being freed', 'Improper caching'],
        });
      }
    }
    
    // Check for specific symptom patterns
    const hasConnectionIssues = context.symptoms.some(s => 
      s.toLowerCase().includes('connection') && 
      (s.toLowerCase().includes('refused') || s.toLowerCase().includes('timeout'))
    );
    
    if (hasConnectionIssues) {
      diagnoses.push({
        issue: 'Network Connectivity Problems',
        confidence: 0.7,
        details: 'Connection issues detected in error messages',
        possibleCauses: ['Network outage', 'Service down', 'Firewall issues', 'DNS problems'],
      });
    }
    
    return {
      diagnoses,
      recommendedActions: diagnoses.map(d => {
        switch (d.issue) {
          case 'High CPU Usage':
            return 'Identify and restart CPU-intensive processes';
          case 'Memory Leak':
            return 'Restart affected services with memory limits';
          case 'Network Connectivity Problems':
            return 'Check network connectivity and service availability';
          default:
            return 'Monitor system and gather more information';
        }
      }),
    };
  },
});

// Tool to execute repair actions
export const executeRepairTool = createTool({
  id: 'execute-repair',
  description: 'Execute repair actions to fix diagnosed issues',
  inputSchema: z.object({
    action: z.enum([
      'restart-service',
      'scale-service',
      'clear-cache',
      'rollback-deployment',
      'update-configuration',
      'allocate-resources',
    ]),
    serviceName: z.string().describe('Name of the service to repair'),
    parameters: z.record(z.string(), z.any()).optional().describe('Additional parameters for the repair action'),
  }),
  execute: async ({ context }) => {
    // In a real implementation, this would execute actual repair scripts or API calls
    
    // Mock implementation that simulates repair actions
    const startTime = Date.now();
    const success = Math.random() > 0.2; // 80% success rate for simulation
    
    // Simulate action execution delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const results: Record<string, any> = {
      success,
      action: context.action,
      serviceName: context.serviceName,
      executionTime: Date.now() - startTime,
    };
    
    // Define variables used in switch cases
    let replicas;
    let version;
    let cpu;
    let memory;
    
    switch (context.action) {
      case 'restart-service':
        results.details = success ? 
          `Successfully restarted service ${context.serviceName}` : 
          `Failed to restart service ${context.serviceName}`;
        break;
      
      case 'scale-service':
        replicas = context.parameters?.replicas || 3;
        results.details = success ? 
          `Successfully scaled service ${context.serviceName} to ${replicas} replicas` : 
          `Failed to scale service ${context.serviceName}`;
        results.newReplicas = success ? replicas : undefined;
        break;
      
      case 'clear-cache':
        results.details = success ? 
          `Successfully cleared cache for service ${context.serviceName}` : 
          `Failed to clear cache for service ${context.serviceName}`;
        results.bytesCleared = success ? Math.floor(Math.random() * 100000000) : 0;
        break;
      
      case 'rollback-deployment':
        version = context.parameters?.version || 'previous';
        results.details = success ? 
          `Successfully rolled back service ${context.serviceName} to version ${version}` : 
          `Failed to roll back service ${context.serviceName}`;
        results.newVersion = success ? version : undefined;
        break;
      
      case 'update-configuration':
        results.details = success ? 
          `Successfully updated configuration for service ${context.serviceName}` : 
          `Failed to update configuration for service ${context.serviceName}`;
        results.configUpdated = success ? Object.keys(context.parameters || {}).length : 0;
        break;
      
      case 'allocate-resources':
        cpu = context.parameters?.cpu || '1';
        memory = context.parameters?.memory || '2Gi';
        results.details = success ? 
          `Successfully allocated additional resources for service ${context.serviceName} (CPU: ${cpu}, Memory: ${memory})` : 
          `Failed to allocate additional resources for service ${context.serviceName}`;
        break;
    }
    
    return results;
  },
});

// Tool to verify repairs
export const verifyRepairTool = createTool({
  id: 'verify-repair',
  description: 'Verify that a repair action resolved the issue',
  inputSchema: z.object({
    serviceName: z.string().describe('Name of the service that was repaired'),
    metrics: z.record(z.string(), z.any()).optional().describe('Current system metrics after repair'),
    checkType: z.enum(['metrics', 'connectivity', 'functionality', 'all']).default('all'),
  }),
  execute: async ({ context }) => {
    // In a real implementation, this would check actual system state
    
    // Mock implementation for demonstration
    const checks = {
      metrics: Math.random() > 0.1, // 90% pass rate
      connectivity: Math.random() > 0.05, // 95% pass rate
      functionality: Math.random() > 0.15, // 85% pass rate,
    };
    
    const checkResults = {
      metrics: context.checkType === 'metrics' || context.checkType === 'all' ? checks.metrics : undefined,
      connectivity: context.checkType === 'connectivity' || context.checkType === 'all' ? checks.connectivity : undefined,
      functionality: context.checkType === 'functionality' || context.checkType === 'all' ? checks.functionality : undefined,
    };
    
    const allChecked = Object.values(checkResults).filter(Boolean).length;
    const allPassed = Object.values(checkResults).filter(val => val === true).length;
    
    return {
      service: context.serviceName,
      success: allChecked > 0 && allChecked === allPassed,
      checks: checkResults,
      details: allChecked === allPassed ? 
        `All checks passed for service ${context.serviceName}` : 
        `Some checks failed for service ${context.serviceName}`,
    };
  },
});

// Combine all auto-healing tools
export const autoHealingTools = {
  diagnoseProblem: diagnoseProblemTool,
  executeRepair: executeRepairTool,
  verifyRepair: verifyRepairTool,
}; 