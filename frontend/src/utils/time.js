// 把 "HH:MM:SS" / "MM:SS" / "SS" 解析成秒；不合法返回 null
export function parseTimeToSeconds(value) {
    const s = value.trim();
    if (!s) return null;

    const parts = s.split(':');
    if (parts.length > 3) return null;
    if (!parts.every((p) => /^\d+$/.test(p))) return null;

    let h = 0;
    let m = 0;
    let sec = 0;
    if (parts.length === 3) {
        [h, m, sec] = parts.map(Number);
    } else if (parts.length === 2) {
        [m, sec] = parts.map(Number);
    } else {
        sec = Number(parts[0]);
    }

    if (m >= 60 || sec >= 60) return null;
    return h * 3600 + m * 60 + sec;
}

// 秒 -> "HH:MM:SS"（用于展示视频时长）
export function formatDuration(total) {
    const t = Math.round(total);
    const pad = (n) => String(n).padStart(2, '0');
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
