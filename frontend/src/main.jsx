import React from 'react'
import {createRoot} from 'react-dom/client'
import {ConfigProvider} from 'antd'
import zhCN from 'antd/locale/zh_CN'
import '@ant-design/v5-patch-for-react-19'
import 'antd/dist/reset.css'
import './styles/global.css'
import './styles/App.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'

// 把前端异常输出到控制台（wails dev 会把控制台日志转发到终端），便于定位问题
window.addEventListener('error', (e) => {
    console.error('[window error]', e.error || e.message)
})
window.addEventListener('unhandledrejection', (e) => {
    console.error('[unhandled rejection]', e.reason)
})

const theme = {
    token: {
        colorPrimary: '#7c5cfc',
        colorInfo: '#7c5cfc',
        colorText: '#1f2329',
        colorTextSecondary: '#62666e',
        borderRadius: 10,
        borderRadiusLG: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    },
    components: {
        Select: {
            optionSelectedBg: '#f3efff',
            optionActiveBg: '#f7f5ff',
        },
        Button: {
            primaryShadow: 'none',
            defaultShadow: 'none',
        },
        Input: {
            activeBorderColor: '#b9a9ff',
            hoverBorderColor: '#d6d0f6',
            activeShadow: '0 0 0 3px rgba(124, 92, 252, 0.09)',
        },
    },
}

const container = document.getElementById('root')

const root = createRoot(container)

root.render(
    <React.StrictMode>
        <ConfigProvider locale={zhCN} theme={theme}>
            <ErrorBoundary>
                <App/>
            </ErrorBoundary>
        </ConfigProvider>
    </React.StrictMode>
)
