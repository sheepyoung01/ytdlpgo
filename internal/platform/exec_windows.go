//go:build windows

package platform

import (
	"os/exec"
	"syscall"

	"golang.org/x/sys/windows"
)

// HideWindow 隐藏 Windows 下执行 yt-dlp/ffmpeg 时弹出的控制台窗口
func HideWindow(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
}

// openInFileManager 通过 ShellExecuteW 打开路径。
// 不用 explorer.exe：给它设置 HideWindow（SW_HIDE）或以管理员权限启动应用时，
// 资源管理器窗口可能不会显示，且它成功时也会返回退出码 1，无法判断是否真的打开。
func openInFileManager(path string) error {
	verb, err := windows.UTF16PtrFromString("open")
	if err != nil {
		return err
	}
	target, err := windows.UTF16PtrFromString(path)
	if err != nil {
		return err
	}
	return windows.ShellExecute(0, verb, target, nil, nil, windows.SW_SHOWNORMAL)
}
