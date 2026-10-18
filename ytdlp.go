package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"strconv"
	"time"
)

// ytdlpInfo yt-dlp -J 输出中我们用到的部分
type ytdlpInfo struct {
	Duration float64       `json:"duration"` // 视频总时长（秒）
	Formats  []ytdlpFormat `json:"formats"`
}

type ytdlpFormat struct {
	FormatID       string   `json:"format_id"`
	Ext            string   `json:"ext"`
	Resolution     string   `json:"resolution"`
	Filesize       *int64   `json:"filesize"`
	FilesizeApprox *int64   `json:"filesize_approx"`
	Tbr            *float64 `json:"tbr"`
	Vcodec         string   `json:"vcodec"`
	Acodec         string   `json:"acodec"`
}

// fetchInfo 运行 yt-dlp -J 获取视频信息（含格式列表）
func (a *App) fetchInfo(videoURL string) (ytdlpInfo, error) {
	var info ytdlpInfo

	s, err := a.GetSettings()
	if err != nil {
		return info, err
	}
	if s.YtdlpPath == "" {
		return info, fmt.Errorf("请先在设置中填写 yt-dlp 路径")
	}

	ctx, cancel := context.WithTimeout(a.ctx, 90*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, s.YtdlpPath,
		"--cookies-from-browser", "chrome",
		"--no-warnings",
		"-J",
		videoURL,
	)
	cmd.Env = commandEnv()
	hideWindow(cmd)
	out, err := cmd.Output() // stdout；yt-dlp 的警告在 stderr
	if err != nil {
		if ee, ok := err.(*exec.ExitError); ok {
			return info, fmt.Errorf("yt-dlp 执行失败: %s", string(ee.Stderr))
		}
		return info, err
	}

	if err := json.Unmarshal(out, &info); err != nil {
		return info, err
	}
	return info, nil
}

// humanSize 把字节数格式化为可读大小
func humanSize(n int64) string {
	const u = 1024.0
	f := float64(n)
	switch {
	case f >= u*u*u:
		return fmt.Sprintf("%.2fGiB", f/(u*u*u))
	case f >= u*u:
		return fmt.Sprintf("%.2fMiB", f/(u*u))
	case f >= u:
		return fmt.Sprintf("%.2fKiB", f/u)
	default:
		return fmt.Sprintf("%dB", n)
	}
}

// formatFileSize 返回可读大小和原始字节数（优先精确值，其次估算值）
func formatFileSize(size, approx *int64) (string, int64) {
	if size != nil {
		return humanSize(*size), *size
	}
	if approx != nil {
		return "≈" + humanSize(*approx), *approx
	}
	return "", 0
}

// formatTbr 返回码率文本
func formatTbr(tbr *float64) string {
	if tbr == nil {
		return ""
	}
	return strconv.FormatFloat(*tbr, 'f', 0, 64) + "k"
}
