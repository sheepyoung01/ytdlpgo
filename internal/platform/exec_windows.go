//go:build windows

package platform

import (
	"os/exec"
	"syscall"
)

// HideWindow 隐藏 Windows 下执行 yt-dlp/ffmpeg 时弹出的控制台窗口
func HideWindow(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
}
