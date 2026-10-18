import React from 'react';

/**
 * 捕获渲染阶段抛出的错误，避免整个页面变成空白。
 */
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {error: null};
    }

    static getDerivedStateFromError(error) {
        return {error};
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="page">
                    <div style={{maxWidth: 720, color: '#000'}}>
                        <h3>页面出错了</h3>
                        <pre style={{whiteSpace: 'pre-wrap'}}>{String(this.state.error)}</pre>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
