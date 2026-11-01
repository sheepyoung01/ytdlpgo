import MediaDownloadPage from '../components/MediaDownloadPage';
import { ListVideoFormats, DownloadVideo } from '../../wailsjs/go/main/App';
import { codecLabel, resolutionBadge } from '../utils/format';

function formatOption(f) {
    const resolution = f.resolution ? f.resolution.replace(/\s*[x×]\s*/i, '×') : '';
    const detail = [f.id, f.ext, resolution, codecLabel(f.vcodec)].filter(Boolean).join(' · ');

    return (
        <span className="format-option">
            <span className="format-badge">{resolutionBadge(f.resolution)}</span>
            <span className="format-detail">{detail}</span>
            {f.fileSize && <span className="format-size">{f.fileSize}</span>}
        </span>
    );
}

export default function VideoPage() {
    return (
        <MediaDownloadPage
            pageTitle="视频下载"
            pageSubtitle="粘贴链接，选择画质，一键保存到本地"
            urlHint="支持 YouTube、Bilibili 等站点"
            durationLabel="视频时长"
            kind="video"
            formatLabel="视频分辨率"
            listFormats={ListVideoFormats}
            download={DownloadVideo}
            logEvent="download-log"
            formatOptionLabel={formatOption}
        />
    );
}
