import { useLocation, useOutlet, useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { KeepAlive } from 'keepalive-for-react';

const NAV_ITEMS = [
    { path: '/', label: '视频' },
    { path: '/audio', label: '音频' },
    { path: '/settings', label: '设置' },
];

export default function Layout() {
    const location = useLocation();
    const outlet = useOutlet();
    const navigate = useNavigate();
    const cacheKey = location.pathname + location.search;

    return (
        <div className="layout">
            <nav className="top-nav">
                {NAV_ITEMS.map((item) => (
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
