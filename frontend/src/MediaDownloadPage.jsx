import {useEffect, useRef, useState} from 'react';
import {Button, Checkbox, Flex, Form, Input, Select, message} from 'antd';
import './App.css';
import {GetClipboardText, GetSettings, SelectDirectory} from '../wailsjs/go/main/App';
import {EventsOn} from '../wailsjs/runtime/runtime';

const LABEL_COL = {flex: '100px'};
const WRAPPER_COL = {flex: '1'};

const AUDIO_FORMATS = ['mp3', 'm4a', 'aac', 'flac', 'wav', 'opus', 'vorbis'];
const AUDIO_FORMAT_OPTIONS = AUDIO_FORMATS.map((v) => ({label: v, value: v}));

// 把 "HH:MM:SS" / "MM:SS" / "SS" 解析成秒；不合法返回 null
function parseTimeToSeconds(value) {
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
function formatDuration(total) {
    const t = Math.round(total);
    const pad = (n) => String(n).padStart(2, '0');
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/**
 * 视频/音频页面共用的下载页面。
 *
 * @param formatLabel        格式下拉的标签，如「视频分辨率」「音频格式」
 * @param listFormats        (url) => Promise<{formats, duration}>
 * @param download           (url, formatID, dir, section) => Promise<void>
 * @param logEvent           后端推送日志的事件名
 * @param formatOptionLabel  (format) => string，下拉项的显示文本
 */
export default function MediaDownloadPage({
    formatLabel,
    listFormats,
    download,
    logEvent,
    formatOptionLabel,
    enableTranscode = false,
}) {
    const [url, setUrl] = useState('');
    const [formats, setFormats] = useState([]);
    const [selected, setSelected] = useState(undefined);
    const [loadingFmt, setLoadingFmt] = useState(false);
    const [duration, setDuration] = useState(0);
    const [downloadDir, setDownloadDir] = useState('');
    const [logs, setLogs] = useState([]);
    const [downloading, setDownloading] = useState(false);

    const [useSection, setUseSection] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [ffmpegPath, setFfmpegPath] = useState('');
    const [useTranscode, setUseTranscode] = useState(false);
    const [audioFormat, setAudioFormat] = useState('mp3');

    const logRef = useRef(null);

    // 读取设置里的 ffmpeg 路径，并在设置保存后同步刷新
    useEffect(() => {
        const refresh = () => {
            GetSettings()
                .then((s) => setFfmpegPath(s.ffmpegPath || ''))
                .catch(() => {});
        };
        refresh();
        const cancel = EventsOn('settings-changed', refresh);
        return () => cancel();
    }, []);

    // 订阅后端推送的下载日志
    useEffect(() => {
        const cancel = EventsOn(logEvent, (line) => {
            setLogs((prev) => [...prev, line]);
        });
        return () => cancel();
    }, [logEvent]);

    // 有新的日志就自动滚到底部
    useEffect(() => {
        const el = logRef.current;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }, [logs]);

    // URL 有效时自动加载格式列表（防抖）
    useEffect(() => {
        let valid = false;
        try {
            const u = new URL(url);
            valid = u.protocol === 'https:';
        } catch { /* ignore */ }

        if (!valid) {
            setFormats([]);
            setDuration(0);
            return;
        }

        const timer = setTimeout(async () => {
            setLoadingFmt(true);
            try {
                const result = await listFormats(url);
                setFormats(result.formats ?? []);
                setDuration(result.duration ?? 0);
            } catch (e) {
                setFormats([]);
                setDuration(0);
                console.error(e);
            } finally {
                setLoadingFmt(false);
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [url]);

    // 鼠标进入 url 输入框时，若为空则从剪贴板填入
    const handleMouseEnter = async () => {
        if (url !== '') return;

        try {
            const text = await GetClipboardText();
            if (text && text.startsWith('https')) {
                setUrl(text);
            }
        } catch (err) {
            console.error('读取剪贴板失败:', err);
        }
    };

    // 手动选择本地下载目录
    const handleSelectDir = async () => {
        try {
            const dir = await SelectDirectory();
            if (dir) {
                setDownloadDir(dir);
            }
        } catch (err) {
            console.error('选择下载目录失败:', err);
        }
    };

    // 勾选「时段」时读取最新设置，未配置 ffmpeg 则提示
    const handleSectionChange = async (e) => {
        const checked = e.target.checked;
        setUseSection(checked);
        if (!checked) return;

        try {
            const s = await GetSettings();
            const path = s.ffmpegPath || '';
            setFfmpegPath(path);
            if (!path) {
                message.warning('需要安装并在设置页中设置 ffmpeg 路径');
            }
        } catch (err) {
            console.error('读取设置失败:', err);
        }
    };

    // 勾选「转码」时，未配置 ffmpeg 则提示
    const handleTranscodeChange = (e) => {
        const checked = e.target.checked;
        setUseTranscode(checked);
        if (checked && !ffmpegPath) {
            message.warning('需要安装并在设置页中设置 ffmpeg 路径');
        }
    };

    // 校验并返回时段参数（秒），不启用时段返回空字符串
    const buildSection = () => {
        if (!useSection) return '';

        const startSec = parseTimeToSeconds(startTime);
        const endSec = parseTimeToSeconds(endTime);

        if (startSec === null || endSec === null) {
            message.warning('时间格式不正确，请使用 HH:MM:SS');
            return null;
        }
        if (startSec >= endSec) {
            message.warning('开始时间必须早于结束时间');
            return null;
        }
        if (duration > 0 && endSec > duration) {
            message.warning(`结束时间超出视频时长（${formatDuration(duration)}）`);
            return null;
        }
        return `${startSec}-${endSec}`;
    };

    // 下载：调用后端，日志实时回显
    const handleDownload = async () => {
        if (!url) {
            message.warning('请先填写视频 URL');
            return;
        }
        if (!selected) {
            message.warning(`请先选择${formatLabel}`);
            return;
        }
        if (!downloadDir) {
            message.warning('请先选择下载目录');
            return;
        }
        if ((useSection || useTranscode) && !ffmpegPath) {
            message.warning('需要安装并在设置页中设置 ffmpeg 路径');
            return;
        }

        const section = buildSection();
        if (section === null) return; // 校验失败

        setLogs([]);
        setDownloading(true);
        try {
            await download(url, selected, downloadDir, section, useTranscode ? audioFormat : '');
        } catch (e) {
            setLogs((prev) => [...prev, String(e)]);
        } finally {
            setDownloading(false);
        }
    };

    const formatOptions = formats.map((f) => ({
        value: f.id,
        label: formatOptionLabel(f),
    }));

    return (
        <div className="page">
            <div className="panel">
                <Form layout="horizontal" colon={false}>
                    <Form.Item label="视频 url" labelCol={LABEL_COL} wrapperCol={WRAPPER_COL}>
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onMouseEnter={handleMouseEnter}
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item label={formatLabel} labelCol={LABEL_COL} wrapperCol={WRAPPER_COL}>
                        <Select
                            value={selected}
                            onChange={setSelected}
                            options={formatOptions}
                            loading={loadingFmt}
                            placeholder="粘贴 URL 后自动加载"
                            size="large"
                            allowClear
                            notFoundContent={loadingFmt ? '加载中…' : '暂无数据'}
                        />
                    </Form.Item>

                    <Form.Item label="下载目录" labelCol={LABEL_COL} wrapperCol={WRAPPER_COL}>
                        <Input
                            value={downloadDir}
                            onClick={handleSelectDir}
                            readOnly
                            placeholder="点击选择本地目录"
                            size="large"
                            style={{cursor: 'pointer'}}
                        />
                    </Form.Item>

                    <Form.Item label="时段" labelCol={LABEL_COL} wrapperCol={WRAPPER_COL}>
                        <Flex align="center" gap={12} wrap>
                            <Checkbox
                                checked={useSection}
                                onChange={handleSectionChange}
                            >
                                下载指定时段
                            </Checkbox>
                            {useSection && (
                                <>
                                    <Input
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        placeholder="开始 00:00:00"
                                        style={{width: 160}}
                                        disabled={!ffmpegPath}
                                    />
                                    <span>~</span>
                                    <Input
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        placeholder="结束 00:00:00"
                                        style={{width: 160}}
                                        disabled={!ffmpegPath}
                                    />
                                    {duration > 0 && (
                                        <span style={{color: '#888'}}>
                                            视频时长 {formatDuration(duration)}
                                        </span>
                                    )}
                                    {!ffmpegPath && (
                                        <span style={{color: '#d4380d'}}>
                                            需要安装并在设置页中设置 ffmpeg 路径
                                        </span>
                                    )}
                                </>
                            )}
                        </Flex>
                    </Form.Item>

                    {enableTranscode && (
                        <Form.Item label="转码" labelCol={LABEL_COL} wrapperCol={WRAPPER_COL}>
                            <Flex align="center" gap={12} wrap>
                                <Checkbox
                                    checked={useTranscode}
                                    onChange={handleTranscodeChange}
                                >
                                    转码为
                                </Checkbox>
                                {useTranscode && (
                                    <>
                                        <Select
                                            value={audioFormat}
                                            onChange={setAudioFormat}
                                            options={AUDIO_FORMAT_OPTIONS}
                                            style={{width: 140}}
                                            disabled={!ffmpegPath}
                                        />
                                        {!ffmpegPath && (
                                            <span style={{color: '#d4380d'}}>
                                                需要安装并在设置页中设置 ffmpeg 路径
                                            </span>
                                        )}
                                    </>
                                )}
                            </Flex>
                        </Form.Item>
                    )}
                </Form>

                <div className="detail-row">
                    <div className="detail-label">下载详情</div>
                    <div className="log-viewer" ref={logRef}>
                        {logs.map((line, i) => (
                            <div className="log-line" key={i}>
                                <span className="log-no">{i + 1}</span>
                                <span className="log-text">{line}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <Button
                    type="primary"
                    size="large"
                    className="download-btn"
                    loading={downloading}
                    disabled={(useSection || useTranscode) && !ffmpegPath}
                    onClick={handleDownload}
                >
                    下 载
                </Button>
            </div>
        </div>
    );
}
