import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { scheduleService } from '../services/scheduleService';

// 创建路由
const schedulesRouter = new Hono();

/**
 * 获取所有计划任务
 * GET /api/schedules
 */
schedulesRouter.get('/', async (c) => {
  try {
    const tasks = scheduleService.getAllTasks();
    
    // 提取任务信息，排除job对象
    const tasksInfo = tasks.map(({ job, ...task }) => ({
      ...task,
      nextRunTime: job.nextDate().toJSDate()
    }));
    
    return c.json({
      success: true,
      count: tasksInfo.length,
      tasks: tasksInfo
    });
  } catch (error) {
    console.error('获取计划任务失败:', error);
    return c.json({ success: false, message: '获取计划任务失败' }, 500);
  }
});

/**
 * 获取单个计划任务
 * GET /api/schedules/:id
 */
schedulesRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const task = scheduleService.getTask(id);
    
    if (!task) {
      return c.json({ success: false, message: '计划任务不存在' }, 404);
    }
    
    const { job, ...taskInfo } = task;
    
    return c.json({
      success: true,
      task: {
        ...taskInfo,
        nextRunTime: job.nextDate().toJSDate()
      }
    });
  } catch (error) {
    console.error('获取计划任务失败:', error);
    return c.json({ success: false, message: '获取计划任务失败' }, 500);
  }
});

/**
 * 启动计划任务
 * POST /api/schedules/:id/start
 */
schedulesRouter.post('/:id/start', async (c) => {
  try {
    const id = c.req.param('id');
    const result = scheduleService.startTask(id);
    
    if (!result) {
      return c.json({ success: false, message: '启动任务失败，任务不存在或已启动' }, 400);
    }
    
    return c.json({ success: true, message: '任务已启动' });
  } catch (error) {
    console.error('启动计划任务失败:', error);
    return c.json({ success: false, message: '启动任务失败' }, 500);
  }
});

/**
 * 停止计划任务
 * POST /api/schedules/:id/stop
 */
schedulesRouter.post('/:id/stop', async (c) => {
  try {
    const id = c.req.param('id');
    const result = scheduleService.stopTask(id);
    
    if (!result) {
      return c.json({ success: false, message: '停止任务失败，任务不存在或已停止' }, 400);
    }
    
    return c.json({ success: true, message: '任务已停止' });
  } catch (error) {
    console.error('停止计划任务失败:', error);
    return c.json({ success: false, message: '停止任务失败' }, 500);
  }
});

/**
 * 手动触发计划任务
 * POST /api/schedules/:id/trigger
 */
schedulesRouter.post('/:id/trigger', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await scheduleService.triggerTask(id);
    
    if (!result) {
      return c.json({ success: false, message: '触发任务失败，任务不存在' }, 400);
    }
    
    return c.json({ success: true, message: '任务已触发' });
  } catch (error) {
    console.error('触发计划任务失败:', error);
    return c.json({ success: false, message: '触发任务失败' }, 500);
  }
});

/**
 * 更新计划任务的Cron表达式
 * PUT /api/schedules/:id/cron
 */
schedulesRouter.put('/:id/cron', zValidator('json', z.object({
  cronExpression: z.string().min(9).max(100)
})), async (c) => {
  try {
    const id = c.req.param('id');
    const { cronExpression } = c.req.valid('json');
    
    const result = scheduleService.updateTaskSchedule(id, cronExpression);
    
    if (!result) {
      return c.json({ success: false, message: '更新任务失败，任务不存在' }, 400);
    }
    
    return c.json({ success: true, message: `任务计划已更新为 ${cronExpression}` });
  } catch (error) {
    console.error('更新计划任务失败:', error);
    return c.json({ success: false, message: '更新任务失败' }, 500);
  }
});

export const schedulesRoutes = schedulesRouter; 