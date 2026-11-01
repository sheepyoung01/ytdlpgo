package updater

import "testing"

func TestCompareVersionStrings(t *testing.T) {
	tests := []struct {
		left  string
		right string
		want  int
	}{
		{"v1.0.0", "1.0.0", 0},
		{"1.0.1", "1.0.0", 1},
		{"1.1.9", "1.2.0", -1},
		{"v2.0.0", "2.0.0", 0},
		{"1.0.0", "1.0.0-beta.1", 1},
		{"1.0.0-beta.1", "1.0.0", -1},
	}

	for _, test := range tests {
		got, err := compareVersionStrings(test.left, test.right)
		if err != nil {
			t.Fatalf("compareVersionStrings(%q, %q): %v", test.left, test.right, err)
		}
		if got != test.want {
			t.Fatalf("compareVersionStrings(%q, %q) = %d, want %d", test.left, test.right, got, test.want)
		}
	}
}

func TestSelectAssets(t *testing.T) {
	assets := []githubAsset{
		{Name: "ytdlpgo-1.1.0-windows-amd64-installer.exe", BrowserDownloadURL: "https://github.com/example/windows"},
		{Name: "ytdlpgo-1.1.0-macos-universal.dmg", BrowserDownloadURL: "https://github.com/example/macos"},
		{Name: "SHA256SUMS.txt", BrowserDownloadURL: "https://github.com/example/checksums"},
	}

	windowsInstaller, windowsChecksum, err := selectAssets(assets, "windows", "amd64")
	if err != nil {
		t.Fatalf("selectAssets windows: %v", err)
	}
	if windowsInstaller.BrowserDownloadURL != "https://github.com/example/windows" {
		t.Fatalf("unexpected windows asset: %s", windowsInstaller.BrowserDownloadURL)
	}
	if windowsChecksum.BrowserDownloadURL != "https://github.com/example/checksums" {
		t.Fatalf("unexpected checksum asset: %s", windowsChecksum.BrowserDownloadURL)
	}

	macInstaller, _, err := selectAssets(assets, "darwin", "arm64")
	if err != nil {
		t.Fatalf("selectAssets darwin: %v", err)
	}
	if macInstaller.BrowserDownloadURL != "https://github.com/example/macos" {
		t.Fatalf("unexpected mac asset: %s", macInstaller.BrowserDownloadURL)
	}

	if _, _, err := selectAssets(assets[:2], "windows", "amd64"); err == nil {
		t.Fatal("expected missing checksum error")
	}
}

func TestSafeFileName(t *testing.T) {
	for _, name := range []string{"../evil.exe", `dir\evil.exe`, "", "."} {
		if _, err := safeFileName(name); err == nil {
			t.Fatalf("expected %q to be rejected", name)
		}
	}
	if safe, err := safeFileName("ytdlpgo.exe"); err != nil || safe != "ytdlpgo.exe" {
		t.Fatalf("unexpected safe filename result: %q, %v", safe, err)
	}
}

func TestValidateGitHubDownloadURL(t *testing.T) {
	valid := []string{
		"https://github.com/sheepyoung01/ytdlpgo/releases/download/v1.0.0/app.exe",
		"https://api.github.com/repos/sheepyoung01/ytdlpgo/releases/assets/123",
	}
	for _, value := range valid {
		if err := validateGitHubDownloadURL(value); err != nil {
			t.Fatalf("expected %q to be valid: %v", value, err)
		}
	}

	invalid := []string{
		"http://github.com/sheepyoung01/ytdlpgo/releases/download/v1.0.0/app.exe",
		"https://example.com/app.exe",
		"https://api.github.com/repos/other/repo",
	}
	for _, value := range invalid {
		if err := validateGitHubDownloadURL(value); err == nil {
			t.Fatalf("expected %q to be rejected", value)
		}
	}
}
