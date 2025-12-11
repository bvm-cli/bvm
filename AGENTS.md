# Repository Guidelines

## 项目结构与模块组织
CLI 核心和跨平台逻辑集中在 `src/`，其中 `src/commands/*` 以动词命名拆分每个子命令，`src/api.ts`、`src/constants.ts`、`src/utils.ts` 为共享依赖；`src/bvm-init.*` 和 `src/rc.ts` 负责 shell 初始化片段。安装脚本位于仓库根目录的 `install.sh`，用于一键引导。所有自动化测试存于 `test/`，按运行层级拆分为 `api.test.ts` 与 `integration.test.ts`。

## 构建、测试与开发命令
- `bun install`：同步依赖，保持 Bun 和 npm lockfile 一致。
- `bun run src/index.ts` 或 `npm run dev`：在本地直接使用 ts-node + Bun 执行 CLI，便于断点与输出调试。
- `bun build src/index.ts --compile --outfile bvm`：生成零依赖二进制，请确保在 macOS/Linux/Windows 上分别构建并上传，对应体系架构。
- `bun test test/*.ts` 或 `bun test --coverage`：运行快速单测及覆盖率，CI 入口保持一致。

## 编码风格与命名约定
整体采用 TypeScript 严格模式（`tsconfig.json` 中 `strict: true`）。保持两空格缩进、单引号字符串、顶层 `import` 排序为内建、第三方、本地模块。新命令必须在 `src/commands/<verb>.ts` 中实现并在 `src/index.ts` 注册，同时提供纯函数封装，便于单测替换。统一使用 `chalk` 与 `ora` 管理输出，避免直接 `console.log`。

## 测试指南
利用 Bun 内建测试框架，文件命名遵循 `<feature>.test.ts`。API 层 mocked I/O，集成层可通过 `BVM_DIR` 临时目录验证真实安装流程。新增功能需至少包含 happy-path 与错误支路，并在 PR 中粘贴 `bun test --coverage` 摘要，目标是保持主要命令覆盖率 >80%。

## 提交与 PR 规范
历史记录采用 `type: subject`（如 `feat: implement upgrade command`，`docs:`、`fix:` 等），提交信息要求祈使句。PR 需包含：动机背景、关键更改列表、测试输出、关联 issue/讨论、涉及终端截图（若 CLI 输出改动）。若触及安装脚本或 shell 片段，需说明已在 bash/zsh/fish 上验证。

## 安全与配置提示
命令行大量接触用户文件系统，务必复查路径拼接并尊重 `BVM_DIR` 与 `BVM_GITHUB_MIRROR` 环境变量，不要写入未声明目录。网络请求统一通过 `src/api.ts` 的 `axios` 封装，复用超时与镜像选择逻辑。任何需要管理员权限的说明必须在文档与 CLI 提示中明确标注，遵循最小权限原则。
