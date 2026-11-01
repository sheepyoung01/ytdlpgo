import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, Switch, message } from 'antd';
import {
    GetClipboardText,
    GetDefaultDownloadDir,
    OpenFolder,
    SelectDirectory,
} from '../../wailsjs/go/main/App';
import { EventsOn } from '../../wailsjs/runtime/runtime';
import useToolStatus from '../hooks/useToolStatus';
import PageHeader from './PageHeader';
import {
    AlertIcon,
    CheckCircleIcon,
    ClockIcon,
    DownloadIcon,
    FolderIcon,
    InfoIcon,
    LinkIcon,
} from './Icons';
import { parseTimeToSeconds, formatDuration } from '../utils/time';
import {
    bitrateLabel,
    fileSizeLabel,
    prettyPath,
    resolutionBadge,
} from '../utils/format';
import { etaText, logLineTone, parseProgress } from '../utils/progress';

const TRANSCODE_OPTIONS = [
    { value: 'mp3', label: 'MP3 · 320k 高质量' },
    { value: 'm4a', label: 'M4A · 256k 高质量' },
    { value: 'aac', label: 'AAC · 256k' },
    { value: 'flac', label: 'FLAC · 无损' },
    { value: 'wav', label: 'WAV · 无损' },
    { value: 'opus', label: 'OPUS · 192k' },
    { value: 'vorbis', label: 'VORBIS · 192k' },
];

/**
 * 视频/音频页面共用的下载页面。
 *
 * @param pageTitle          页面标题
 * @param pageSubtitle       页面副标题
 * @param urlHint            链接卡片右侧说明
 * @param durationLabel      时长标签，如「视频时长」
 * @param kind               video / audio
 * @param formatLabel        格式下拉的标签，如「视频分辨率」「音频格式」
 * @param listFormats        (url) => Promise<{formats, duration}>
 * @param download           (url, formatID, dir, section, transcode) => Promise<void>
 * @param logEvent           后端推送日志的事件名
 * @param formatOptionLabel  (format) => ReactNode，下拉项的显示文本
 * @param enableTranscode    是否显示音频转码设置
 */
export default function MediaDownloadPage({
    pageTitle,
    pageSubtitle,
    urlHint,
    durationLabel = '视频时长',
    kind = 'video',
    formatLabel,
    listFormats,
    download,
    logEvent,
    formatOptionLabel,
    enableTranscode = false,
}) {
    const navigate = useNavigate();
    const [toolStatus] = useToolStatus();
    const [msg, holder] = message.useMessage();

    const [url, setUrl] = useState('');
    const [formats, setFormats] = useState([]);
    const [selected, setSelected] = useState(undefined);
    const [loadingFmt, setLoadingFmt] = useState(false);
    const [fetchError, setFetchError] = useState('');
    const [duration, setDuration] = useState(0);
    const [downloadDir, setDownloadDir] = useState('');
    const [logs, setLogs] = useState([]);
    const [downloading, setDownloading] = useState(false);

    const [useSection, setUseSection] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [useTranscode, setUseTranscode] = useState(false);
    const [audioFormat, setAudioFormat] = useState('mp3');

    const logRef = useRef(null);
    const ffmpegReady = Boolean(toolStatus?.ffmpegReady);
    const ytdlpReady = Boolean(toolStatus?.ytdlpReady);

    // 默认下载目录：~/Downloads/ytdlpgo
    useEffect(() => {
        GetDefaultDownloadDir()
            .then((dir) => setDownloadDir((prev) => prev || dir))
            .catch(() => {});
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
            valid = u.protocol === 'https:' || u.protocol === 'http:';
        } catch {
            // ignore
        }

        if (!valid) {
            setFormats([]);
            setSelected(undefined);
            setDuration(0);
            setFetchError('');
            return undefined;
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            setLoadingFmt(true);
            setFetchError('');
            try {
                const result = await listFormats(url);
                if (cancelled) return;
                const list = result.formats ?? [];
                setFormats(list);
                setSelected(list[0]?.id);
                setDuration(result.duration ?? 0);
                if (list.length === 0) {
                    setFetchError('未解析到可用格式，请确认链接可访问或站点受支持');
                }
            } catch (e) {
                if (cancelled) return;
                setFormats([]);
                setSelected(undefined);
                setDuration(0);
                setFetchError(String(e?.message || e));
            } finally {
                if (!cancelled) setLoadingFmt(false);
            }
        }, 600);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [url, listFormats]);

    const pasteFromClipboard = async () => {
        try {
            const text = (await GetClipboardText()).trim();
            if (!text) {
                msg.info('剪贴板为空');
                return;
            }
            if (!/^https?:\/\//i.test(text)) {
                msg.warning('剪贴板中没有有效的视频链接');
                return;
            }
            setUrl(text);
        } catch (err) {
            msg.error(`读取剪贴板失败：${err}`);
        }
    };

    const handleSelectDir = async () => {
        try {
            const dir = await SelectDirectory();
            if (dir) {
                setDownloadDir(dir);
            }
        } catch (err) {
            msg.error(`选择下载目录失败：${err}`);
        }
    };

    const handleSectionChange = (checked) => {
        setUseSection(checked);
        if (!checked) return;

        if (!startTime) setStartTime('00:00:00');
        if (!endTime && duration > 0) {
            setEndTime(formatDuration(Math.floor(duration)));
        }
        if (!ffmpegReady) {
            msg.warning('需要安装并在设置页中设置 ffmpeg 路径');
        }
    };

    const handleTranscodeChange = (checked) => {
        setUseTranscode(checked);
        if (checked && !ffmpegReady) {
            msg.warning('需要安装并在设置页中设置 ffmpeg 路径');
        }
    };

    const buildSection = () => {
        if (!useSection) return '';

        const startSec = parseTimeToSeconds(startTime);
        const endSec = parseTimeToSeconds(endTime);

        if (startSec === null || endSec === null) {
            msg.warning('时间格式不正确，请使用 HH:MM:SS');
            return null;
        }
        if (startSec >= endSec) {
            msg.warning('开始时间必须早于结束时间');
            return null;
        }
        if (duration > 0 && endSec > duration) {
            msg.warning(`结束时间超出视频时长（${formatDuration(duration)}）`);
            return null;
        }
        return `${startSec}-${endSec}`;
    };

    const handleDownload = async () => {
        if (!url) {
            msg.warning('请先填写视频 URL');
            return;
        }
        if (!selected) {
            msg.warning(`请先选择${formatLabel}`);
            return;
        }
        if (!downloadDir) {
            msg.warning('请先选择下载目录');
            return;
        }
        if ((useSection || useTranscode) && !ffmpegReady) {
            msg.warning('需要安装并在设置页中设置 ffmpeg 路径');
            return;
        }

        const section = buildSection();
        if (section === null) return;

        setLogs([]);
        setDownloading(true);
        try {
            await download(url, selected, downloadDir, section, useTranscode ? audioFormat : '');
        } catch (e) {
            setLogs((prev) => (
                prev.some((line) => line.includes('下载失败')) ? prev : [...prev, String(e)]
            ));
        } finally {
            setDownloading(false);
        }
    };

    const handleOpenFolder = async () => {
        if (!downloadDir) {
            msg.warning('请先选择下载目录');
            return;
        }
        try {
            await OpenFolder(downloadDir);
        } catch (e) {
            msg.error(String(e));
        }
    };

    const formatOptions = useMemo(
        () => formats.map((f) => ({ value: f.id, label: formatOptionLabel(f) })),
        [formats, formatOptionLabel],
    );

    const selectedFormat = formats.find((f) => f.id === selected);
    const progress = parseProgress(logs);
    const lastLog = logs[logs.length - 1] || '';
    const failed = /下载失败|ERROR:/i.test(lastLog);
    const finished = lastLog.includes('下载完成');
    const transcoding = !finished && logs.some(
        (line) => line.startsWith('[ExtractAudio]') || line.startsWith('[Merger]') || line.startsWith('[ffmpeg]'),
    );

    let statusText = '等待开始';
    let statusTone = 'idle';
    if (downloading) {
        statusTone = 'active';
        if (transcoding) {
            statusText = '转码中 · 即将完成';
        } else if (progress?.eta) {
            statusText = `正在下载 · 剩余约 ${etaText(progress.eta)}`;
        } else {
            statusText = '正在下载…';
        }
    } else if (failed) {
        statusTone = 'error';
        statusText = '下载失败';
    } else if (finished) {
        statusTone = 'ok';
        statusText = '已完成';
    } else if (logs.length > 0) {
        statusText = '已结束';
    }

    const statusRight = downloading
        ? (transcoding ? 'ffmpeg' : progress?.speed || '')
        : (finished ? progress?.totalSize || '' : '');

    const showProgress = downloading || finished || Boolean(progress && progress.percent > 0);
    const barPercent = finished ? 100 : progress?.percent || 0;

    let detailSummary = '';
    if (selectedFormat) {
        if (kind === 'audio') {
            const bits = [selectedFormat.ext?.toUpperCase()];
            if (selectedFormat.tbr) bits.push(bitrateLabel(selectedFormat.tbr));
            if (selectedFormat.fileSize) bits.push(`约 ${fileSizeLabel(selectedFormat.fileSize)}`);
            detailSummary = bits.filter(Boolean).join(' · ');
        } else {
            const bits = [resolutionBadge(selectedFormat.resolution), selectedFormat.ext];
            if (selectedFormat.fileSize) bits.push(`约 ${fileSizeLabel(selectedFormat.fileSize)}`);
            detailSummary = bits.filter(Boolean).join(' · ');
        }
    }

    const badge = toolStatus == null
        ? '正在检测 yt-dlp'
        : ytdlpReady ? 'yt-dlp 已就绪' : 'yt-dlp 未配置';
    const badgeTone = toolStatus == null ? 'neutral' : ytdlpReady ? 'ready' : 'danger';
    const onBadgeClick = toolStatus && !ytdlpReady ? () => navigate('/settings') : undefined;

    const formatNoun = kind === 'audio' ? '音频格式' : '清晰度';
    const hintText = loadingFmt
        ? `正在解析可用${formatNoun}，解析过程可能需要几秒…`
        : `链接变化后自动解析可用${formatNoun}，解析过程可能需要几秒`;

    return (
        <div className="media-page">
            {holder}
            <div className="page-scroll">
                <div className="content">
                    <PageHeader
                        title={pageTitle}
                        subtitle={pageSubtitle}
                        badge={badge}
                        badgeTone={badgeTone}
                        onBadgeClick={onBadgeClick}
                    />

                    <section className="card url-card">
                        <div className="card-head">
                            <span className="card-title">视频链接</span>
                            <span className="card-sub">{urlHint}</span>
                        </div>
                        <div className="url-input-row">
                            <div className="url-box">
                                <LinkIcon className="field-icon" size={17} />
                                <Input
                                    className="url-input"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    variant="borderless"
                                    spellCheck={false}
                                />
                            </div>
                            <button type="button" className="paste-btn" onClick={pasteFromClipboard}>
                                粘贴
                            </button>
                        </div>
                        <div className={`field-hint${fetchError ? ' error' : ''}`}>
                            {fetchError ? <AlertIcon size={15} /> : <InfoIcon size={15} />}
                            <span>{fetchError || hintText}</span>
                        </div>
                    </section>

                    <section className="card settings-card">
                        <div className="card-head">
                            <span className="card-title">{kind === 'audio' ? '音频设置' : '下载设置'}</span>
                        </div>

                        <div className="settings-grid">
                            <div className="field">
                                <label className="field-label">{formatLabel}</label>
                                <Select
                                    className="format-select"
                                    value={selected}
                                    onChange={setSelected}
                                    options={formatOptions}
                                    loading={loadingFmt}
                                    placeholder="粘贴 URL 后自动加载"
                                    allowClear
                                    notFoundContent={loadingFmt ? '加载中…' : '暂无数据'}
                                />
                            </div>

                            <div className="field">
                                <label className="field-label">保存位置</label>
                                <div className="path-row">
                                    <button
                                        type="button"
                                        className="path-box"
                                        onClick={handleSelectDir}
                                        title={downloadDir}
                                    >
                                        <FolderIcon className="field-icon" size={17} />
                                        <span className={`path-text${downloadDir ? '' : ' placeholder'}`}>
                                            {downloadDir ? prettyPath(downloadDir) : '选择保存位置'}
                                        </span>
                                    </button>
                                    <Button className="ghost-btn browse-btn" onClick={handleSelectDir}>
                                        浏览
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="card-divider" />

                        <div className="row-between">
                            <div>
                                <h3 className="row-title">下载指定时段</h3>
                                <p className="row-desc">
                                    {kind === 'audio'
                                        ? '只提取视频中的一段音频，需要 ffmpeg'
                                        : '只截取视频中的一段，需要 ffmpeg'}
                                </p>
                            </div>
                            <Switch checked={useSection} onChange={handleSectionChange} />
                        </div>

                        {useSection && (
                            <div className="section-time-box">
                                <div className={`time-field${!ffmpegReady ? ' disabled' : ''}`}>
                                    <ClockIcon size={15} />
                                    <Input
                                        className="time-input"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        placeholder="开始 00:00:00"
                                        variant="borderless"
                                        disabled={!ffmpegReady}
                                    />
                                </div>
                                <span className="time-sep">至</span>
                                <div className={`time-field${!ffmpegReady ? ' disabled' : ''}`}>
                                    <ClockIcon size={15} />
                                    <Input
                                        className="time-input"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        placeholder="结束 00:00:00"
                                        variant="borderless"
                                        disabled={!ffmpegReady}
                                    />
                                </div>
                                {duration > 0 && (
                                    <span className="duration-pill">
                                        {durationLabel} {formatDuration(duration)}
                                    </span>
                                )}
                            </div>
                        )}

                        {useSection && !ffmpegReady && (
                            <p className="inline-warning">
                                <AlertIcon size={14} />
                                未配置 ffmpeg，时段截取暂不可用，请前往设置页配置
                            </p>
                        )}

                        {enableTranscode && (
                            <>
                                <div className="card-divider" />
                                <div className="transcode-row">
                                    <div className="transcode-info">
                                        <h3 className="row-title">
                                            转码为其他格式
                                            <span className={`mini-pill${ffmpegReady ? ' success' : ' danger'}`}>
                                                {ffmpegReady ? <CheckCircleIcon size={12} /> : <AlertIcon size={12} />}
                                                {ffmpegReady ? 'ffmpeg 已就绪' : '未配置 ffmpeg'}
                                            </span>
                                        </h3>
                                        <p className="row-desc">下载完成后使用 ffmpeg 转换音频编码</p>
                                    </div>
                                    <div className="transcode-controls">
                                        <span className="control-label">输出格式</span>
                                        <Select
                                            className="transcode-select"
                                            value={audioFormat}
                                            onChange={setAudioFormat}
                                            options={TRANSCODE_OPTIONS}
                                            disabled={!useTranscode || !ffmpegReady}
                                        />
                                        <Switch checked={useTranscode} onChange={handleTranscodeChange} />
                                    </div>
                                </div>
                                {useTranscode && !ffmpegReady && (
                                    <p className="inline-warning">
                                        <AlertIcon size={14} />
                                        未配置 ffmpeg，转码暂不可用，请前往设置页配置
                                    </p>
                                )}
                            </>
                        )}
                    </section>

                    <section className="card detail-card">
                        <div className="card-head">
                            <span className="card-title">下载详情</span>
                            <span className="card-sub">实时日志</span>
                            {detailSummary && <span className="detail-summary">{detailSummary}</span>}
                        </div>

                        <div className="terminal" ref={logRef}>
                            {logs.length === 0 ? (
                                <div className="terminal-empty">下载日志将在这里实时显示</div>
                            ) : (
                                logs.map((line, i) => (
                                    <div key={`${i}-${line.slice(0, 24)}`} className={`log-line ${logLineTone(line)}`}>
                                        {line}
                                    </div>
                                ))
                            )}
                            {showProgress && (
                                <div className="progress-wrap">
                                    <div className="progress-track">
                                        <div className="progress-fill" style={{ width: `${barPercent}%` }} />
                                    </div>
                                    <span className="progress-text">{barPercent.toFixed(1)}%</span>
                                </div>
                            )}
                        </div>

                        <div className="detail-status">
                            <span className={`status-indicator ${statusTone}`} />
                            <span>{statusText}</span>
                            {statusRight && <span className="detail-speed">{statusRight}</span>}
                        </div>
                    </section>
                </div>
            </div>

            <footer className="page-footer">
                <div className="footer-inner">
                    <span className="footer-note">
                        <InfoIcon size={15} />
                        下载内容仅用于个人备份，请遵守站点条款
                    </span>
                    <div className="footer-actions">
                        <Button className="ghost-btn" icon={<FolderIcon size={16} />} onClick={handleOpenFolder}>
                            打开文件夹
                        </Button>
                        <Button
                            type="primary"
                            className="primary-btn"
                            icon={<DownloadIcon size={17} />}
                            loading={downloading}
                            disabled={(useSection || useTranscode) && !ffmpegReady}
                            onClick={handleDownload}
                        >
                            下载
                        </Button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
