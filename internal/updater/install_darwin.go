//go:build darwin

package updater

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
)

func installPlatform(installerPath string) error {
	executable, err := os.Executable()
	if err != nil {
		return err
	}

	bundle := filepath.Dir(filepath.Dir(filepath.Dir(executable)))
	if !strings.HasSuffix(bundle, ".app") {
		return fmt.Errorf("无法定位应用包路径")
	}
	if strings.Contains(bundle, "/AppTranslocation/") {
		return fmt.Errorf("请先将应用移动到 Applications 后再更新")
	}

	installDir := filepath.Dir(bundle)
	probe := filepath.Join(installDir, ".ytdlpgo-update-check")
	if err := os.WriteFile(probe, []byte{}, 0o600); err != nil {
		return fmt.Errorf("应用安装目录不可写，请将应用移动到 Applications 后重试")
	}
	_ = os.Remove(probe)

	tempDir := filepath.Dir(installerPath)
	mountDir := filepath.Join(tempDir, "mount")
	scriptPath := filepath.Join(tempDir, "update.sh")

	script := `#!/bin/sh
set -u
pid="$1"
dmg="$2"
target="$3"
mount="$4"
tmp="$5"
i=0
while kill -0 "$pid" 2>/dev/null && [ "$i" -lt 60 ]; do
  sleep 1
  i=$((i+1))
done
if mkdir -p "$mount" && /usr/bin/hdiutil attach "$dmg" -nobrowse -readonly -mountpoint "$mount" >/dev/null 2>&1; then
  source_app=""
  for candidate in "$mount"/*.app; do
    if [ -d "$candidate" ]; then
      source_app="$candidate"
      break
    fi
  done
  if [ -n "$source_app" ]; then
    rm -rf "$target"
    /usr/bin/ditto "$source_app" "$target"
    /usr/bin/open "$target"
  fi
  /usr/bin/hdiutil detach "$mount" -force >/dev/null 2>&1 || true
fi
rm -rf "$tmp"
`
	if err := os.WriteFile(scriptPath, []byte(script), 0o700); err != nil {
		return err
	}

	cmd := exec.Command(
		"/bin/sh",
		scriptPath,
		strconv.Itoa(os.Getpid()),
		installerPath,
		bundle,
		mountDir,
		tempDir,
	)
	cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("启动更新程序失败: %w", err)
	}
	_ = cmd.Process.Release()
	return nil
}
