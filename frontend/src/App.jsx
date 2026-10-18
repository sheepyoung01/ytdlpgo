import { HashRouter, Routes, Route, Navigate, useLocation, useOutlet, useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import HomePage from './HomePage';
import SettingsPage from './SettingsPage';
import AudioPage from './AudioPage';
import { KeepAlive } from 'keepalive-for-react';

function KeepAliveLayout() {
    const location = useLocation();
    const outlet = useOutlet();
    const navigate = useNavigate();
    const cacheKey = location.pathname + location.search;

    const navItems = [
        { path: '/', label: '视频' },
        { path: '/audio', label: '音频' },
        { path: '/settings', label: '设置' },
    ];

    return (
        <div className="layout">
            <nav className="top-nav">
                {navItems.map((item) => (
                    <Button
                        key={item.path}
                        className={`nav-btn${location.pathname === item.path ? ' nav-btn-active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        {item.label}
                    </Button>
                ))}
            </nav>
            <div className="page-area">
                <KeepAlive activeCacheKey={cacheKey} max={10}>
                    {outlet}
                </KeepAlive>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <HashRouter>
            <Routes>
                <Route element={<KeepAliveLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/audio" element={<AudioPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </HashRouter>
    );
}
