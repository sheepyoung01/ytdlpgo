//go:build !darwin && !windows

package updater

import "fmt"

func installPlatform(_ string) error {
	return fmt.Errorf("当前平台不支持自动更新")
}
