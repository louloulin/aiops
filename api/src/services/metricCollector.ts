import { CronJob } from 'cron';
import os from 'os';
import { db } from '../db/drizzle';
import { systemMetrics } from '../db/schema/metrics';
import { formatBytes } from '../utils/formatters';

/**
 * 系统指标收集服务
 * 定期收集主机系统指标并存储到数据库
 */
export class MetricCollector {
  private job: CronJob;
  private isRunning = false;
  private collectInterval = '*/5 * * * *'; // 默认每5分钟收集一次

  constructor() {
    // 创建定时任务
    this.job = new CronJob(
      this.collectInterval,
      this.collectAndSaveMetrics.bind(this),
      null,
      false, // 默认不自动启动
      'Asia/Shanghai' // 时区
    );
  }

  /**
   * 启动收集服务
   */
  public start(): void {
    if (!this.isRunning) {
      this.job.start();
      this.isRunning = true;
      console.log(`系统指标收集服务已启动，收集间隔: ${this.collectInterval}`);
    }
  }

  /**
   * 停止收集服务
   */
  public stop(): void {
    if (this.isRunning) {
      this.job.stop();
      this.isRunning = false;
      console.log('系统指标收集服务已停止');
    }
  }

  /**
   * 设置收集间隔
   * @param cronExpression cron表达式
   */
  public setInterval(cronExpression: string): void {
    this.collectInterval = cronExpression;
    if (this.isRunning) {
      this.stop();
      this.job = new CronJob(
        this.collectInterval,
        this.collectAndSaveMetrics.bind(this),
        null,
        false,
        'Asia/Shanghai'
      );
      this.start();
    }
    console.log(`收集间隔已更新为: ${cronExpression}`);
  }

  /**
   * 收集当前系统指标并保存到数据库
   */
  private async collectAndSaveMetrics(): Promise<void> {
    try {
      console.log('开始收集系统指标...');
      const metrics = this.collectSystemMetrics();
      
      // 将指标保存到数据库
      await db.insert(systemMetrics).values(metrics).execute();
      
      console.log(`系统指标收集完成: CPU使用率=${metrics.cpuUsage}%, 内存使用=${formatBytes(metrics.memoryUsed)}`);
    } catch (error) {
      console.error('系统指标收集失败:', error);
    }
  }

  /**
   * 手动触发一次指标收集
   */
  public async triggerCollection(): Promise<boolean> {
    try {
      await this.collectAndSaveMetrics();
      return true;
    } catch (error) {
      console.error('手动触发指标收集失败:', error);
      return false;
    }
  }

  /**
   * 收集当前系统指标
   * @returns 系统指标对象
   */
  private collectSystemMetrics() {
    // CPU使用率计算
    const cpuUsage = this.calculateCpuUsage();
    
    // 内存信息
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsed = totalMemory - freeMemory;
    
    // 系统负载
    const loadAvg = os.loadavg();
    
    // 获取网络接口信息
    const networkInterfaces = os.networkInterfaces();
    let networkBytesIn = 0;
    let networkBytesOut = 0;
    
    // 这里只是模拟网络数据，实际生产环境需要使用系统特定的命令或库
    Object.values(networkInterfaces).forEach(interfaces => {
      if (interfaces) {
        interfaces.forEach(() => {
          // 模拟数据
          networkBytesIn += Math.floor(Math.random() * 1000000);
          networkBytesOut += Math.floor(Math.random() * 1000000);
        });
      }
    });
    
    // 磁盘使用情况（模拟数据）
    // 在实际生产环境中应使用fs模块或exec系统命令获取真实数据
    const diskTotal = 1000000000000; // 1TB
    const diskUsed = Math.floor(diskTotal * (Math.random() * 0.5 + 0.3)); // 30-80%使用率
    const diskFree = diskTotal - diskUsed;
    
    // CPU温度 (模拟数据，实际生产环境需要使用系统特定的命令或库)
    const cpuTemp = Math.floor(Math.random() * 30) + 30; // 30-60°C
    
    // 返回符合数据库表结构的对象
    return {
      cpuUsage: Math.round(cpuUsage * 100) / 100,
      cpuTemperature: cpuTemp,
      memoryUsed,
      memoryTotal: totalMemory,
      memoryFree: freeMemory,
      diskUsed,
      diskTotal,
      diskFree,
      networkBytesIn,
      networkBytesOut
    };
  }

  /**
   * 计算CPU使用率
   * 注: 这是简化的实现，更准确的方法应考虑多核心和时间窗口
   * @returns CPU使用率（百分比）
   */
  private calculateCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });
    
    const usagePercent = 100 - (totalIdle / totalTick) * 100;
    return Math.round(usagePercent * 100) / 100;
  }
}

// 创建单例实例
export const metricCollector = new MetricCollector();

// 在应用启动时自动启动收集服务
if (process.env.NODE_ENV !== 'test') {
  metricCollector.start();
} 