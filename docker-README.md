# Docker 环境设置指南

本项目使用 Docker Compose 来管理开发环境，提供了 PostgreSQL 和 Redis 服务的容器化配置。

## 前提条件

确保您的系统已安装：

- Docker 
- Docker Compose

## 启动服务

在项目根目录下运行以下命令启动所有服务：

```bash
docker-compose up -d
```

这将在后台启动以下服务：

- **PostgreSQL**: 运行在端口 5432，数据保存在名为 `aiops_postgres_data` 的持久化卷中
- **Redis**: 运行在端口 6379，数据保存在名为 `aiops_redis_data` 的持久化卷中

## 停止服务

要停止所有容器但保留数据，运行：

```bash
docker-compose down
```

如果需要完全清理（包括删除数据卷），运行：

```bash
docker-compose down -v
```

## 服务健康检查

两个服务都配置了健康检查，可以通过以下命令查看服务状态：

```bash
docker-compose ps
```

## 连接到数据库

### PostgreSQL

默认连接信息：
- **主机**: postgres (或者从主机访问时为 localhost)
- **端口**: 5432
- **用户名**: louloulin
- **密码**: postgres
- **数据库**: aiops

连接示例：

```bash
psql -h localhost -U louloulin -d aiops
```

### Redis

默认连接信息：
- **主机**: redis (或者从主机访问时为 localhost)
- **端口**: 6379
- **无密码**

连接示例：

```bash
redis-cli -h localhost
```

## 环境变量

如果需要修改默认配置，可以在 `docker-compose.yml` 文件中调整，或者通过环境变量传递：

```bash
POSTGRES_USER=customuser POSTGRES_PASSWORD=custompass docker-compose up -d
```

## 数据持久化

数据保存在 Docker 卷中，即使容器被删除，数据也会保留。卷名称：

- PostgreSQL: `aiops_postgres_data`
- Redis: `aiops_redis_data`

要查看卷信息：

```bash
docker volume ls | grep aiops
``` 