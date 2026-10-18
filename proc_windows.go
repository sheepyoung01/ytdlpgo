//go:build windows

package main

import (
	"os/exec"
	"syscall"
)

// hideWindow 隐藏 Windows 下执行 yt-dlp/ffmpeg 时弹出的控制台窗口
func hideWindow(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
}
