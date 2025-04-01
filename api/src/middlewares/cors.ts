import { Context, MiddlewareHandler, Next } from 'hono';

type CorsOptions = {
  origin?: string | string[];
  allowMethods?: string[];
  allowHeaders?: string[];
  exposeHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
};

/**
 * CORS中间件
 * 设置跨域资源共享相关的响应头
 */
export const corsMiddleware = (options: CorsOptions = {}): MiddlewareHandler => {
  const defaults: CorsOptions = {
    origin: '*',
    allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders: [],
    credentials: true,
    maxAge: 86400 // 24小时
  };

  const opts = { ...defaults, ...options };

  return async (c: Context, next: Next) => {
    // 预检请求处理
    if (c.req.method === 'OPTIONS') {
      setCorsHeaders(c, opts);
      return new Response('', { status: 204 });
    }

    // 为所有其他请求设置CORS头
    setCorsHeaders(c, opts);
    await next();
  };
};

/**
 * 设置CORS相关的响应头
 */
function setCorsHeaders(c: Context, options: CorsOptions): void {
  // 允许的来源
  if (options.origin) {
    if (Array.isArray(options.origin)) {
      const requestOrigin = c.req.header('Origin');
      if (requestOrigin && options.origin.includes(requestOrigin)) {
        c.header('Access-Control-Allow-Origin', requestOrigin);
      } else {
        c.header('Access-Control-Allow-Origin', options.origin[0]);
      }
    } else {
      c.header('Access-Control-Allow-Origin', options.origin);
    }
  }

  // 允许的方法
  if (options.allowMethods && options.allowMethods.length > 0) {
    c.header('Access-Control-Allow-Methods', options.allowMethods.join(', '));
  }

  // 允许的头
  if (options.allowHeaders && options.allowHeaders.length > 0) {
    c.header('Access-Control-Allow-Headers', options.allowHeaders.join(', '));
  }

  // 暴露的头
  if (options.exposeHeaders && options.exposeHeaders.length > 0) {
    c.header('Access-Control-Expose-Headers', options.exposeHeaders.join(', '));
  }

  // 是否允许凭证
  if (options.credentials) {
    c.header('Access-Control-Allow-Credentials', 'true');
  }

  // 预检请求结果缓存时间
  if (options.maxAge !== undefined) {
    c.header('Access-Control-Max-Age', options.maxAge.toString());
  }
} 