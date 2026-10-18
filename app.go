package main

import (
	"context"
	"fmt"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"ytdlpgo/internal/config"
	"ytdlpgo/internal/media"
	"ytdlpgo/internal/platform"
)

// App struct（Wails 绑定的门面层，业务逻辑放在 internal/ 各包中）
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// GetClipboardText 读取剪贴板文本
func (a *App) GetClipboardText() (string, error) {
	return runtime.ClipboardGetText(a.ctx)
}

// SelectDirectory 打开系统目录选择对话框，返回用户选择的本地目录
func (a *App) SelectDirectory() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择下载目录",
	})
}

// SelectFile 选择已安装的 yt-dlp 可执行文件
func (a *App) SelectFile() (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择 yt-dlp 可执行文件",
	})
}

// SelectFFmpeg 选择已安装的 ffmpeg 可执行文件
func (a *App) SelectFFmpeg() (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择 ffmpeg 可执行文件",
	})
}

// GetSettings 读取设置文件
func (a *App) GetSettings() (config.Settings, error) {
	return config.Load()
}

// SaveSettings 保存设置
func (a *App) SaveSettings(s config.Settings) error {
	return config.Save(s)
}

// DetectYtdlp 自动检测本机安装的 yt-dlp
func (a *App) DetectYtdlp() (string, error) {
	if p := platform.FindYtdlp(); p != "" {
		return p, nil
	}
	return "", fmt.Errorf("未检测到 yt-dlp，请先安装（或手动选择安装路径）")
}

// DetectFFmpeg 自动检测本机安装的 ffmpeg
func (a *App) DetectFFmpeg() (string, error) {
	if p := platform.FindFFmpeg(); p != "" {
		return p, nil
	}
	return "", fmt.Errorf("未检测到 ffmpeg，请先安装（或手动选择安装路径）")
}

// ListVideoFormats 读取视频格式列表
func (a *App) ListVideoFormats(videoURL string) (media.VideoFormats, error) {
	s, err := config.Load()
	if err != nil {
		return media.VideoFormats{}, err
	}
	return media.ListVideoFormats(a.ctx, s.YtdlpPath, videoURL)
}

// ListAudioFormats 读取音频格式列表
func (a *App) ListAudioFormats(videoURL string) (media.AudioFormats, error) {
	s, err := config.Load()
	if err != nil {
		return media.AudioFormats{}, err
	}
	return media.ListAudioFormats(a.ctx, s.YtdlpPath, videoURL)
}

// DownloadVideo 视频下载：选中的视频格式 + 最佳音频
func (a *App) DownloadVideo(videoURL, formatID, dir, section, _ string) error {
	s, err := config.Load()
	if err != nil {
		return err
	}
	return media.RunDownload(a.ctx, media.DownloadOptions{
		YtdlpPath:  s.YtdlpPath,
		FfmpegPath: s.FfmpegPath,
		FormatExpr: formatID + "+ba",
		VideoURL:   videoURL,
		Dir:        dir,
		Section:    section,
	}, func(line string) {
		runtime.EventsEmit(a.ctx, "download-log", line)
	})
}

// DownloadAudio 音频下载：选中的音频格式，可选转码
func (a *App) DownloadAudio(videoURL, formatID, dir, section, audioFormat string) error {
	s, err := config.Load()
	if err != nil {
		return err
	}
	return media.RunDownload(a.ctx, media.DownloadOptions{
		YtdlpPath:   s.YtdlpPath,
		FfmpegPath:  s.FfmpegPath,
		FormatExpr:  formatID,
		VideoURL:    videoURL,
		Dir:         dir,
		Section:     section,
		AudioFormat: audioFormat,
	}, func(line string) {
		runtime.EventsEmit(a.ctx, "audio-log", line)
	})
}
