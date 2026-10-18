package main

import "sort"

// Format 视频格式（返回给前端）
type Format struct {
	ID         string `json:"id"`
	Ext        string `json:"ext"`
	Resolution string `json:"resolution"`
	FileSize   string `json:"fileSize"`
	Tbr        string `json:"tbr"`
	Vcodec     string `json:"vcodec"`

	sizeBytes int64 // 仅后端排序用；未导出，不会序列化给前端
}

// AudioFormat 音频格式（返回给前端）
type AudioFormat struct {
	ID       string `json:"id"`
	Ext      string `json:"ext"`
	FileSize string `json:"fileSize"`
	Tbr      string `json:"tbr"`
	Acodec   string `json:"acodec"`

	sizeBytes int64 // 仅后端排序用；未导出，不会序列化给前端
}

// VideoFormats 视频格式列表 + 视频时长（秒）
type VideoFormats struct {
	Formats  []Format `json:"formats"`
	Duration float64  `json:"duration"`
}

// AudioFormats 音频格式列表 + 视频时长（秒）
type AudioFormats struct {
	Formats  []AudioFormat `json:"formats"`
	Duration float64       `json:"duration"`
}

// ListVideoFormats 返回带视频的格式，按大小倒序
func (a *App) ListVideoFormats(videoURL string) (VideoFormats, error) {
	info, err := a.fetchInfo(videoURL)
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
func (a *App) ListAudioFormats(videoURL string) (AudioFormats, error) {
	info, err := a.fetchInfo(videoURL)
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
