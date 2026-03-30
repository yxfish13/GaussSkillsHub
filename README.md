# Gauss Skills Hub

Gauss Skills Hub 是一个基于 `Next.js + Prisma + PostgreSQL` 的技能发布网站，支持：

- 公开提交 Skill
- Markdown 详情页和版本管理
- 技能附件上传和下载统计
- 评论、点赞、点踩
- 单管理员维护后台

## 运行要求

- Node.js `20` 或更高
- PostgreSQL `15` 或更高
- npm `10` 或更高

## 快速部署

1. 安装依赖

```bash
npm ci
```

2. 复制环境变量模板

```bash
cp .env.example .env.local
```

3. 按需修改 `.env.local`

- `DATABASE_URL` 改成目标机器的 PostgreSQL 连接串
- `ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 改成你的后台账号
- `AUTH_SECRET` 改成至少 32 位的随机字符串

4. 初始化数据库

```bash
npx prisma generate
npx prisma db push
npm run prisma:seed
```

5. 构建并启动

```bash
npm run build
npm run start -- --hostname 0.0.0.0 --port 3100
```

启动后访问：

- 首页：`http://<服务器IP>:3100/`
- Skills 广场：`http://<服务器IP>:3100/skills`
- 提交页：`http://<服务器IP>:3100/submit`
- 后台登录：`http://<服务器IP>:3100/admin/login`

## Docker 离线部署

如果目标机器是内网环境，并且已经具备 Docker 与 Docker Compose，建议使用离线 Docker 部署而不是源码部署。

相关文件：

- Docker 说明：[README-docker.md](README-docker.md)
- Docker 环境模板：`.env.docker.example`
- Compose 编排：`docker-compose.yml`
- 离线打包脚本：`scripts/build-offline-docker-bundle.sh`

外网打包机执行：

```bash
bash scripts/build-offline-docker-bundle.sh
```

内网机器执行：

```bash
tar -xzf gauss-skills-hub-docker-offline-<版本>-amd64.tar.gz
cd gauss-skills-hub-docker-offline-<版本>-amd64
docker load -i images.tar
cp .env.docker.example .env
docker compose up -d
```

建议通过 `release/*.sha256` 和离线目录内的 `SHA256SUMS` 校验交付物完整性。

## 生产部署说明

### 1. 本地文件存储

上传文件保存在：

- `storage/uploads/covers`
- `storage/uploads/bundles`

首次运行时目录会自动创建，但生产环境建议提前准备好，并保证运行用户可写。

如果你迁移机器或重装系统，需要一起备份这个目录，否则已上传的封面和附件会丢失。

### 2. 管理员账号

管理员账号不是写死在代码里的，而是通过下面命令从环境变量初始化到数据库：

```bash
npm run prisma:seed
```

如果你修改了 `ADMIN_PASSWORD`，重新执行一次这条命令即可更新管理员密码。

### 3. 反向代理

正式环境建议用 Nginx 或 Caddy 反向代理到 `3100`，并配置 HTTPS。

### 4. 进程守护

正式环境建议用 `systemd`、`pm2` 或 Docker 守护 `npm run start`。

## 常用命令

```bash
npm run build
npm run start
npm run lint
npm test
npx prisma generate
npx prisma db push
npm run prisma:seed
```

## 常见问题

### 页面打不开

先确认服务是否已启动：

```bash
curl -I http://127.0.0.1:3100
```

### 数据库连不上

检查 `.env.local` 里的 `DATABASE_URL`，并确认目标机器 PostgreSQL 已启动。

### 上传后附件打不开

检查 `storage/uploads` 是否存在，运行用户是否有写权限。
