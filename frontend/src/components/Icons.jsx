function Svg({ size = 18, children, ...props }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            {children}
        </svg>
    );
}

export function LogoIcon({ size = 24, ...props }) {
    return (
        <Svg size={size} strokeWidth="2.1" {...props}>
            <path d="M12 3v11" />
            <path d="m7.5 9.8 4.5 4.4 4.5-4.4" />
            <path d="M4.5 16.5v2.1a2.4 2.4 0 0 0 2.4 2.4h10.2a2.4 2.4 0 0 0 2.4-2.4v-2.1" />
        </Svg>
    );
}

export function VideoIcon({ size = 19, ...props }) {
    return (
        <Svg size={size} {...props}>
            <rect x="3" y="5.5" width="18" height="13" rx="3" />
            <path d="m10.2 9.4 4.2 2.6-4.2 2.6z" fill="currentColor" stroke="none" />
        </Svg>
    );
}

export function MusicIcon({ size = 19, ...props }) {
    return (
        <Svg size={size} {...props}>
            <path d="M9 18V6.6l9-2.1v11.3" />
            <circle cx="6.4" cy="18" r="2.6" />
            <circle cx="15.4" cy="15.8" r="2.6" />
        </Svg>
    );
}

export function SettingsIcon({ size = 19, ...props }) {
    return (
        <Svg size={size} {...props}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 14.4a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.11a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 14.4a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.11a1.7 1.7 0 0 0 1.55-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.11a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87c.15.32.24.67.24 1s-.09.68-.24 1Z" />
        </Svg>
    );
}

export function LinkIcon({ size = 17, ...props }) {
    return (
        <Svg size={size} {...props}>
            <path d="M10 13.8a4.2 4.2 0 0 0 6 0l2.3-2.3a4.24 4.24 0 0 0-6-6L11 6.8" />
            <path d="M14 10.2a4.2 4.2 0 0 0-6 0l-2.3 2.3a4.24 4.24 0 0 0 6 6l1.3-1.3" />
        </Svg>
    );
}

export function FolderIcon({ size = 17, ...props }) {
    return (
        <Svg size={size} {...props}>
            <path d="M3.5 8.2c0-1.32 1.07-2.4 2.4-2.4h3l1.6 2h7.6c1.33 0 2.4 1.08 2.4 2.4v7.4c0 1.33-1.07 2.4-2.4 2.4H5.9a2.4 2.4 0 0 1-2.4-2.4z" />
            <path d="M3.8 10.6h16.4" opacity=".45" />
        </Svg>
    );
}

export function ClockIcon({ size = 16, ...props }) {
    return (
        <Svg size={size} {...props}>
            <circle cx="12" cy="12" r="8.2" />
            <path d="M12 7.6V12l2.9 1.9" />
        </Svg>
    );
}

export function InfoIcon({ size = 16, ...props }) {
    return (
        <Svg size={size} {...props}>
            <circle cx="12" cy="12" r="8.4" />
            <path d="M12 11v5" />
            <path d="M12 8.2h.01" />
        </Svg>
    );
}

export function HelpIcon({ size = 18, ...props }) {
    return (
        <Svg size={size} {...props}>
            <circle cx="12" cy="12" r="8.4" />
            <path d="M9.8 9.5a2.3 2.3 0 0 1 4.5.6c0 1.5-2.3 1.9-2.3 3.3" />
            <path d="M12 16.5h.01" />
        </Svg>
    );
}

export function TerminalIcon({ size = 19, ...props }) {
    return (
        <Svg size={size} {...props}>
            <rect x="3" y="4.8" width="18" height="14.4" rx="3" />
            <path d="m7.2 9.4 2.6 2.4-2.6 2.4" />
            <path d="M12.8 14.7h4" />
        </Svg>
    );
}

export function FilmIcon({ size = 19, ...props }) {
    return (
        <Svg size={size} {...props}>
            <rect x="3" y="4.8" width="18" height="14.4" rx="2.8" />
            <path d="M7.2 4.8v14.4M16.8 4.8v14.4M3 9.4h4.2M3 14.6h4.2M16.8 9.4H21M16.8 14.6H21" />
        </Svg>
    );
}

export function FileIcon({ size = 19, ...props }) {
    return (
        <Svg size={size} {...props}>
            <path d="M6.3 3.8h7.2l4.2 4.2v10.2a2 2 0 0 1-2 2H6.3a2 2 0 0 1-2-2V5.8a2 2 0 0 1 2-2Z" />
            <path d="M13.3 3.8v4.3h4.3" />
            <path d="M8.4 12.4h5.2M8.4 15.6h5.2" opacity=".6" />
        </Svg>
    );
}

export function ChromeIcon({ size = 19, ...props }) {
    return (
        <Svg size={size} {...props}>
            <circle cx="12" cy="12" r="8.4" />
            <circle cx="12" cy="12" r="3.4" />
            <path d="M12 3.6c3.4 0 5.9 1.7 7.3 4M4.6 8.2c1.7-2.9 4-4.6 7.4-4.6M19.8 10.5c-.9 4-3.9 6.7-7.8 6.7-2.3 0-4.4-1-5.9-2.6" />
        </Svg>
    );
}

export function DownloadIcon({ size = 18, ...props }) {
    return (
        <Svg size={size} strokeWidth="2" {...props}>
            <path d="M12 4v10" />
            <path d="m7.8 10 4.2 4.1L16.2 10" />
            <path d="M5 19h14" />
        </Svg>
    );
}

export function CheckIcon({ size = 11, ...props }) {
    return (
        <Svg size={size} strokeWidth="2.6" {...props}>
            <path d="m5 12.5 4.4 4.2L19 6.8" />
        </Svg>
    );
}

export function CheckCircleIcon({ size = 16, ...props }) {
    return (
        <Svg size={size} {...props}>
            <circle cx="12" cy="12" r="8.4" />
            <path d="m8.4 12.2 2.4 2.3 4.8-5" />
        </Svg>
    );
}

export function AlertIcon({ size = 16, ...props }) {
    return (
        <Svg size={size} {...props}>
            <circle cx="12" cy="12" r="8.4" />
            <path d="M12 7.8v5" />
            <path d="M12 16.3h.01" />
        </Svg>
    );
}

export function MinusCircleIcon({ size = 16, ...props }) {
    return (
        <Svg size={size} {...props}>
            <circle cx="12" cy="12" r="8.4" />
            <path d="M8.4 12h7.2" />
        </Svg>
    );
}

export function ArrowUpRightIcon({ size = 14, ...props }) {
    return (
        <Svg size={size} {...props}>
            <path d="M7 17 17 7" />
            <path d="M9 7h8v8" />
        </Svg>
    );
}
