import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import VideoPage from './pages/VideoPage';
import AudioPage from './pages/AudioPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
    return (
        <HashRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<VideoPage />} />
                    <Route path="/audio" element={<AudioPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </HashRouter>
    );
}
