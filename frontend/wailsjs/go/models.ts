export namespace config {
	
	export class Settings {
	    ytdlpPath: string;
	    ffmpegPath: string;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ytdlpPath = source["ytdlpPath"];
	        this.ffmpegPath = source["ffmpegPath"];
	    }
	}

}

export namespace main {
	
	export class ToolStatus {
	    ytdlpPath: string;
	    ytdlpVersion: string;
	    ytdlpReady: boolean;
	    ffmpegPath: string;
	    ffmpegVersion: string;
	    ffmpegReady: boolean;
	    configPath: string;
	
	    static createFrom(source: any = {}) {
	        return new ToolStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ytdlpPath = source["ytdlpPath"];
	        this.ytdlpVersion = source["ytdlpVersion"];
	        this.ytdlpReady = source["ytdlpReady"];
	        this.ffmpegPath = source["ffmpegPath"];
	        this.ffmpegVersion = source["ffmpegVersion"];
	        this.ffmpegReady = source["ffmpegReady"];
	        this.configPath = source["configPath"];
	    }
	}

}

export namespace media {
	
	export class AudioFormat {
	    id: string;
	    ext: string;
	    fileSize: string;
	    tbr: string;
	    acodec: string;
	
	    static createFrom(source: any = {}) {
	        return new AudioFormat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.ext = source["ext"];
	        this.fileSize = source["fileSize"];
	        this.tbr = source["tbr"];
	        this.acodec = source["acodec"];
	    }
	}
	export class AudioFormats {
	    formats: AudioFormat[];
	    duration: number;
	
	    static createFrom(source: any = {}) {
	        return new AudioFormats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.formats = this.convertValues(source["formats"], AudioFormat);
	        this.duration = source["duration"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Format {
	    id: string;
	    ext: string;
	    resolution: string;
	    fileSize: string;
	    tbr: string;
	    vcodec: string;
	
	    static createFrom(source: any = {}) {
	        return new Format(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.ext = source["ext"];
	        this.resolution = source["resolution"];
	        this.fileSize = source["fileSize"];
	        this.tbr = source["tbr"];
	        this.vcodec = source["vcodec"];
	    }
	}
	export class VideoFormats {
	    formats: Format[];
	    duration: number;
	
	    static createFrom(source: any = {}) {
	        return new VideoFormats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.formats = this.convertValues(source["formats"], Format);
	        this.duration = source["duration"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

