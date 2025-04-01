import { Hono } from 'hono';
import { db } from '../db';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

// 创建路由实例
const tasksRoutes = new Hono();

// 验证模式
const createTaskSchema = z.object({
  name: z.string().min(1, "任务名称不能为空"),
  description: z.string().optional(),
  type: z.enum(["scheduled", "manual", "auto"]),
  status: z.enum(["pending", "running", "completed", "failed"]).default("pending"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  schedule: z.string().optional(),
  command: z.string().optional(),
  parameters: z.record(z.any()).optional(),
  timeout: z.number().optional(),
  retries: z.number().int().min(0).default(0),
  created_by: z.string().optional(),
});

const updateTaskSchema = createTaskSchema.partial();

// 获取所有任务
tasksRoutes.get('/', async (c) => {
  try {
    const tasks = await db.select().from('tasks').orderBy('created_at', 'desc');
    
    return c.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    return c.json({
      success: false,
      message: '获取任务列表失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 获取单个任务
tasksRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const task = await db.select().from('tasks').where('id', '=', id).first();
    
    if (!task) {
      return c.json({
        success: false,
        message: '任务不存在'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('获取任务详情失败:', error);
    return c.json({
      success: false,
      message: '获取任务详情失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 创建任务
tasksRoutes.post('/', zValidator('json', createTaskSchema), async (c) => {
  try {
    const taskData = c.req.valid('json');
    
    const [taskId] = await db.insert('tasks').values({
      ...taskData,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('id');
    
    return c.json({
      success: true,
      message: '任务创建成功',
      data: { id: taskId }
    }, 201);
  } catch (error) {
    console.error('创建任务失败:', error);
    return c.json({
      success: false,
      message: '创建任务失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 更新任务
tasksRoutes.put('/:id', zValidator('json', updateTaskSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const taskData = c.req.valid('json');
    
    const existingTask = await db.select().from('tasks').where('id', '=', id).first();
    
    if (!existingTask) {
      return c.json({
        success: false,
        message: '任务不存在'
      }, 404);
    }
    
    await db.update('tasks').set({
      ...taskData,
      updated_at: new Date()
    }).where('id', '=', id);
    
    return c.json({
      success: true,
      message: '任务更新成功'
    });
  } catch (error) {
    console.error('更新任务失败:', error);
    return c.json({
      success: false,
      message: '更新任务失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 删除任务
tasksRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const existingTask = await db.select().from('tasks').where('id', '=', id).first();
    
    if (!existingTask) {
      return c.json({
        success: false,
        message: '任务不存在'
      }, 404);
    }
    
    await db.delete('tasks').where('id', '=', id);
    
    return c.json({
      success: true,
      message: '任务删除成功'
    });
  } catch (error) {
    console.error('删除任务失败:', error);
    return c.json({
      success: false,
      message: '删除任务失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 启动任务
tasksRoutes.post('/:id/execute', async (c) => {
  try {
    const id = c.req.param('id');
    
    const task = await db.select().from('tasks').where('id', '=', id).first();
    
    if (!task) {
      return c.json({
        success: false,
        message: '任务不存在'
      }, 404);
    }
    
    // 更新任务状态为运行中
    await db.update('tasks').set({
      status: 'running',
      started_at: new Date(),
      updated_at: new Date()
    }).where('id', '=', id);
    
    // TODO: 实际执行任务逻辑，可以根据任务类型和命令进行处理
    // 这里可以启动一个异步进程来执行任务
    
    return c.json({
      success: true,
      message: '任务启动成功'
    });
  } catch (error) {
    console.error('启动任务失败:', error);
    return c.json({
      success: false,
      message: '启动任务失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 获取任务执行历史
tasksRoutes.get('/:id/history', async (c) => {
  try {
    const id = c.req.param('id');
    
    const history = await db.select()
      .from('task_executions')
      .where('task_id', '=', id)
      .orderBy('started_at', 'desc');
    
    return c.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('获取任务执行历史失败:', error);
    return c.json({
      success: false,
      message: '获取任务执行历史失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

export default tasksRoutes; 