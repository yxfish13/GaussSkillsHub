# Gauss Skills Hub Docker 离线部署

这套交付物用于 `amd64/x86_64` 内网机器。目标机器只需要：

- Docker Engine
- Docker Compose

不需要单独安装：

- Node.js
- npm
- PostgreSQL

## 交付目录说明

离线目录中会包含：

- `images.tar`
- `docker-compose.yml`
- `.env.docker.example`
- `README-docker.md`
- `RELEASE-METADATA.txt`
- `SHA256SUMS`

## 外网机器打包

在有网络的打包机上执行：

```bash
bash scripts/build-offline-docker-bundle.sh
```

如果你想显式指定版本号：

```bash
bash scripts/build-offline-docker-bundle.sh v2026.03.30
```

执行后会生成：

- `release/docker-offline/gauss-skills-hub-docker-offline-<版本>-amd64/`
- `release/gauss-skills-hub-docker-offline-<版本>-amd64.tar.gz`
- `release/gauss-skills-hub-docker-offline-<版本>-amd64.sha256`

## 内网机器部署

1. 解压离线目录

```bash
tar -xzf gauss-skills-hub-docker-offline-<版本>-amd64.tar.gz
cd gauss-skills-hub-docker-offline-<版本>-amd64
```

2. 导入镜像

```bash
docker load -i images.tar
```

也可以先校验压缩包：

```bash
sha256sum -c gauss-skills-hub-docker-offline-<版本>-amd64.sha256
```

3. 复制并修改环境变量

```bash
cp .env.docker.example .env
```

至少修改这些值：

- `POSTGRES_PASSWORD`
- `ADMIN_PASSWORD`
- `AUTH_SECRET`

4. 启动服务

```bash
docker compose up -d
```

5. 查看日志

```bash
docker compose logs -f app
```

## 访问地址

- 首页：`http://<服务器IP>:3100/`
- Skills 广场：`http://<服务器IP>:3100/skills`
- 提交页：`http://<服务器IP>:3100/submit`
- 后台登录：`http://<服务器IP>:3100/admin/login`

## 数据位置

- PostgreSQL 数据：compose volume `postgres_data`
- 上传文件：compose volume `app_uploads`

升级镜像或重启容器时，这两个卷会保留。

## 常用命令

停止：

```bash
docker compose down
```

查看容器状态：

```bash
docker compose ps
```

重新启动：

```bash
docker compose up -d
```

## 说明

应用容器启动时会自动执行：

- `prisma db push`
- `npm run prisma:seed`

所以第一次启动时会自动初始化数据库结构和管理员账号。

## Git 建议

建议将这些文件提交到 Git：

- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`
- `.env.docker.example`
- `docker/app-entrypoint.sh`
- `scripts/build-offline-docker-bundle.sh`
- `README-docker.md`

不建议将这些生成产物提交到 Git：

- `images.tar`
- `*.tar.gz`
- `*.zip`
