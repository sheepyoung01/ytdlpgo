// 把绝对路径压缩成 ~ 开头的展示路径
export function prettyPath(path) {
    if (!path) return '';
    const unix = path.match(/^(\/Users\/[^/]+|\/home\/[^/]+)/);
    if (unix) return '~' + path.slice(unix[0].length);
    const win = path.match(/^([A-Za-z]:\\Users\\[^\\]+)/);
    if (win) return '~' + path.slice(win[0].length);
    return path;
}

// 把分辨率转换成下拉里的小标签，如 1920x1080 -> 1080P
export function resolutionBadge(resolution) {
    if (!resolution) return 'VIDEO';
    const pair = resolution.match(/(\d{3,4})\s*[x×]\s*(\d{3,4})/i);
    if (pair) {
        const height = Number(pair[2]);
        if (height >= 4320) return '8K';
        if (height >= 2160) return '4K';
        return `${height}P`;
    }
    const single = resolution.match(/(\d{3,4})P/i);
    if (single) return `${single[1]}P`;
    if (/audio/i.test(resolution)) return 'AUDIO';
    return resolution.toUpperCase().slice(0, 7);
}

// 编码名称简化展示
export function codecLabel(codec) {
    if (!codec) return '';
    const value = codec.toLowerCase();
    if (value.startsWith('avc1') || value.includes('h264') || value.includes('h.264')) return 'H.264';
    if (value.startsWith('hev1') || value.startsWith('hvc1') || value.includes('hevc') || value.includes('h265')) return 'H.265';
    if (value.includes('vp09') || value.includes('vp9')) return 'VP9';
    if (value.includes('av01') || value.includes('av1')) return 'AV1';
    if (value.includes('vp8')) return 'VP8';
    if (value.includes('mp4a') || value.includes('aac')) return 'AAC';
    if (value.includes('opus')) return 'Opus';
    if (value.includes('vorbis')) return 'Vorbis';
    if (value.includes('flac')) return 'FLAC';
    if (value.includes('mp3')) return 'MP3';
    return codec;
}

// 码率展示：160k -> 160 kbps
export function bitrateLabel(tbr) {
    if (!tbr) return '';
    const value = String(tbr).trim();
    if (/^\d+(\.\d+)?k$/i.test(value)) return `${value.slice(0, -1)} kbps`;
    if (/^\d+(\.\d+)?$/.test(value)) return `${value} kbps`;
    return value;
}

// 去掉后端文件大小前面的约等号，页面里统一由 UI 添加「约」
export function fileSizeLabel(size) {
    if (!size) return '';
    return String(size).replace(/^≈/, '').trim();
}

// 根据码率给出音质描述
export function audioQualityLabel(tbr) {
    const value = parseFloat(String(tbr || '').replace(/[^\d.]/g, ''));
    if (!Number.isFinite(value) || value <= 0) return '';
    if (value >= 192) return '高质量';
    if (value >= 96) return '标准';
    return '普通';
}
