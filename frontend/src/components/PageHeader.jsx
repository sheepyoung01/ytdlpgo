export default function PageHeader({ title, subtitle, badge, badgeTone = 'ready', onBadgeClick }) {
    const badgeClass = `status-pill tone-${badgeTone}${onBadgeClick ? ' clickable' : ''}`;

    return (
        <header className="page-header">
            <div className="page-heading">
                <h1 className="page-title">{title}</h1>
                <p className="page-subtitle">{subtitle}</p>
            </div>
            {badge && (
                onBadgeClick ? (
                    <button type="button" className={badgeClass} onClick={onBadgeClick}>
                        <span className="status-dot" />
                        <span>{badge}</span>
                    </button>
                ) : (
                    <span className={badgeClass}>
                        <span className="status-dot" />
                        <span>{badge}</span>
                    </span>
                )
            )}
        </header>
    );
}
