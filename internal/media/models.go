package media

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
