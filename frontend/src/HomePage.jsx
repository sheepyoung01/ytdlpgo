import MediaDownloadPage from './MediaDownloadPage';
import {ListVideoFormats, DownloadVideo} from '../wailsjs/go/main/App';

export default function HomePage() {
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
