package main

import "github.com/wailsapp/wails/v2/pkg/runtime"

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
