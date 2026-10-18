package platform

import (
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
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
