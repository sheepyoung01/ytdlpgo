import { useCallback, useEffect, useState } from 'react';
import { GetToolStatus } from '../../wailsjs/go/main/App';
import { EventsOn } from '../../wailsjs/runtime/runtime';

// 读取外部工具状态，并在设置保存后自动刷新
export default function useToolStatus() {
    const [status, setStatus] = useState(null);

    const refresh = useCallback(() => {
        GetToolStatus()
            .then(setStatus)
            .catch(() => setStatus(null));
    }, []);

    useEffect(() => {
        refresh();
        const cancel = EventsOn('settings-changed', refresh);
        return () => cancel();
    }, [refresh]);

    return [status, refresh];
}
