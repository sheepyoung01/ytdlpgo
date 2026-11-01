package platform

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

// executableNames 返回某个可执行文件在当前平台的可能名字
func executableNames(base string) []string {
	if runtime.GOOS == "windows" {
		return []string{base + ".exe", base}
	}
	return []string{base}
}

// extraPathDirs 返回需要补充到 PATH 的常见可执行文件目录（按平台区分）
func extraPathDirs() []string {
	switch runtime.GOOS {
	case "darwin":
		return []string{"/opt/homebrew/bin", "/usr/local/bin"}
	case "linux":
		return []string{"/usr/local/bin", "/snap/bin"}
	default:
		return nil // Windows 等平台沿用系统 PATH
	}
}

// CommandEnv 返回带有常见目录的 PATH，避免 GUI 启动时找不到 ffmpeg。
// 使用 os.PathListSeparator，Windows 下自动是 ";"，其他平台是 ":"。
func CommandEnv() []string {
	path := os.Getenv("PATH")
	dirs := extraPathDirs()
	for i := len(dirs) - 1; i >= 0; i-- {
		dir := dirs[i]
		if !strings.Contains(path, dir) {
			path = dir + string(os.PathListSeparator) + path
		}
	}
	return append(os.Environ(), "PATH="+path)
}

// searchDirs 返回各平台常见的可执行文件目录
func searchDirs() []string {
	dirs := append([]string{}, extraPathDirs()...)

	switch runtime.GOOS {
	case "windows":
		if pf := os.Getenv("ProgramFiles"); pf != "" {
			dirs = append(dirs, filepath.Join(pf, "ffmpeg", "bin"))
		}
		if la := os.Getenv("LOCALAPPDATA"); la != "" {
			dirs = append(dirs,
				filepath.Join(la, "Microsoft", "WinGet", "Links"),
				filepath.Join(la, "Programs", "Python", "Scripts"),
			)
		}
		if up := os.Getenv("USERPROFILE"); up != "" {
			dirs = append(dirs, filepath.Join(up, "scoop", "shims"))
		}
		dirs = append(dirs, `C:\ffmpeg\bin`, `C:\ProgramData\chocolatey\bin`)
	default:
		dirs = append(dirs, "/usr/bin")
		if home, err := os.UserHomeDir(); err == nil {
			dirs = append(dirs, filepath.Join(home, ".local", "bin"))
		}
	}

	return dirs
}

// FindExecutable 先查 PATH，再查各平台常见目录
func FindExecutable(base string) string {
	for _, name := range executableNames(base) {
		if p, err := exec.LookPath(name); err == nil {
			return p
		}
	}
	for _, name := range executableNames(base) {
		for _, dir := range searchDirs() {
			p := filepath.Join(dir, name)
			if st, err := os.Stat(p); err == nil && !st.IsDir() {
				return p
			}
		}
	}
	return ""
}

// FindFFmpeg 查找 ffmpeg
func FindFFmpeg() string {
	return FindExecutable("ffmpeg")
}

// FindYtdlp 查找 yt-dlp
func FindYtdlp() string {
	return FindExecutable("yt-dlp")
}

// CookieBrowser 返回读取登录 Cookies 使用的浏览器。
// Windows 使用 Firefox，规避 Chrome 的 App-Bound Encryption；
// macOS / Linux 继续使用 Chrome。
func CookieBrowser() string {
	if runtime.GOOS == "windows" {
		return "firefox"
	}
	return "chrome"
}

// ExecutableVersion 运行可执行文件并返回标准输出（用于读取版本信息）
func ExecutableVersion(ctx context.Context, path string, args ...string) string {
	ctx, cancel := context.WithTimeout(ctx, 6*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, path, args...)
	cmd.Env = CommandEnv()
	HideWindow(cmd)

	out, err := cmd.Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(out))
}

// OpenInFileManager 用系统文件管理器打开路径（文件所在目录）
func OpenInFileManager(path string) error {
	path = strings.TrimSpace(path)
	if path == "" {
		return fmt.Errorf("路径为空")
	}
	info, err := os.Stat(path)
	if err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("目录不存在: %s", path)
		}
		return err
	}
	if !info.IsDir() {
		path = filepath.Dir(path)
	}
	return openInFileManager(path)
}
