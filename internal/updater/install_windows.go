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
$log = Join-Path $env:TEMP 'ytdlpgo-update.log'
function Write-Log([string]$message) {
  Add-Content -LiteralPath $log -Value ("[{0}] {1}" -f (Get-Date -Format o), $message)
}
Set-Content -LiteralPath $log -Value ("=== ytdlpgo update " + (Get-Date -Format o) + " ===")
Write-Log ("installer=" + %s)
Write-Log ("current=" + %s)

Wait-Process -Id %d -Timeout 60
Write-Log "application exited or wait timeout"
Start-Sleep -Milliseconds 500

try {
  $installer = Start-Process -FilePath %s -ArgumentList '/S' -PassThru -Wait -ErrorAction Stop
  Write-Log ("installer exit=" + $installer.ExitCode)
} catch {
  Write-Log ("installer error=" + $_.Exception.Message)
}

Start-Sleep -Seconds 2
$userExe = Join-Path $env:LOCALAPPDATA 'Programs\ytdlpgo\ytdlpgo.exe'
$programExe = Join-Path $env:ProgramFiles 'ytdlpgo\ytdlpgo\ytdlpgo.exe'
if (Test-Path -LiteralPath $userExe) {
  Write-Log ("launch installed=" + $userExe)
  Start-Process -FilePath $userExe
} elseif (Test-Path -LiteralPath $programExe) {
  Write-Log ("launch installed=" + $programExe)
  Start-Process -FilePath $programExe
} else {
  Write-Log ("launch fallback=" + %s)
  Start-Process -FilePath %s
}

Remove-Item -LiteralPath %s -Force
Remove-Item -LiteralPath %s -Recurse -Force
`,
		quote(installerPath),
		quote(executable),
		os.Getpid(),
		quote(installerPath),
		quote(executable),
		quote(executable),
		quote(installerPath),
		quote(tempDir),
	)

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
