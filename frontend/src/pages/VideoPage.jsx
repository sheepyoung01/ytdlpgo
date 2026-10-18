import MediaDownloadPage from '../components/MediaDownloadPage';
import {ListVideoFormats, DownloadVideo} from '../../wailsjs/go/main/App';

export default function VideoPage() {
    return (
        <MediaDownloadPage
            formatLabel="视频分辨率"
            listFormats={ListVideoFormats}
            download={DownloadVideo}
            logEvent="download-log"
            formatOptionLabel={(f) =>
                `${f.id} | ${f.ext} | ${f.resolution} | ${f.fileSize} | ${f.tbr} | ${f.vcodec}`
            }
        />
    );
}
