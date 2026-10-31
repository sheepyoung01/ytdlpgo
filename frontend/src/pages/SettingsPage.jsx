import { useEffect, useState } from 'react';
import { Button, Input, message } from 'antd';
import {
    DetectFFmpeg,
    DetectYtdlp,
    GetSettings,
    SaveSettings,
    SelectFFmpeg,
    SelectFile,
} from '../../wailsjs/go/main/App';
import { EventsEmit } from '../../wailsjs/runtime/runtime';
import useToolStatus from '../hooks/useToolStatus';
import PageHeader from '../components/PageHeader';
import {
    AlertIcon,
    CheckCircleIcon,
    CheckIcon,
    ChromeIcon,
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
                                    <ChromeIcon size={20} />
                                </div>
                                <div className="info-tile-body">
                                    <div className="info-tile-title">Chrome 登录状态</div>
                                    <div className="info-tile-desc">自动读取本机 Chrome 的 Cookies</div>
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
                                解析与下载会通过 <code>--cookies-from-browser chrome</code> 读取登录状态，
                                请确保本机 Chrome 已登录目标站点。若站点无法访问，可先尝试在 Chrome 中打开并播放一次。
                            </span>
                        </p>
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
