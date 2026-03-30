# Gauss Skills Hub Offline Docker Implementation Plan

> **Goal:** 为项目增加适用于完全内网环境的离线 Docker 交付方案，包含应用镜像、PostgreSQL 镜像、compose 编排、离线导出脚本和中文使用说明。

## Task 1: Add Docker runtime files

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `docker-compose.yml`
- Create: `.env.docker.example`
- Create: `docker/app-entrypoint.sh`

**Implementation notes:**
- 使用多阶段构建
- 运行端口固定为 `3100`
- 通过 entrypoint 在启动时执行 `prisma db push` 和 `prisma:seed`
- `docker-compose.yml` 中配置 `postgres` 健康检查与持久化卷

## Task 2: Add offline bundle build script

**Files:**
- Create: `scripts/build-offline-docker-bundle.sh`

**Implementation notes:**
- 构建应用镜像 `gauss-skills-hub-app:offline-amd64`
- 拉取 `postgres:15-alpine`
- 导出 `images.tar`
- 生成 `release/docker-offline/` 目录
- 将 compose、env 模板和 Docker README 一起复制进去

## Task 3: Add Docker deployment documentation

**Files:**
- Update: `README.md`
- Create: `README-docker.md`

**Implementation notes:**
- 根 README 说明源码部署和 Docker 离线部署的区别
- Docker README 提供内网机器的逐步命令
- 明确需要修改的变量、数据卷位置、升级和备份要点

## Task 4: Validate the Docker artifacts locally

**Commands:**
- `bash scripts/build-offline-docker-bundle.sh`
- `docker compose config`
- `docker build -t gauss-skills-hub-app:test .`

**Expected results:**
- 离线目录生成成功
- compose 配置通过解析
- 应用镜像能完成构建

## Task 5: Final verification and reporting

**Commands:**
- `git status --short`
- 如有必要补充 `sha256sum release/docker-offline/images.tar`

**Expected results:**
- 仅包含预期新增/修改文件
- 可以明确告诉用户如何在内网机器上 `docker load` 后部署
