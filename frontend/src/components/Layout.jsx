import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { Modal, Tooltip } from 'antd';
import { KeepAlive } from 'keepalive-for-react';
import useToolStatus from '../hooks/useToolStatus';
import { Environment, WindowSetTitle } from '../../wailsjs/runtime/runtime';
import {
    CheckCircleIcon,
    HelpIcon,
    LogoIcon,
    MinusCircleIcon,
    MusicIcon,
    SettingsIcon,
    VideoIcon,
} from './Icons';

const NAV_ITEMS = [
    { path: '/', label: '视频下载', icon: VideoIcon },
    { path: '/audio', label: '音频下载', icon: MusicIcon },
    { path: '/settings', label: '设置', icon: SettingsIcon },
];

const PAGE_TITLES = {
    '/': '视频下载',
    '/audio': '音频下载',
    '/settings': '设置',
};

export default function Layout() {
    const location = useLocation();
    const outlet = useOutlet();
    const navigate = useNavigate();
    const cacheKey = location.pathname + location.search;
    const [toolStatus] = useToolStatus();
    const [isMac, setIsMac] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);

    const title = PAGE_TITLES[location.pathname] || '视频下载';

    useEffect(() => {
        Environment()
            .then((env) => setIsMac(env?.platform === 'darwin'))
            .catch(() => {});
    }, []);

    useEffect(() => {
        try {
            WindowSetTitle(`ytdlpgo · ${title}`);
        } catch {
            // 浏览器预览环境没有 Wails runtime
        }
    }, [title]);

    const ytdlpReady = Boolean(toolStatus?.ytdlpReady);
    const ffmpegReady = Boolean(toolStatus?.ffmpegReady);
    const browserName = toolStatus?.cookieBrowser === 'firefox' ? 'Firefox' : 'Chrome';
    const appVersion = toolStatus?.appVersion || '1.0.0';

    return (
        <div className={`layout${isMac ? ' is-mac' : ''}`}>
            <header className="window-bar">
                <span className="window-bar-title">ytdlpgo · {title}</span>
                <Tooltip title="使用说明" placement="bottomRight">
                    <button
                        type="button"
                        className="window-bar-help"
                        aria-label="使用说明"
                        onClick={() => setHelpOpen(true)}
                    >
                        <HelpIcon size={18} />
                    </button>
                </Tooltip>
            </header>

            <div className="app-body">
                <aside className="sidebar">
                    <div className="brand">
                        <div className="brand-logo">
                            <LogoIcon size={24} />
                        </div>
                        <div className="brand-text">
                            <div className="brand-name">ytdlpgo</div>
                            <div className="brand-sub">视频下载工具</div>
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const active = location.pathname === item.path;
                            return (
                                <button
                                    key={item.path}
                                    type="button"
                                    className={`nav-item${active ? ' active' : ''}`}
                                    onClick={() => navigate(item.path)}
                                >
                                    <Icon size={19} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    <div className="sidebar-spacer" />

                    <div className="tool-status-card">
                        <div className="tool-status-title">工具状态</div>
                        <div className="tool-status-row">
                            <span className="tool-name">
                                <CheckCircleIcon
                                    size={15}
                                    className={`tool-state-icon${ytdlpReady ? ' ready' : ''}`}
                                />
                                yt-dlp
                            </span>
                            <span className="tool-version" title={toolStatus?.ytdlpVersion || ''}>
                                {ytdlpReady ? toolStatus.ytdlpVersion : '未配置'}
                            </span>
                        </div>
                        <div className="tool-status-row">
                            <span className="tool-name">
                                {ffmpegReady ? (
                                    <CheckCircleIcon size={15} className="tool-state-icon ready" />
                                ) : (
                                    <MinusCircleIcon size={15} className="tool-state-icon" />
                                )}
                                ffmpeg
                            </span>
                            <span className="tool-version" title={toolStatus?.ffmpegVersion || ''}>
                                {ffmpegReady ? '已就绪' : '未配置'}
                            </span>
                        </div>
                    </div>

                    <div className="app-version">v{appVersion}</div>
                </aside>

                <main className="main">
                    <KeepAlive activeCacheKey={cacheKey} max={10}>
                        {outlet}
                    </KeepAlive>
                </main>
            </div>

            <Modal
                title="使用说明"
                open={helpOpen}
                onCancel={() => setHelpOpen(false)}
                footer={null}
                width={480}
                centered
            >
                <ol className="help-list">
                    <li>粘贴视频链接后会自动解析可用清晰度，解析过程可能需要几秒。</li>
                    <li>下载会读取本机 {browserName} 登录状态，请确保 {browserName} 已登录目标站点。</li>
                    <li>时段截取与音频转码需要配置 ffmpeg，可在「设置」页自动检测。</li>
                    <li>下载内容仅用于个人备份，请遵守站点条款。</li>
                </ol>
            </Modal>
        </div>
    );
}
