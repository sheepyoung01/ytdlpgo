import { useEffect, useState } from 'react';
import { Button, Input, message } from 'antd';
import {
    CheckForUpdate,
    DetectFFmpeg,
    DetectYtdlp,
    DownloadAndInstallUpdate,
    GetSettings,
    SaveSettings,
    SelectFFmpeg,
    SelectFile,
} from '../../wailsjs/go/main/App';
import { EventsEmit, EventsOn } from '../../wailsjs/runtime/runtime';
import useToolStatus from '../hooks/useToolStatus';
import PageHeader from '../components/PageHeader';
import {
    AlertIcon,
    CheckCircleIcon,
    CheckIcon,
    BrowserIcon,
    DownloadIcon,
    FileIcon,
    FilmIcon,
    InfoIcon,
    TerminalIcon,
} from '../components/Icons';

const samePath = (a, b) => (a || '').trim() === (b || '').trim();

export default function SettingsPage() {
    const [msg, holder] = message.useMessage();
    const [toolStatus, refreshToolStatus] = useToolStatus();

    const [ytdlpPath, setYtdlpPath] = useState('');
    const [ffmpegPath, setFfmpegPath] = useState('');
    const [original, setOriginal] = useState({ ytdlpPath: '', ffmpegPath: '' });
    const [loaded, setLoaded] = useState(false);

    const [checkingUpdate, setCheckingUpdate] = useState(false);
    const [updateStatus, setUpdateStatus] = useState('');
    const [updateProgress, setUpdateProgress] = useState(null);

    useEffect(() => {
        GetSettings()
            .then((s) => {
                const next = {
                    ytdlpPath: s.ytdlpPath || '',
                    ffmpegPath: s.ffmpegPath || '',
                };
                setYtdlpPath(next.ytdlpPath);
                setFfmpegPath(next.ffmpegPath);
                setOriginal(next);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                msg.error(`读取设置失败：${err}`);
            });
    }, [msg]);

    useEffect(() => {
        const cancel = EventsOn('update-progress', (progress) => {
            setUpdateProgress(progress);
            if (progress.stage === 'downloading') {
                setUpdateStatus(`正在下载更新 ${Math.round(progress.percent || 0)}%`);
            } else if (progress.stage === 'verifying') {
                setUpdateStatus('正在校验安装包…');
            } else if (progress.stage === 'installing') {
                setUpdateStatus('正在启动安装程序…');
            } else if (progress.stage === 'restarting') {
                setUpdateStatus('应用即将重启完成更新…');
            }
        });
        return () => cancel();
    }, []);

    const dirty = ytdlpPath !== original.ytdlpPath || ffmpegPath !== original.ffmpegPath;

    const browseYtdlp = async () => {
        const path = await SelectFile();
        if (path) setYtdlpPath(path);
    };

    const browseFfmpeg = async () => {
        const path = await SelectFFmpeg();
        if (path) setFfmpegPath(path);
    };

    const detectYtdlp = async () => {
        try {
            const path = await DetectYtdlp();
            setYtdlpPath(path);
            msg.success(`已检测到 yt-dlp：${path}`);
        } catch (e) {
            msg.error(String(e));
        }
    };

    const detectFfmpeg = async () => {
        try {
            const path = await DetectFFmpeg();
            setFfmpegPath(path);
            msg.success(`已检测到 ffmpeg：${path}`);
        } catch (e) {
            msg.error(String(e));
        }
    };

    const save = async () => {
        try {
            await SaveSettings({
                ytdlpPath: ytdlpPath.trim(),
                ffmpegPath: ffmpegPath.trim(),
            });
            const next = {
                ytdlpPath: ytdlpPath.trim(),
                ffmpegPath: ffmpegPath.trim(),
            };
            setYtdlpPath(next.ytdlpPath);
            setFfmpegPath(next.ffmpegPath);
            setOriginal(next);
            EventsEmit('settings-changed');
            refreshToolStatus();
            msg.success('设置已保存');
        } catch (e) {
            msg.error(String(e));
        }
    };

    const restore = () => {
        setYtdlpPath('');
        setFfmpegPath('');
        msg.info('已恢复默认值，点击「保存设置」后生效');
    };

    const checkAndUpdate = async () => {
        if (checkingUpdate) return;

        setCheckingUpdate(true);
        setUpdateProgress(null);
        setUpdateStatus('正在检查更新…');
        try {
            const info = await CheckForUpdate();
            if (info.isLatest) {
                setUpdateStatus(`当前已是最新版本 v${info.currentVersion}`);
                msg.success('当前已是最新版本');
                return;
            }

            setUpdateStatus(`发现新版本 v${info.latestVersion}，正在下载安装器…`);
            msg.info(`发现新版本 v${info.latestVersion}，开始下载`);
            await DownloadAndInstallUpdate();
            setUpdateStatus('安装程序已启动，应用即将重启完成更新…');
        } catch (e) {
            setUpdateProgress(null);
            setUpdateStatus('检查更新失败，请稍后重试');
            msg.error(String(e));
        } finally {
            setCheckingUpdate(false);
        }
    };

    const detectState = (path, savedPath, ready) => {
        if (!path) return { label: '未配置', tone: 'neutral' };
        if (!toolStatus) return { label: '检测中', tone: 'neutral' };
        if (!samePath(path, savedPath)) return { label: '待保存', tone: 'neutral' };
        return ready
            ? { label: '已检测', tone: 'success' }
            : { label: '不可用', tone: 'danger' };
    };

    const ytdlpState = detectState(ytdlpPath, toolStatus?.ytdlpPath, toolStatus?.ytdlpReady);
    const ffmpegState = detectState(ffmpegPath, toolStatus?.ffmpegPath, toolStatus?.ffmpegReady);
    const cookieBrowser = toolStatus?.cookieBrowser || 'chrome';
    const browserName = cookieBrowser === 'firefox' ? 'Firefox' : 'Chrome';
    const appVersion = toolStatus?.appVersion || '1.0.0';

    const headerBadge = !loaded
        ? { text: '正在读取配置', tone: 'neutral' }
        : dirty
            ? { text: '有未保存的修改', tone: 'warning' }
            : { text: '配置已保存', tone: 'ready' };

    return (
        <div className="settings-page">
            {holder}
            <div className="page-scroll">
                <div className="content">
                    <PageHeader
                        title="设置"
                        subtitle="配置外部工具路径，保存后立即生效"
                        badge={headerBadge.text}
                        badgeTone={headerBadge.tone}
                    />

                    <section className="card settings-card">
                        <div className="card-head">
                            <span className="card-title">外部工具</span>
                            <span className="card-sub">
                                应用依赖 yt-dlp 解析与下载，ffmpeg 用于时段截取和转码
                            </span>
                        </div>

                        <div className="tool-row">
                            <div className="tool-icon">
                                <TerminalIcon size={19} />
                            </div>
                            <div className="tool-label">
                                <div className="tool-name">yt-dlp</div>
                                <div className="tool-desc">必需 · 下载核心</div>
                            </div>
                            <Input
                                className="tool-input"
                                value={ytdlpPath}
                                onChange={(e) => setYtdlpPath(e.target.value)}
                                placeholder="点击浏览或自动检测"
                                spellCheck={false}
                            />
                            <span className={`detected-pill ${ytdlpState.tone}`}>
                                {ytdlpState.tone === 'success' && <CheckCircleIcon size={12} />}
                                {ytdlpState.tone === 'danger' && <AlertIcon size={12} />}
                                {ytdlpState.label}
                            </span>
                            <Button className="ghost-btn tool-browse" onClick={browseYtdlp}>
                                浏览
                            </Button>
                            <button type="button" className="detect-link" onClick={detectYtdlp}>
                                自动检测
                            </button>
                        </div>

                        <div className="tool-row-sep" />

                        <div className="tool-row">
                            <div className="tool-icon">
                                <FilmIcon size={19} />
                            </div>
                            <div className="tool-label">
                                <div className="tool-name">ffmpeg</div>
                                <div className="tool-desc">可选 · 时段与转码</div>
                            </div>
                            <Input
                                className="tool-input"
                                value={ffmpegPath}
                                onChange={(e) => setFfmpegPath(e.target.value)}
                                placeholder="点击浏览或自动检测"
                                spellCheck={false}
                            />
                            <span className={`detected-pill ${ffmpegState.tone}`}>
                                {ffmpegState.tone === 'success' && <CheckCircleIcon size={12} />}
                                {ffmpegState.tone === 'danger' && <AlertIcon size={12} />}
                                {ffmpegState.label}
                            </span>
                            <Button className="ghost-btn tool-browse" onClick={browseFfmpeg}>
                                浏览
                            </Button>
                            <button type="button" className="detect-link" onClick={detectFfmpeg}>
                                自动检测
                            </button>
                        </div>

                        <p className="tool-hint">
                            <InfoIcon size={15} />
                            未找到 ffmpeg 时，时段截取与转码功能将不可用
                        </p>
                    </section>

                    <section className="card">
                        <div className="card-head">
                            <span className="card-title">登录与网络</span>
                        </div>

                        <div className="network-grid">
                            <div className="info-tile">
                                <div className="info-tile-icon">
                                    <BrowserIcon size={20} />
                                </div>
                                <div className="info-tile-body">
                                    <div className="info-tile-title">{browserName} 登录状态</div>
                                    <div className="info-tile-desc">自动读取本机 {browserName} 的 Cookies</div>
                                </div>
                                <span className="info-tile-state">已启用</span>
                            </div>

                            <div className="info-tile">
                                <div className="info-tile-icon">
                                    <FileIcon size={20} />
                                </div>
                                <div className="info-tile-body">
                                    <div className="info-tile-title">配置文件</div>
                                    <div className="info-tile-desc" title={toolStatus?.configPath || ''}>
                                        本机 settings.json
                                    </div>
                                </div>
                                <span className="info-tile-state">自动保存</span>
                            </div>
                        </div>

                        <p className="network-hint">
                            <InfoIcon size={15} />
                            <span>
                                解析与下载会通过 <code>--cookies-from-browser {cookieBrowser}</code> 读取登录状态，
                                请确保本机 {browserName} 已登录目标站点。若站点无法访问，可先尝试在 {browserName} 中打开并播放一次。
                                {cookieBrowser === 'firefox' && ' Windows 端使用 Firefox 以避开 Chrome App-Bound Encryption 限制。'}
                            </span>
                        </p>
                    </section>

                    <section className="card update-card">
                        <div className="card-head">
                            <span className="card-title">版本更新</span>
                            <span className="card-sub">从 GitHub Releases 获取最新版本</span>
                        </div>
                        <div className="update-row">
                            <div className="update-info">
                                <div className="update-version">当前版本 v{appVersion}</div>
                                <p className="row-desc">{updateStatus || '检查并自动安装最新版本，更新后会自动重启'}</p>
                            </div>
                            <Button
                                className="ghost-btn update-btn"
                                icon={<DownloadIcon size={16} />}
                                loading={checkingUpdate}
                                onClick={checkAndUpdate}
                            >
                                检查更新
                            </Button>
                        </div>
                        {updateProgress && ['downloading', 'verifying'].includes(updateProgress.stage) && (
                            <div className="update-progress">
                                <div className="progress-track">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${Math.max(0, Math.min(100, updateProgress.percent || 0))}%` }}
                                    />
                                </div>
                                <span className="update-percent">
                                    {Math.round(updateProgress.percent || 0)}%
                                </span>
                            </div>
                        )}
                    </section>

                    <section className="card save-card">
                        <span className="save-note">
                            <InfoIcon size={15} />
                            设置保存在本机，不会上传
                        </span>
                        <div className="save-actions">
                            <Button className="ghost-btn" onClick={restore}>
                                恢复默认
                            </Button>
                            <Button
                                type="primary"
                                className="primary-btn"
                                icon={<CheckIcon size={16} />}
                                onClick={save}
                            >
                                保存设置
                            </Button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
