// 从 yt-dlp 日志里解析最后一条下载进度
export function parseProgress(lines) {
    for (let i = lines.length - 1; i >= 0; i -= 1) {
        const line = lines[i];
        if (!line.includes('[download]')) continue;

        const percentMatch = line.match(/\[download\]\s+([\d.]+)%/);
        if (!percentMatch) continue;

        const progress = {
            percent: Math.min(100, Number.parseFloat(percentMatch[1]) || 0),
        };

        const sizeMatch = line.match(/of\s+([\d.]+)\s*([A-Za-z]+)/);
        if (sizeMatch) progress.totalSize = `${sizeMatch[1]} ${sizeMatch[2]}`;

        const speedMatch = line.match(/at\s+([\d.]+)\s*([A-Za-z]+\/s)/);
        if (speedMatch) progress.speed = `${speedMatch[1]} ${speedMatch[2]}`;

        const etaMatch = line.match(/ETA\s+([\d:]+)/);
        if (etaMatch) progress.eta = etaMatch[1];

        return progress;
    }
    return null;
}

// 把 ETA 的 00:03 / 01:02:03 转成「3 秒」「1 分 2 秒」
export function etaText(eta) {
    if (!eta) return '';
    const parts = eta.split(':').map(Number);
    if (!parts.every(Number.isFinite)) return eta;

    let seconds = 0;
    if (parts.length === 3) {
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        seconds = parts[0] * 60 + parts[1];
    } else {
        seconds = parts[0];
    }

    if (seconds < 60) return `${seconds} 秒`;
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return rest > 0 ? `${minutes} 分 ${rest} 秒` : `${minutes} 分`;
}

// 判断日志行的类型，便于着色
export function logLineTone(line) {
    if (line.includes('下载失败') || /ERROR:/i.test(line)) return 'error';
    if (line.startsWith('执行:')) return 'command';
    if (line.startsWith('[download]')) return 'download';
    if (line.startsWith('[ExtractAudio]') || line.startsWith('[Merger]') || line.startsWith('[ffmpeg]')) return 'post';
    if (line.startsWith('[info]')) return 'info';
    return 'normal';
}
