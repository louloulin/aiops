import { CronJob } from 'cron';
import { metricCollector } from './metricCollector';
import { alertService } from './alertService';

/**
 * 计划任务类型
 */
export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  cronExpression: string;
  isEnabled: boolean;
  lastRun?: Date;
  job: CronJob;
}

/**
 * 计划任务服务
 * 管理所有系统定时任务
 */
export class ScheduleService {
  private tasks: Map<string, ScheduledTask> = new Map();

  constructor() {
    this.initializeSystemTasks();
  }

  /**
   * 初始化系统级别的计划任务
   */
  private initializeSystemTasks(): void {
    // 每5分钟收集一次系统指标
    this.registerTask({
      id: 'system-metrics-collection',
      name: '系统指标收集',
      description: '定期收集主机系统指标',
      cronExpression: '*/5 * * * *',
      isEnabled: true,
      handler: async () => {
        console.log('执行定时系统指标收集...');
        await metricCollector.triggerCollection();
      }
    });

    // 每10分钟检查一次系统告警
    this.registerTask({
      id: 'system-alerts-check',
      name: '系统告警检查',
      description: '定期检查系统指标是否触发告警',
      cronExpression: '*/10 * * * *',
      isEnabled: true,
      handler: async () => {
        console.log('执行定时告警检查...');
        const alerts = await alertService.checkLatestMetrics();
        if (alerts.length > 0) {
          console.log(`检测到${alerts.length}个新告警`);
        }
      }
    });
  }

  /**
   * 注册新的计划任务
   */
  public registerTask({ 
    id, 
    name, 
    description, 
    cronExpression, 
    isEnabled = true, 
    handler 
  }: {
    id: string; 
    name: string; 
    description: string; 
    cronExpression: string; 
    isEnabled?: boolean; 
    handler: () => Promise<void> | void;
  }): ScheduledTask {
    // 创建定时任务
    const job = new CronJob(
      cronExpression,
      async () => {
        try {
          const task = this.tasks.get(id);
          if (task) {
            task.lastRun = new Date();
          }
          await handler();
        } catch (error) {
          console.error(`任务 ${name} 执行失败:`, error);
        }
      },
      null,
      isEnabled,
      'Asia/Shanghai'
    );

    // 注册任务
    const task: ScheduledTask = {
      id,
      name,
      description,
      cronExpression,
      isEnabled,
      job
    };

    this.tasks.set(id, task);
    
    if (isEnabled) {
      job.start();
      console.log(`任务 ${name} 已注册并启动`);
    } else {
      console.log(`任务 ${name} 已注册但未启动`);
    }

    return task;
  }

  /**
   * 获取所有计划任务
   */
  public getAllTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 获取单个计划任务
   */
  public getTask(id: string): ScheduledTask | undefined {
    return this.tasks.get(id);
  }

  /**
   * 启动任务
   */
  public startTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (task && !task.isEnabled) {
      task.job.start();
      task.isEnabled = true;
      console.log(`任务 ${task.name} 已启动`);
      return true;
    }
    return false;
  }

  /**
   * 停止任务
   */
  public stopTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (task && task.isEnabled) {
      task.job.stop();
      task.isEnabled = false;
      console.log(`任务 ${task.name} 已停止`);
      return true;
    }
    return false;
  }

  /**
   * 更新任务的cron表达式
   */
  public updateTaskSchedule(id: string, cronExpression: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;

    // 停止现有任务
    if (task.isEnabled) {
      task.job.stop();
    }

    // 创建新的任务
    const wasEnabled = task.isEnabled;
    const newJob = new CronJob(
      cronExpression,
      task.job.fireOnTick.bind(task.job),
      null,
      wasEnabled,
      'Asia/Shanghai'
    );

    // 更新任务
    task.cronExpression = cronExpression;
    task.job = newJob;

    // 如果之前是启用的，则启动新任务
    if (wasEnabled) {
      task.job.start();
    }

    console.log(`任务 ${task.name} 的计划已更新为 ${cronExpression}`);
    return true;
  }

  /**
   * 手动触发任务执行
   */
  public async triggerTask(id: string): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task) return false;

    try {
      console.log(`手动触发任务 ${task.name} 执行`);
      // 手动执行任务
      await task.job.fireOnTick();
      return true;
    } catch (error) {
      console.error(`手动触发任务 ${task.name} 失败:`, error);
      return false;
    }
  }
}

// 创建单例实例
export const scheduleService = new ScheduleService();

// 启动所有已启用的系统任务
if (process.env.NODE_ENV !== 'test') {
  console.log('计划任务服务已初始化');
} 