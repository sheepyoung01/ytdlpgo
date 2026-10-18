//go:build !windows

package main

import "os/exec"

// hideWindow 在非 Windows 平台上无需处理
func hideWindow(cmd *exec.Cmd) {}
