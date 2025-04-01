import { db } from '../db/drizzle';
import { systemMetrics } from '../db/schema/metrics';
import { desc } from 'drizzle-orm';
import { sendEmail } from '../utils/emailSender';
import { formatBytes, formatPercentage } from '../utils/formatters';

// 告警阈值配置
const alertThresholds = {
  cpuUsage: {
    warning: 70, // 70% CPU使用率触发警告
    critical: 90, // 90% CPU使用率触发严重告警
  },
  cpuTemperature: {
    warning: 70, // 70°C触发警告
    critical: 85, // 85°C触发严重告警
  },
  memoryUsage: {
    warning: 75, // 75% 内存使用率触发警告
    critical: 90, // 90% 内存使用率触发严重告警
  },
  diskUsage: {
    warning: 80, // 80% 磁盘使用率触发警告
    critical: 95, // 95% 磁盘使用率触发严重告警
  },
};

// 告警级别
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

// 告警类型
export interface Alert {
  id: string;
  timestamp: Date;
  severity: AlertSeverity;
  source: string;
  metric: string;
  value: number;
  threshold: number;
  message: string;
}

/**
 * 告警服务
 * 监控系统指标并在超过阈值时发送告警
 */
export class AlertService {
  private alerts: Alert[] = [];
  private maxAlertsHistory = 100; // 最多保留的历史告警数量

  constructor() {
    console.log('告警服务已初始化');
  }

  /**
   * 检查最新的系统指标并生成告警
   */
  public async checkLatestMetrics(): Promise<Alert[]> {
    try {
      // 获取最新的系统指标
      const latestMetrics = await db.select()
        .from(systemMetrics)
        .orderBy(desc(systemMetrics.createdAt))
        .limit(1)
        .execute();

      if (latestMetrics.length === 0) {
        console.log('没有找到系统指标数据');
        return [];
      }

      const metrics = latestMetrics[0];
      const newAlerts: Alert[] = [];

      // 检查CPU使用率
      if (metrics.cpuUsage >= alertThresholds.cpuUsage.critical) {
        newAlerts.push(this.createAlert(
          AlertSeverity.CRITICAL,
          'cpu',
          'usage',
          metrics.cpuUsage,
          alertThresholds.cpuUsage.critical,
          `CPU使用率达到${formatPercentage(metrics.cpuUsage)}，超过临界阈值${formatPercentage(alertThresholds.cpuUsage.critical)}`
        ));
      } else if (metrics.cpuUsage >= alertThresholds.cpuUsage.warning) {
        newAlerts.push(this.createAlert(
          AlertSeverity.WARNING,
          'cpu',
          'usage',
          metrics.cpuUsage,
          alertThresholds.cpuUsage.warning,
          `CPU使用率达到${formatPercentage(metrics.cpuUsage)}，超过警告阈值${formatPercentage(alertThresholds.cpuUsage.warning)}`
        ));
      }

      // 检查CPU温度
      if (metrics.cpuTemperature >= alertThresholds.cpuTemperature.critical) {
        newAlerts.push(this.createAlert(
          AlertSeverity.CRITICAL,
          'cpu',
          'temperature',
          metrics.cpuTemperature,
          alertThresholds.cpuTemperature.critical,
          `CPU温度达到${metrics.cpuTemperature}°C，超过临界阈值${alertThresholds.cpuTemperature.critical}°C`
        ));
      } else if (metrics.cpuTemperature >= alertThresholds.cpuTemperature.warning) {
        newAlerts.push(this.createAlert(
          AlertSeverity.WARNING,
          'cpu',
          'temperature',
          metrics.cpuTemperature,
          alertThresholds.cpuTemperature.warning,
          `CPU温度达到${metrics.cpuTemperature}°C，超过警告阈值${alertThresholds.cpuTemperature.warning}°C`
        ));
      }

      // 检查内存使用率
      const memoryUsagePercent = (metrics.memoryUsed / metrics.memoryTotal) * 100;
      if (memoryUsagePercent >= alertThresholds.memoryUsage.critical) {
        newAlerts.push(this.createAlert(
          AlertSeverity.CRITICAL,
          'memory',
          'usage',
          memoryUsagePercent,
          alertThresholds.memoryUsage.critical,
          `内存使用率达到${formatPercentage(memoryUsagePercent)}，超过临界阈值${formatPercentage(alertThresholds.memoryUsage.critical)}`
        ));
      } else if (memoryUsagePercent >= alertThresholds.memoryUsage.warning) {
        newAlerts.push(this.createAlert(
          AlertSeverity.WARNING,
          'memory',
          'usage',
          memoryUsagePercent,
          alertThresholds.memoryUsage.warning,
          `内存使用率达到${formatPercentage(memoryUsagePercent)}，超过警告阈值${formatPercentage(alertThresholds.memoryUsage.warning)}`
        ));
      }

      // 检查磁盘使用率
      const diskUsagePercent = (metrics.diskUsed / metrics.diskTotal) * 100;
      if (diskUsagePercent >= alertThresholds.diskUsage.critical) {
        newAlerts.push(this.createAlert(
          AlertSeverity.CRITICAL,
          'disk',
          'usage',
          diskUsagePercent,
          alertThresholds.diskUsage.critical,
          `磁盘使用率达到${formatPercentage(diskUsagePercent)}，超过临界阈值${formatPercentage(alertThresholds.diskUsage.critical)}`
        ));
      } else if (diskUsagePercent >= alertThresholds.diskUsage.warning) {
        newAlerts.push(this.createAlert(
          AlertSeverity.WARNING,
          'disk',
          'usage',
          diskUsagePercent,
          alertThresholds.diskUsage.warning,
          `磁盘使用率达到${formatPercentage(diskUsagePercent)}，超过警告阈值${formatPercentage(alertThresholds.diskUsage.warning)}`
        ));
      }

      // 为每个告警发送通知
      for (const alert of newAlerts) {
        await this.notifyAlert(alert);
      }

      // 添加到告警历史
      this.addAlerts(newAlerts);

      return newAlerts;
    } catch (error) {
      console.error('检查系统指标告警失败:', error);
      return [];
    }
  }

  /**
   * 获取当前告警历史
   */
  public getAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * 清除告警历史
   */
  public clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * 添加告警到历史记录
   */
  private addAlerts(newAlerts: Alert[]): void {
    this.alerts = [...newAlerts, ...this.alerts].slice(0, this.maxAlertsHistory);
  }

  /**
   * 创建告警对象
   */
  private createAlert(
    severity: AlertSeverity,
    source: string,
    metric: string,
    value: number,
    threshold: number,
    message: string
  ): Alert {
    return {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      severity,
      source,
      metric,
      value,
      threshold,
      message,
    };
  }

  /**
   * 发送告警通知
   */
  private async notifyAlert(alert: Alert): Promise<void> {
    // 记录到日志
    console.log(`[${alert.severity.toUpperCase()}] ${alert.message}`);

    // 对于警告和严重告警，发送邮件通知
    if (alert.severity === AlertSeverity.WARNING || alert.severity === AlertSeverity.CRITICAL) {
      const subject = `[${alert.severity === AlertSeverity.CRITICAL ? '严重告警' : '警告'}] ${alert.source.toUpperCase()} ${alert.metric} 超过阈值`;
      const content = `
时间: ${alert.timestamp.toLocaleString()}
来源: ${alert.source.toUpperCase()}
指标: ${alert.metric}
当前值: ${alert.metric.includes('usage') ? formatPercentage(alert.value) : alert.value}
阈值: ${alert.metric.includes('usage') ? formatPercentage(alert.threshold) : alert.threshold}
消息: ${alert.message}
      `;

      try {
        // 生产环境中需要配置收件人邮箱
        const recipients = process.env.ALERT_EMAILS?.split(',') || ['admin@example.com'];
        await sendEmail(subject, content, recipients);
      } catch (error) {
        console.error('发送告警邮件失败:', error);
      }
    }
  }
}

// 创建单例实例
export const alertService = new AlertService(); 