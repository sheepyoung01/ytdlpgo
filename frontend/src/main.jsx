import React from 'react'
import {createRoot} from 'react-dom/client'
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

const container = document.getElementById('root')

const root = createRoot(container)

root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <App/>
        </ErrorBoundary>
    </React.StrictMode>
)
