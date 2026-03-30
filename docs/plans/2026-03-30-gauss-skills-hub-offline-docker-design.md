# Gauss Skills Hub Offline Docker Design

## Goal

为 `Gauss Skills Hub` 提供一套适用于 `amd64/x86_64` 内网机器的离线 Docker 部署方案。目标机器不需要安装 Node.js、npm 或 PostgreSQL，只需要已有 `Docker Engine` 和 `docker compose`，并允许先手动执行 `docker load`。

## Chosen Approach

采用双镜像离线部署：

- `gauss-skills-hub-app` 应用镜像
- `postgres:15-alpine` 数据库镜像
- `docker-compose.yml` 编排文件
- `.env.docker.example` 环境变量模板
- `scripts/build-offline-docker-bundle.sh` 离线打包脚本
- `release/docker-offline/` 离线交付目录

不采用单镜像内嵌数据库方案，因为数据库和应用职责不同，备份、升级和数据持久化都会更差。

## Container Layout

### App container

应用镜像使用多阶段构建：

- builder 阶段安装依赖、生成 Prisma Client、构建 Next.js 生产包
- runtime 阶段只保留生产依赖、`.next`、`public` 级别运行产物、`prisma` 文件和启动脚本

容器启动时执行：

1. 等待 PostgreSQL 可连接
2. `prisma db push`
3. `npm run prisma:seed`
4. 启动 `next start --hostname 0.0.0.0 --port 3100`

### Postgres container

数据库直接使用固定版本 `postgres:15-alpine`，通过 compose 配置：

- 数据库名
- 用户名
- 密码
- 健康检查

## Persistence

需要两个持久化卷：

- `postgres_data`：保存数据库
- `app_uploads`：保存 `storage/uploads`

这样升级镜像、重启容器都不会丢技能数据和上传附件。

## Offline Bundle Layout

离线交付目录建议为：

- `release/docker-offline/images.tar`
- `release/docker-offline/docker-compose.yml`
- `release/docker-offline/.env.docker.example`
- `release/docker-offline/README-docker.md`

外网打包机执行脚本后，得到完整交付目录；如有需要再压缩成一个总包。

## Internal Deployment Flow

内网机器操作顺序固定为：

1. 复制离线目录
2. `docker load -i images.tar`
3. `cp .env.docker.example .env`
4. 修改管理员账号、数据库密码和 `AUTH_SECRET`
5. `docker compose up -d`
6. `docker compose logs -f app`

## Constraints

- 仅支持 `amd64/x86_64`
- 仅支持单机 `docker compose`
- 不包含反向代理、HTTPS、备份自动化
- 继续沿用当前 Prisma `db push` 初始化方式，不额外引入 migration 体系

## Risks

- 第一次启动依赖数据库健康检查和等待逻辑，启动脚本必须足够稳
- Next.js 运行镜像不能把整个开发环境原样带入，否则镜像会过大
- `.env.docker.example` 必须明确标注需要修改的敏感配置
- 离线交付目录不应该混入本地测试产物或 `.git`
