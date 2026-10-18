//go:build !windows

package platform

import "os/exec"

// HideWindow 在非 Windows 平台上无需处理
func HideWindow(cmd *exec.Cmd) {}
