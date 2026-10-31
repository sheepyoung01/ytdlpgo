import MediaDownloadPage from '../components/MediaDownloadPage';
import { ListAudioFormats, DownloadAudio } from '../../wailsjs/go/main/App';
import { audioQualityLabel, bitrateLabel } from '../utils/format';

function formatOption(f) {
    const quality = audioQualityLabel(f.tbr);
    const detail = [
        f.id,
        f.tbr ? bitrateLabel(f.tbr) : '',
        quality,
    ].filter(Boolean).join(' · ');

    return (
        <span className="format-option">
            <span className="format-badge">{(f.ext || f.acodec || 'AUDIO').toUpperCase()}</span>
            <span className="format-detail">{detail}</span>
            {f.fileSize && <span className="format-size">{f.fileSize}</span>}
        </span>
    );
}

export default function AudioPage() {
    return (
        <MediaDownloadPage
            pageTitle="音频下载"
            pageSubtitle="提取视频中的音轨，可选格式与转码"
            urlHint="从任意支持站点提取音频"
            durationLabel="原视频时长"
            kind="audio"
            formatLabel="音频格式"
            listFormats={ListAudioFormats}
            download={DownloadAudio}
            logEvent="audio-log"
            formatOptionLabel={formatOption}
            enableTranscode
        />
    );
}
