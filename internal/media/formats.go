package media

import (
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"sort"
	"strconv"
	"time"

	"ytdlpgo/internal/platform"
)

// FetchInfo 运行 yt-dlp -J 获取视频信息（含格式列表）
func FetchInfo(ctx context.Context, ytdlpPath, videoURL string) (ytdlpInfo, error) {
	var info ytdlpInfo

	if ytdlpPath == "" {
		return info, fmt.Errorf("请先在设置中填写 yt-dlp 路径")
	}

	ctx, cancel := context.WithTimeout(ctx, 90*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, ytdlpPath,
		"--cookies-from-browser", "chrome",
		"--no-warnings",
		"--no-playlist",
		"-J",
		videoURL,
	)
	cmd.Env = platform.CommandEnv()
	platform.HideWindow(cmd)

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

// ListVideoFormats 返回带视频的格式，按大小倒序
func ListVideoFormats(ctx context.Context, ytdlpPath, videoURL string) (VideoFormats, error) {
	info, err := FetchInfo(ctx, ytdlpPath, videoURL)
	if err != nil {
		return VideoFormats{Formats: []Format{}}, err
	}

	var result = make([]Format, 0)
	seen := map[string]bool{}
	for _, f := range info.Formats {
		// 只要带视频的；纯音频的 vcodec 是 "none"
		if f.Vcodec == "" || f.Vcodec == "none" {
			continue
		}
		if seen[f.FormatID] {
			continue
		}
		seen[f.FormatID] = true

		size, sizeBytes := formatFileSize(f.Filesize, f.FilesizeApprox)
		result = append(result, Format{
			ID: f.FormatID, Ext: f.Ext, Resolution: f.Resolution,
			FileSize: size, Tbr: formatTbr(f.Tbr), Vcodec: f.Vcodec,
			sizeBytes: sizeBytes,
		})
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].sizeBytes > result[j].sizeBytes
	})
	return VideoFormats{Formats: result, Duration: info.Duration}, nil
}

// ListAudioFormats 返回纯音频格式（vcodec 为 none 且 acodec 不为 none），按大小倒序
func ListAudioFormats(ctx context.Context, ytdlpPath, videoURL string) (AudioFormats, error) {
	info, err := FetchInfo(ctx, ytdlpPath, videoURL)
	if err != nil {
		return AudioFormats{Formats: []AudioFormat{}}, err
	}

	var result = make([]AudioFormat, 0)
	seen := map[string]bool{}
	for _, f := range info.Formats {
		// 只要纯音频：带视频的跳过
		if f.Vcodec != "" && f.Vcodec != "none" {
			continue
		}
		if f.Acodec == "" || f.Acodec == "none" {
			continue
		}
		if seen[f.FormatID] {
			continue
		}
		seen[f.FormatID] = true

		size, sizeBytes := formatFileSize(f.Filesize, f.FilesizeApprox)
		result = append(result, AudioFormat{
			ID: f.FormatID, Ext: f.Ext, FileSize: size,
			Tbr: formatTbr(f.Tbr), Acodec: f.Acodec,
			sizeBytes: sizeBytes,
		})
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].sizeBytes > result[j].sizeBytes
	})
	return AudioFormats{Formats: result, Duration: info.Duration}, nil
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
