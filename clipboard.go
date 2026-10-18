package main

import "github.com/wailsapp/wails/v2/pkg/runtime"

// GetClipboardText 读取剪贴板文本
func (a *App) GetClipboardText() (string, error) {
	return runtime.ClipboardGetText(a.ctx)
}
