# ytdlpgo

一个基于 **Wails v2 + React** 的桌面视频/音频下载工具，底层调用 [yt-dlp](https://github.com/yt-dlp/yt-dlp) 与 [ffmpeg](https://ffmpeg.org/)。

## 功能

- **视频页**：粘贴视频 URL 或点击「粘贴」读取剪贴板，自动加载可用视频格式（分辨率 / 格式 / 大小 / 编码），按大小倒序，选择后下载（视频流 + 最佳音频）。
- **音频页**：加载纯音频格式，下载音频；支持可选**转码**（mp3 / m4a / aac / flac / wav / opus / vorbis）。
- **时段截取（可选）**：勾选后按 `HH:MM:SS` 指定开始/结束时间，前端校验格式、先后顺序、是否超出视频时长，后端通过 `--download-sections` 执行。
- **下载日志实时回显**：进度条、速度、剩余时间与状态实时更新，自动滚动到底部。
- **保存与打开目录**：默认保存到 `~/Downloads/ytdlpgo`（不存在时自动创建），可浏览选择其他目录，一键在文件管理器中打开。
- **设置页**：配置 yt-dlp / ffmpeg 路径，支持「浏览」选择、「自动检测」、保存到本地配置文件，并展示工具版本与检测状态。
- **侧边栏**：视频下载 / 音频下载 / 设置三个入口，底部常驻工具状态与版本。
- **页面切换保持状态**：基于 `keepalive-for-react`（keep-alive），切到设置页再回来内容不丢失。
- **跨平台**：macOS / Linux / Windows 的路径与可执行文件查找已分别处理，Windows 下隐藏控制台窗口。
- **登录态**：Windows 通过 `--cookies-from-browser firefox` 复用本机 Firefox 的 cookies（避开 Chrome App-Bound Encryption）；macOS / Linux 继续使用 Chrome。

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | Go 1.25、Wails v2.16 |
| 前端 | React 19、Ant Design、React Router 7、keepalive-for-react、Vite 7 |
| 外部工具 | yt-dlp、ffmpeg |

## 环境要求

- Go **1.25+**
- Node.js **22**（见 `.nvmrc`；Vite 7 需要 Node ≥ 20.19，Node 12 会构建失败）
- Wails CLI v2.16：`go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- **yt-dlp** 与 **ffmpeg**（macOS 可用 `brew install yt-dlp ffmpeg`）
- 平台依赖：macOS 需 Xcode Command Line Tools；Windows 需 WebView2；Linux 需 GTK/WebKit（详见 [Wails 文档](https://wails.io/docs/gettingstarted/installation)）

## 快速开始

```bash
nvm use          # 使用 .nvmrc 指定的 Node 22
wails dev        # 开发模式（热重载）
wails build      # 生产构建，产物在 build/bin
```

首次启动后，进入「设置」页配置 yt-dlp 与 ffmpeg 路径（可直接点「自动检测」）。

## 使用说明

1. 打开「视频下载」页，粘贴视频 URL，或点击输入框右侧「粘贴」从剪贴板填入。
2. 等待格式列表加载，在「视频分辨率 / 音频格式」下拉中选择。
3. 确认保存位置（默认 `~/Downloads/ytdlpgo`，可点击「浏览」更换）。
4. 可选：
   - 勾选「下载指定时段」并填写开始/结束时间；
   - 音频页可勾选「转码为其他格式」并选择输出格式。
5. 点击「下载」，执行过程会实时输出到「下载详情」；完成后可点击「打开文件夹」。

> 时段截取与转码都依赖 ffmpeg；未配置时相关控件与下载按钮会被禁用并提示。
> 需要登录态时：Windows 请确保本机 Firefox 已登录对应网站，程序会通过 `--cookies-from-browser firefox` 读取 cookies；macOS / Linux 使用 Chrome。

## 配置

配置文件位于系统配置目录：

| 平台 | 路径 |
|---|---|
| macOS | `~/Library/Application Support/ytdlpgo/settings.json` |
| Windows | `%AppData%\ytdlpgo\settings.json` |
| Linux | `~/.config/ytdlpgo/settings.json` |

字段：

```json
{
  "ytdlpPath": "/opt/homebrew/bin/yt-dlp",
  "ffmpegPath": "/opt/homebrew/bin/ffmpeg"
}
```

## 项目结构

```
.
├── main.go                  # Wails 入口、embed 前端资源
├── app.go                   # App 结构体 + 所有绑定方法（薄门面）
├── wails.json               # Wails 配置
├── .nvmrc                   # Node 版本（22）
├── build/                   # Wails 各平台打包资源
├── internal/
│   ├── config/settings.go   # 设置读写
│   ├── media/
│   │   ├── models.go        # 格式/结果数据类型
│   │   ├── formats.go       # 拉取并过滤视频/音频格式
│   │   └── download.go      # 执行下载、时段校验、日志流
│   └── platform/
│       ├── exec.go          # 跨平台可执行文件查找、PATH
│       ├── exec_unix.go     # 非 Windows
│       └── exec_windows.go  # Windows 隐藏控制台
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── wailsjs/             # 自动生成的绑定（勿手改）
    └── src/
        ├── main.jsx
        ├── App.jsx          # 路由表
        ├── components/      # Layout / PageHeader / MediaDownloadPage / Icons
        ├── pages/           # VideoPage / AudioPage / SettingsPage
        ├── hooks/           # useToolStatus（工具状态刷新）
        ├── utils/           # 时间、格式、进度解析
        └── styles/          # global.css / App.css
```

## 开发说明

- 所有 npm 命令请在 `frontend/` 下执行（前端依赖在 `frontend/package.json`）。
- 修改 Go 文件后，`wails dev` / `wails build` 会自动重新生成 `frontend/wailsjs` 绑定；也可手动执行 `wails generate module`。
- **不要手动修改 `frontend/wailsjs/**`**，它们是自动生成文件。
- 绑定路径固定为 `wailsjs/go/main/App`，因为 `App` 位于 `package main`。

## 常见问题

- **`vite` 报 `Unexpected token '.'` / `module.enableCompileCache`**：Node 版本过旧，执行 `nvm use`（切到 22）。
- **开发时窗口空白 / 连接断开**：已固定 Vite 为 `127.0.0.1:5173`；若端口被占用，先 `lsof -i :5173` 结束旧进程再重启。
- **时段截取或转码失败**：确认已安装 ffmpeg 并在设置页配置路径。
- **macOS 终端出现 `IMKClient` / `_TIPropertyValueIsValid` 日志**：系统输入法日志，无害。
- **Windows 打包后找不到 yt-dlp/ffmpeg**：可能未加入 PATH，请在设置页使用「浏览/自动检测」指定 `.exe` 路径。
