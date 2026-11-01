//go:build windows

package updater

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
)

func installPlatform(installerPath string) error {
	executable, err := os.Executable()
	if err != nil {
		return err
	}

	tempDir := filepath.Dir(installerPath)
	quote := func(value string) string {
		return "'" + strings.ReplaceAll(value, "'", "''") + "'"
	}

	script := fmt.Sprintf(`
$ErrorActionPreference = 'SilentlyContinue'
Wait-Process -Id %d -Timeout 60
Start-Sleep -Milliseconds 500
Start-Process -FilePath %s -ArgumentList '/S' -PassThru -Wait
Start-Sleep -Seconds 2
Start-Process -FilePath %s
Remove-Item -LiteralPath %s -Force
Remove-Item -LiteralPath %s -Recurse -Force
`, os.Getpid(), quote(installerPath), quote(executable), quote(installerPath), quote(tempDir))

	cmd := exec.Command(
		"powershell.exe",
		"-NoProfile",
		"-NonInteractive",
		"-WindowStyle", "Hidden",
		"-ExecutionPolicy", "Bypass",
		"-Command", script,
	)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: syscall.CREATE_NEW_PROCESS_GROUP,
	}
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("启动更新程序失败: %w", err)
	}
	_ = cmd.Process.Release()
	return nil
}
