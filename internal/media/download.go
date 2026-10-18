package media

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os/exec"
	"strconv"
	"strings"
	"sync"

	"ytdlpgo/internal/platform"
)

// DownloadOptions 下载参数
type DownloadOptions struct {
	YtdlpPath   string
	FfmpegPath  string
	FormatExpr  string
	VideoURL    string
	Dir         string
	Section     string // 形如 "60-120"（秒），为空表示完整下载
	AudioFormat string // 非空时通过 -x --audio-format 转码
}

// RunDownload 执行 yt-dlp，并把输出通过 emit 回调实时推给调用方
func RunDownload(ctx context.Context, opts DownloadOptions, emit func(string)) error {
	if opts.YtdlpPath == "" {
		return fmt.Errorf("请先在设置中填写 yt-dlp 路径")
	}
	if opts.Dir == "" {
		return fmt.Errorf("请先选择下载目录")
	}

	args := []string{
		"--cookies-from-browser", "chrome",
		"--newline", // 让进度逐行输出，方便读取
		"-f", opts.FormatExpr,
		"--no-update",
	}

	// 优先使用设置里的 ffmpeg 路径；未配置时再自动探测
	ffmpegPath := opts.FfmpegPath
	if ffmpegPath == "" {
		ffmpegPath = platform.FindFFmpeg()
	}
	if ffmpegPath != "" {
		args = append(args, "--ffmpeg-location", ffmpegPath)
	}

	if opts.AudioFormat != "" {
		switch opts.AudioFormat {
		case "mp3", "m4a", "aac", "flac", "wav", "opus", "vorbis":
			// ok
		default:
			return fmt.Errorf("不支持的音频格式: %s", opts.AudioFormat)
		}
		args = append(args, "-x", "--audio-format", opts.AudioFormat)
	}

	if opts.Section != "" {
		if err := validateSection(opts.Section); err != nil {
			return err
		}
		if ffmpegPath == "" {
			return fmt.Errorf("需要安装并在设置页中设置 ffmpeg 路径")
		}
		args = append(args, "--download-sections", "*"+opts.Section)
	}

	args = append(args, opts.VideoURL)

	// 把实际执行的命令输出到下载详情，方便排查
	emit("执行: yt-dlp " + strings.Join(args, " "))

	cmd := exec.Command(opts.YtdlpPath, args...)
	cmd.Env = platform.CommandEnv()
	cmd.Dir = opts.Dir // 下载到所选下载目录
	platform.HideWindow(cmd)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return err
	}

	if err := cmd.Start(); err != nil {
		return err
	}

	var wg sync.WaitGroup
	stream := func(r io.Reader) {
		defer wg.Done()
		scanner := bufio.NewScanner(r)
		scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
		scanner.Split(scanLinesOrCR)
		for scanner.Scan() {
			emit(scanner.Text())
		}
	}
	wg.Add(2)
	go stream(stdout)
	go stream(stderr)
	wg.Wait()

	if err := cmd.Wait(); err != nil {
		emit("下载失败: " + err.Error())
		return err
	}
	emit("下载完成")
	return nil
}

// validateSection 校验 "开始-结束"（秒）格式与范围（后端兜底校验）
func validateSection(section string) error {
	parts := strings.SplitN(section, "-", 2)
	if len(parts) != 2 {
		return fmt.Errorf("时段格式不合法")
	}
	start, err1 := strconv.Atoi(strings.TrimSpace(parts[0]))
	end, err2 := strconv.Atoi(strings.TrimSpace(parts[1]))
	if err1 != nil || err2 != nil {
		return fmt.Errorf("时段格式不合法")
	}
	if start < 0 || end <= start {
		return fmt.Errorf("时段范围不合法：开始时间需小于结束时间")
	}
	return nil
}

// scanLinesOrCR 同时按 \n 和 \r 切分（yt-dlp 的进度条用 \r 刷新）
func scanLinesOrCR(data []byte, atEOF bool) (advance int, token []byte, err error) {
	if atEOF && len(data) == 0 {
		return 0, nil, nil
	}
	for i, b := range data {
		if b == '\n' || b == '\r' {
			return i + 1, data[:i], nil
		}
	}
	if atEOF {
		return len(data), data, nil
	}
	return 0, nil, nil
}
