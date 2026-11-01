package updater

import (
	"bufio"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"
)

const (
	apiBase           = "https://api.github.com"
	checksumAssetName = "SHA256SUMS.txt"
	userAgent         = "ytdlpgo-updater"
)

// ReleaseInfo 最新版本信息（返回给前端）
type ReleaseInfo struct {
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
	IsLatest       bool   `json:"isLatest"`
	ReleaseURL     string `json:"releaseUrl"`
	PublishedAt    string `json:"publishedAt"`
	AssetName      string `json:"assetName"`
	AssetURL       string `json:"assetUrl"`
	ChecksumURL    string `json:"checksumUrl"`
}

// Progress 更新进度（通过 Wails 事件推送）
type Progress struct {
	Stage      string  `json:"stage"`
	Downloaded int64   `json:"downloaded"`
	Total      int64   `json:"total"`
	Percent    float64 `json:"percent"`
}

type githubRelease struct {
	TagName     string        `json:"tag_name"`
	HTMLURL     string        `json:"html_url"`
	PublishedAt string        `json:"published_at"`
	Assets      []githubAsset `json:"assets"`
}

type githubAsset struct {
	Name               string `json:"name"`
	URL                string `json:"url"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

type semver struct {
	major int
	minor int
	patch int
	pre   string
}

// Check 查询 GitHub 最新 Release 并与当前版本比较
func Check(ctx context.Context, repo, currentVersion string) (ReleaseInfo, error) {
	current := normalizeVersion(currentVersion)
	info := ReleaseInfo{CurrentVersion: current}

	if _, err := parseVersion(current); err != nil {
		return info, fmt.Errorf("当前版本号无效: %w", err)
	}

	release, err := fetchLatestRelease(ctx, repo)
	if err != nil {
		return info, err
	}

	latest := normalizeVersion(release.TagName)
	info.LatestVersion = latest
	info.ReleaseURL = release.HTMLURL
	info.PublishedAt = release.PublishedAt

	cmp, err := compareVersionStrings(latest, current)
	if err != nil {
		return info, fmt.Errorf("最新版本号无效: %w", err)
	}
	if cmp <= 0 {
		info.IsLatest = true
		return info, nil
	}

	installer, checksum, err := selectAssets(release.Assets, runtime.GOOS, runtime.GOARCH)
	if err != nil {
		return info, err
	}
	info.AssetName = installer.Name
	info.AssetURL = preferredDownloadURL(installer)
	info.ChecksumURL = preferredDownloadURL(checksum)
	return info, nil
}

// Download 下载并校验安装包，返回本地临时文件路径
func Download(ctx context.Context, assetURL, assetName, checksumURL, destDir string, emit func(Progress)) (string, error) {
	if err := validateGitHubDownloadURL(assetURL); err != nil {
		return "", err
	}
	if err := validateGitHubDownloadURL(checksumURL); err != nil {
		return "", err
	}

	name, err := safeFileName(assetName)
	if err != nil {
		return "", err
	}
	expectedHash, err := fetchChecksum(ctx, checksumURL, name)
	if err != nil {
		return "", err
	}

	if err := os.MkdirAll(destDir, 0o700); err != nil {
		return "", err
	}
	path := filepath.Join(destDir, name)

	reqCtx, cancel := context.WithTimeout(ctx, 20*time.Minute)
	defer cancel()
	req, err := http.NewRequestWithContext(reqCtx, http.MethodGet, assetURL, nil)
	if err != nil {
		return "", err
	}
	applyDownloadHeaders(req, assetURL)

	client := &http.Client{Timeout: 20 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("下载安装包失败: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("下载安装包失败（HTTP %d）", resp.StatusCode)
	}

	file, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o600)
	if err != nil {
		return "", err
	}

	hasher := sha256.New()
	writer := &progressWriter{total: resp.ContentLength, emit: emit}
	if emit != nil {
		emit(Progress{Stage: "downloading", Total: resp.ContentLength})
	}
	_, copyErr := io.Copy(io.MultiWriter(file, hasher, writer), resp.Body)
	closeErr := file.Close()
	if copyErr != nil {
		_ = os.Remove(path)
		return "", fmt.Errorf("下载安装包失败: %w", copyErr)
	}
	if closeErr != nil {
		_ = os.Remove(path)
		return "", closeErr
	}

	actualHash := hex.EncodeToString(hasher.Sum(nil))
	if emit != nil {
		emit(Progress{
			Stage:      "verifying",
			Downloaded: writer.written,
			Total:      resp.ContentLength,
			Percent:    100,
		})
	}
	if !strings.EqualFold(actualHash, expectedHash) {
		_ = os.Remove(path)
		return "", fmt.Errorf("安装包校验失败，请重试")
	}

	return path, nil
}

// Install 启动平台对应的后台安装流程
func Install(installerPath string, emit func(Progress)) error {
	if emit != nil {
		emit(Progress{Stage: "installing", Percent: 100})
	}
	return installPlatform(installerPath)
}

func fetchLatestRelease(ctx context.Context, repo string) (githubRelease, error) {
	var release githubRelease

	ctx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()

	endpoint := fmt.Sprintf("%s/repos/%s/releases/latest", apiBase, repo)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return release, err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("User-Agent", userAgent)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return release, fmt.Errorf("连接 GitHub 失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return release, err
	}
	if resp.StatusCode == http.StatusNotFound {
		return release, fmt.Errorf("GitHub 上还没有发布版本")
	}
	if resp.StatusCode != http.StatusOK {
		return release, fmt.Errorf("获取最新版本失败（HTTP %d）", resp.StatusCode)
	}
	if err := json.Unmarshal(body, &release); err != nil {
		return release, fmt.Errorf("解析 GitHub 版本信息失败: %w", err)
	}
	if release.TagName == "" {
		return release, fmt.Errorf("GitHub 返回的版本信息不完整")
	}
	return release, nil
}

func selectAssets(assets []githubAsset, goos, goarch string) (githubAsset, githubAsset, error) {
	var installer githubAsset
	var checksum githubAsset

	for _, asset := range assets {
		lower := strings.ToLower(asset.Name)
		if lower == strings.ToLower(checksumAssetName) {
			checksum = asset
			continue
		}
		if installer.Name == "" && matchesInstaller(lower, goos, goarch) {
			installer = asset
		}
	}

	if installer.Name == "" {
		return installer, checksum, fmt.Errorf("最新版本没有适用于当前平台的安装包")
	}
	if checksum.Name == "" {
		return installer, checksum, fmt.Errorf("最新版本缺少 %s 校验文件", checksumAssetName)
	}
	return installer, checksum, nil
}

func matchesInstaller(name, goos, goarch string) bool {
	switch goos {
	case "windows":
		if !strings.HasSuffix(name, ".exe") ||
			!strings.Contains(name, "installer") ||
			!strings.Contains(name, "windows") {
			return false
		}
		arch := goarch
		if arch == "" {
			arch = "amd64"
		}
		return strings.Contains(name, arch)
	case "darwin":
		return strings.HasSuffix(name, ".dmg") && strings.Contains(name, "macos")
	default:
		return false
	}
}

func fetchChecksum(ctx context.Context, checksumURL, assetName string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, checksumURL, nil)
	if err != nil {
		return "", err
	}
	applyDownloadHeaders(req, checksumURL)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("下载校验文件失败: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("下载校验文件失败（HTTP %d）", resp.StatusCode)
	}

	scanner := bufio.NewScanner(io.LimitReader(resp.Body, 1<<20))
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) >= 2 && filepath.Base(fields[len(fields)-1]) == assetName {
			return fields[0], nil
		}
	}
	if err := scanner.Err(); err != nil {
		return "", err
	}
	return "", fmt.Errorf("校验文件中没有找到 %s", assetName)
}

func preferredDownloadURL(asset githubAsset) string {
	// 优先使用 api.github.com 的 asset 接口下载：部分网络环境下
	// github.com 下载域名不可达，但 api.github.com 可以正常访问。
	if asset.URL != "" {
		return asset.URL
	}
	return asset.BrowserDownloadURL
}

func applyDownloadHeaders(req *http.Request, rawURL string) {
	req.Header.Set("User-Agent", userAgent)
	parsed, err := url.Parse(rawURL)
	if err == nil && strings.EqualFold(parsed.Host, "api.github.com") {
		req.Header.Set("Accept", "application/octet-stream")
	}
}

func validateGitHubDownloadURL(raw string) error {
	parsed, err := url.Parse(raw)
	if err != nil {
		return fmt.Errorf("更新地址不合法")
	}
	if !strings.EqualFold(parsed.Scheme, "https") {
		return fmt.Errorf("更新地址不受信任")
	}

	isBrowserURL := strings.EqualFold(parsed.Host, "github.com") &&
		strings.Contains(parsed.Path, "/releases/download/")
	isAPIURL := strings.EqualFold(parsed.Host, "api.github.com") &&
		strings.Contains(parsed.Path, "/releases/assets/")
	if !isBrowserURL && !isAPIURL {
		return fmt.Errorf("更新地址不是 GitHub Release 资源")
	}
	return nil
}

func safeFileName(name string) (string, error) {
	name = strings.TrimSpace(name)
	if name == "" || name == "." || name == ".." ||
		name != filepath.Base(name) || strings.ContainsAny(name, `/\`) {
		return "", fmt.Errorf("安装包文件名不合法")
	}
	return name, nil
}

func normalizeVersion(value string) string {
	value = strings.TrimSpace(value)
	if len(value) > 0 && (value[0] == 'v' || value[0] == 'V') {
		value = value[1:]
	}
	return value
}

func compareVersionStrings(a, b string) (int, error) {
	left, err := parseVersion(a)
	if err != nil {
		return 0, err
	}
	right, err := parseVersion(b)
	if err != nil {
		return 0, err
	}

	switch {
	case left.major != right.major:
		return compareInt(left.major, right.major), nil
	case left.minor != right.minor:
		return compareInt(left.minor, right.minor), nil
	case left.patch != right.patch:
		return compareInt(left.patch, right.patch), nil
	case left.pre == right.pre:
		return 0, nil
	case left.pre == "":
		return 1, nil
	case right.pre == "":
		return -1, nil
	default:
		return strings.Compare(left.pre, right.pre), nil
	}
}

func parseVersion(value string) (semver, error) {
	value = normalizeVersion(value)
	if value == "" {
		return semver{}, fmt.Errorf("版本号为空")
	}
	if i := strings.IndexByte(value, '+'); i >= 0 {
		value = value[:i]
	}

	pre := ""
	if i := strings.IndexByte(value, '-'); i >= 0 {
		pre = value[i+1:]
		value = value[:i]
	}

	parts := strings.Split(value, ".")
	if len(parts) == 0 || len(parts) > 3 {
		return semver{}, fmt.Errorf("版本号格式不正确: %s", value)
	}

	numbers := [3]int{}
	for i, part := range parts {
		if part == "" {
			return semver{}, fmt.Errorf("版本号格式不正确: %s", value)
		}
		number, err := strconv.Atoi(part)
		if err != nil || number < 0 {
			return semver{}, fmt.Errorf("版本号格式不正确: %s", value)
		}
		numbers[i] = number
	}

	return semver{
		major: numbers[0],
		minor: numbers[1],
		patch: numbers[2],
		pre:   pre,
	}, nil
}

func compareInt(a, b int) int {
	switch {
	case a < b:
		return -1
	case a > b:
		return 1
	default:
		return 0
	}
}

type progressWriter struct {
	written int64
	total   int64
	last    time.Time
	emit    func(Progress)
}

func (w *progressWriter) Write(data []byte) (int, error) {
	w.written += int64(len(data))
	now := time.Now()
	if w.last.IsZero() || now.Sub(w.last) >= 100*time.Millisecond {
		percent := 0.0
		if w.total > 0 {
			percent = float64(w.written) / float64(w.total) * 100
			if percent > 100 {
				percent = 100
			}
		}
		if w.emit != nil {
			w.emit(Progress{
				Stage:      "downloading",
				Downloaded: w.written,
				Total:      w.total,
				Percent:    percent,
			})
		}
		w.last = now
	}
	return len(data), nil
}
