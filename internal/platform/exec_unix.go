//go:build !windows

package platform

import (
	"os/exec"
	"runtime"
)

// HideWindow 在非 Windows 平台上无需处理
func HideWindow(cmd *exec.Cmd) {}

// openInFileManager 用系统文件管理器打开路径
func openInFileManager(path string) error {
	opener := "xdg-open"
	if runtime.GOOS == "darwin" {
		opener = "open"
	}
	cmd := exec.Command(opener, path)
	if err := cmd.Start(); err != nil {
		return err
	}
	go func() { _ = cmd.Wait() }()
	return nil
}
