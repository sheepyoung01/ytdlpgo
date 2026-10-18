package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// Settings 应用配置
type Settings struct {
	YtdlpPath  string `json:"ytdlpPath"`
	FfmpegPath string `json:"ffmpegPath"`
	// 以后要加的设置项继续往下写
}

// Path 返回设置文件路径（系统配置目录下 ytdlpgo/settings.json）
func Path() (string, error) {
	// macOS: ~/Library/Application Support，Win: %AppData%，Linux: ~/.config
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	appDir := filepath.Join(dir, "ytdlpgo")
	if err := os.MkdirAll(appDir, 0o755); err != nil {
		return "", err
	}
	return filepath.Join(appDir, "settings.json"), nil
}

// Load 读取设置文件
func Load() (Settings, error) {
	var s Settings
	p, err := Path()
	if err != nil {
		return s, err
	}

	data, err := os.ReadFile(p)
	if os.IsNotExist(err) {
		return s, nil // 第一次运行没有文件，返回零值
	}
	if err != nil {
		return s, err
	}
	if err := json.Unmarshal(data, &s); err != nil {
		return s, err
	}
	return s, nil
}

// Save 保存设置
func Save(s Settings) error {
	p, err := Path()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(s, "", "  ") // 带缩进，方便查看
	if err != nil {
		return err
	}
	return os.WriteFile(p, data, 0o644)
}
