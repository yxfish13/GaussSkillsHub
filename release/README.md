# Release Artifacts

这个目录只用于本地生成交付物，不建议把二进制产物直接提交到 Git。

建议保留在 Git 中的内容：

- 本文件 `release/README.md`

建议通过脚本本地生成、不提交到 Git 的内容：

- `release/docker-offline/<version>-amd64/`
- `release/*.tar.gz`
- `release/*.zip`

当前离线 Docker 交付由下面脚本生成：

```bash
bash scripts/build-offline-docker-bundle.sh
```

默认会输出：

- 一个版本化目录，位于 `release/docker-offline/`
- 一个版本化总压缩包，位于 `release/`
- 对应的校验和文件
