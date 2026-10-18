package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

// ffmpegName 返回当前平台的 ffmpeg 可执行文件名
func ffmpegName() string {
	if runtime.GOOS == "windows" {
		return "ffmpeg.exe"
	}
	return "ffmpeg"
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

// commandEnv 返回带有常见目录的 PATH，避免 GUI 启动时找不到 ffmpeg。
// 使用 os.PathListSeparator，Windows 下自动是 ";"，其他平台是 ":"。
func commandEnv() []string {
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

// ffmpegCandidates 返回各平台常见的 ffmpeg 位置
func ffmpegCandidates() []string {
	name := ffmpegName()

	var dirs []string
	switch runtime.GOOS {
	case "darwin":
		dirs = []string{"/opt/homebrew/bin", "/usr/local/bin", "/usr/bin"}
	case "linux":
		dirs = []string{"/usr/bin", "/usr/local/bin", "/snap/bin"}
	case "windows":
		if pf := os.Getenv("ProgramFiles"); pf != "" {
			dirs = append(dirs, filepath.Join(pf, "ffmpeg", "bin"))
		}
		if la := os.Getenv("LOCALAPPDATA"); la != "" {
			dirs = append(dirs, filepath.Join(la, "Microsoft", "WinGet", "Links"))
		}
		dirs = append(dirs, `C:\ffmpeg\bin`)
	}

	candidates := make([]string, 0, len(dirs))
	for _, dir := range dirs {
		candidates = append(candidates, filepath.Join(dir, name))
	}
	return candidates
}

// findFFmpeg 查找 ffmpeg：先查 PATH，再查各平台常见目录
func findFFmpeg() string {
	if p, err := exec.LookPath(ffmpegName()); err == nil {
		return p
	}
	for _, p := range ffmpegCandidates() {
		if st, err := os.Stat(p); err == nil && !st.IsDir() {
			return p
		}
	}
	return ""
}
