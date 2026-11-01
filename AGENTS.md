# AGENTS.md

面向在本仓库工作的 AI 代理与开发者的操作指引。**动手前先读本文件。**

## 项目概览

Wails v2 + React 的桌面应用，调用外部 `yt-dlp` / `ffmpeg` 完成视频/音频下载。
根目录是 Go `package main`（Wails 入口 + 绑定门面），业务逻辑在 `internal/`，前端在 `frontend/`。

## 常用命令

| 目的 | 命令 | 备注 |
|---|---|---|
| 开发（热重载） | `wails dev` | 先 `nvm use`（Node 22） |
| 生产构建 | `wails build` | 产物在 `build/bin` |
| 后端编译 | `go build ./...` | 在仓库根目录 |
| 后端静态检查 | `go vet ./...` | |
| 代码格式 | `gofmt -l .` | 应无输出；必要时 `gofmt -w .` |
| 前端构建 | `cd frontend && npm run build` | **npm 命令只在 `frontend/` 下执行** |
| 重新生成绑定 | `wails generate module` | `wails dev/build` 也会自动生成 |

> 仓库根目录的 `package.json` / `package-lock.json` 是误生成的冗余文件，**不要**在根目录安装依赖；前端依赖以 `frontend/package.json` 为准。

## 架构与职责

```
main.go              Wails 启动、embed frontend/dist、窗口配置
app.go               App 结构体 + 所有 Wails 绑定方法（薄门面，只做参数转换与事件发送）
internal/config      设置类型与读写（os.UserConfigDir 下的 settings.json）
internal/platform    跨平台可执行文件查找、PATH 环境、Windows HideWindow
internal/media       格式拉取/过滤、下载执行、时段校验、日志流
internal/updater     GitHub Release 检查、安装包下载校验、静默安装
frontend/src/pages       页面组件（VideoPage / AudioPage / SettingsPage）
frontend/src/components  共享组件（Layout / ErrorBoundary / MediaDownloadPage）
frontend/src/utils       纯函数工具（时间解析等）
frontend/src/styles      全局与页面样式
```

### 数据流

- 前端 → `app.go` 绑定方法 → `internal/*` → 返回结构体 / 通过事件推送日志。
- 下载日志事件名：视频 `download-log`，音频 `audio-log`。
- 更新进度事件名：`update-progress`（阶段：downloading / verifying / installing / restarting）。
- 设置保存后前端会 `EventsEmit('settings-changed')`，媒体页监听以刷新 ffmpeg 状态。
- 发布流程由 `.github/workflows/release.yml` 负责：推送 `v*` tag 后构建 Windows NSIS 安装器与 macOS DMG，生成 `SHA256SUMS.txt` 并发布到 GitHub Release。

## 关键约定（务必遵守）

1. **不要手改 `frontend/wailsjs/**`**：自动生成。改了 Go 导出方法后，用 `wails dev` / `wails build` / `wails generate module` 重新生成。
2. **`App` 保持在 `package main`**：绑定路径依赖它（`wailsjs/go/main/App`）。若移动 `App` 到其他包，必须同步修改前端所有 wailsjs 相对导入与事件调用。
3. **`internal/media`、`internal/platform`、`internal/config` 不依赖 Wails runtime**：保持可测试、可复用。日志通过 `emit func(string)` 回调向上传递，由 `app.go` 转成事件。
4. **跨平台**：不要硬编码 Unix 路径。使用 `os.UserConfigDir`、`filepath.Join`、`os.PathListSeparator`；可执行文件查找统一放 `internal/platform`。Windows 下要隐藏子进程控制台（`HideWindow`）。
5. **外部进程**：用 `exec.Command` 直接传参，不经过 shell，避免引号/空格/平台差异问题。
6. **时段与转码依赖 ffmpeg**：前端在启用相关功能但未配置 `ffmpegPath` 时，必须禁用输入/下拉与下载按钮并提示；后端 `RunDownload` 也要兜底校验。
7. **UI 文案为中文**；除非用户明确要求，不要添加 emoji。
8. **样式集中管理**：全局样式在 `main.jsx` 引入（`styles/global.css` + `styles/App.css`），页面组件不要再各自 import `App.css`。

## 新增页面

1. 在 `frontend/src/pages/` 新建组件。
2. 在 `frontend/src/App.jsx` 的路由表中注册（布局路由 `<Route element={<Layout />}>` 下）。
3. 在 `frontend/src/components/Layout.jsx` 的 `NAV_ITEMS` 增加导航项。
4. 页面会自动被 keep-alive 缓存（`KeepAlive` + `useOutlet`），无需额外处理；不要再用 `<Routes>` 包 `KeepAlive`（会导致缓存失效）。

## 新增后端能力

1. 业务实现放 `internal/` 对应包，返回普通 Go 类型。
2. 在 `app.go` 增加薄封装方法（读设置 → 调 internal → 必要时 `runtime.EventsEmit`）。
3. 运行 `wails generate module` 更新绑定。
4. 前端从 `frontend/wailsjs/go/main/App` 导入调用。注意从 `pages/` 或 `components/` 出发的相对路径是 `../../wailsjs/...`。

## 验证清单

- `gofmt -l .` 无输出
- `go build ./... && go vet ./...` 通过
- `cd frontend && npm run build` 通过
- 涉及 UI 时，建议做一次无头渲染冒烟测试：构建 `frontend/dist` 后，用临时副本注入 `window.go` / `window.runtime` stub，再用无头 Chrome 截图检查（不要把临时文件提交进仓库）。

## 已知注意事项

- **Node 版本**：`.nvmrc` 为 22；Node 12 会导致 Vite 7 构建失败。
- **开发服务器**：Vite 固定 `127.0.0.1:5173`（`strictPort`），`wails.json` 的 `frontend:dev:serverUrl` 也固定为该地址，避免 macOS 上 localhost 解析到 IPv6 造成空白窗口。
- **antd**：`package.json` 当前为 antd v6，同时保留 `@ant-design/v5-patch-for-react-19`。升级/降级 antd 时需重新验证 React 19 兼容性与构建。
- **cookies**：所有抓取/下载统一通过 `platform.CookieBrowser()` 选择浏览器：Windows 使用 Firefox（规避 Chrome App-Bound Encryption），macOS / Linux 使用 Chrome。要求目标浏览器已登录目标站点。
