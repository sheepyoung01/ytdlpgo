import MediaDownloadPage from '../components/MediaDownloadPage';
import {ListAudioFormats, DownloadAudio} from '../../wailsjs/go/main/App';

export default function AudioPage() {
    return (
        <MediaDownloadPage
            formatLabel="音频格式"
            listFormats={ListAudioFormats}
            download={DownloadAudio}
            logEvent="audio-log"
            formatOptionLabel={(f) =>
                `${f.id} | ${f.ext} | ${f.fileSize} | ${f.tbr} | ${f.acodec}`
            }
            enableTranscode
        />
    );
}
