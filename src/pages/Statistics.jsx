import { useState, useMemo } from 'react';
import {
    BarChart3, Calendar, Flame, TrendingUp, Video, CheckCircle2,
    ChevronLeft, ChevronRight, ExternalLink
} from 'lucide-react';

function Statistics({ projects }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Calculate statistics
    const stats = useMemo(() => {
        const now = new Date();
        const publishedProjects = projects.filter(p => p.status === 'published');

        // Get publication dates (use publishedAt if available, otherwise updatedAt for published projects)
        const publicationDates = publishedProjects.map(p => {
            const date = p.publishedAt || p.updatedAt;
            return new Date(date).toISOString().split('T')[0];
        });

        // Unique publication days
        const uniqueDays = [...new Set(publicationDates)];

        // Calculate streak
        let currentStreak = 0;
        let maxStreak = 0;
        let tempStreak = 0;

        const sortedDays = uniqueDays.sort().reverse();
        const today = now.toISOString().split('T')[0];
        const yesterday = new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0];

        // Check if published today or yesterday to start streak
        if (sortedDays.includes(today) || sortedDays.includes(yesterday)) {
            for (let i = 0; i < 365; i++) {
                const checkDate = new Date();
                checkDate.setDate(checkDate.getDate() - i);
                const dateStr = checkDate.toISOString().split('T')[0];

                if (sortedDays.includes(dateStr)) {
                    tempStreak++;
                    maxStreak = Math.max(maxStreak, tempStreak);
                } else if (tempStreak > 0) {
                    break;
                }
            }
            currentStreak = tempStreak;
        }

        // This month's publications
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const thisMonthPublications = publishedProjects.filter(p => {
            const date = new Date(p.publishedAt || p.updatedAt);
            return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
        }).length;

        return {
            total: projects.length,
            published: publishedProjects.length,
            inProgress: projects.filter(p => p.status === 'in-progress').length,
            draft: projects.filter(p => p.status === 'draft').length,
            currentStreak,
            maxStreak,
            thisMonthPublications,
            publicationDates: new Set(publicationDates),
        };
    }, [projects]);

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay();

        const days = [];

        // Previous month padding
        for (let i = startPadding - 1; i >= 0; i--) {
            const date = new Date(year, month, -i);
            days.push({ date, isCurrentMonth: false });
        }

        // Current month days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(year, month, i);
            days.push({ date, isCurrentMonth: true });
        }

        // Next month padding
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            const date = new Date(year, month + 1, i);
            days.push({ date, isCurrentMonth: false });
        }

        return days;
    }, [currentMonth]);

    const goToPreviousMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
    };

    const isPublishedDay = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return stats.publicationDates.has(dateStr);
    };

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Recent published projects with links
    const recentPublished = projects
        .filter(p => p.status === 'published')
        .sort((a, b) => new Date(b.publishedAt || b.updatedAt) - new Date(a.publishedAt || a.updatedAt))
        .slice(0, 5);

    return (
        <div className="page-container">
            <header className="header">
                <h1 className="header-title">Statistics</h1>
            </header>

            <div className="page-container" style={{ paddingTop: 0 }}>
                {/* Stats Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--space-md)',
                    marginBottom: 'var(--space-xl)'
                }}>
                    {/* Total Projects */}
                    <div className="card" style={{ padding: 'var(--space-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <div style={{
                                width: 48, height: 48,
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--color-primary-light)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Video style={{ color: 'var(--color-primary)', width: 24, height: 24 }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700 }}>{stats.total}</div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Total Projects</div>
                            </div>
                        </div>
                    </div>

                    {/* Published */}
                    <div className="card" style={{ padding: 'var(--space-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <div style={{
                                width: 48, height: 48,
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(34, 197, 94, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <CheckCircle2 style={{ color: 'var(--color-success)', width: 24, height: 24 }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700 }}>{stats.published}</div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Published</div>
                            </div>
                        </div>
                    </div>

                    {/* Current Streak */}
                    <div className="card" style={{ padding: 'var(--space-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <div style={{
                                width: 48, height: 48,
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(239, 68, 68, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Flame style={{ color: '#ef4444', width: 24, height: 24 }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700 }}>
                                    {stats.currentStreak}
                                    <span style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-muted)' }}> days</span>
                                </div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Current Streak</div>
                            </div>
                        </div>
                    </div>

                    {/* This Month */}
                    <div className="card" style={{ padding: 'var(--space-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <div style={{
                                width: 48, height: 48,
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(249, 115, 22, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <TrendingUp style={{ color: 'var(--color-primary)', width: 24, height: 24 }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700 }}>{stats.thisMonthPublications}</div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>This Month</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Calendar & Recent */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 'var(--space-lg)' }}>
                    {/* Publication Calendar */}
                    <div className="card" style={{ padding: 'var(--space-lg)' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 'var(--space-lg)'
                        }}>
                            <h2 style={{
                                fontSize: 'var(--font-size-lg)',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-sm)'
                            }}>
                                <Calendar style={{ color: 'var(--color-primary)' }} />
                                Publication Calendar
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <button className="btn btn-icon btn-secondary" onClick={goToPreviousMonth}>
                                    <ChevronLeft />
                                </button>
                                <span style={{
                                    minWidth: 150,
                                    textAlign: 'center',
                                    fontWeight: 600
                                }}>
                                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                </span>
                                <button className="btn btn-icon btn-secondary" onClick={goToNextMonth}>
                                    <ChevronRight />
                                </button>
                            </div>
                        </div>

                        {/* Day Headers */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: 'var(--space-xs)',
                            marginBottom: 'var(--space-sm)'
                        }}>
                            {dayNames.map(day => (
                                <div key={day} style={{
                                    textAlign: 'center',
                                    fontSize: 'var(--font-size-xs)',
                                    color: 'var(--color-text-muted)',
                                    fontWeight: 600,
                                    padding: 'var(--space-xs)'
                                }}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: 'var(--space-xs)'
                        }}>
                            {calendarDays.map((day, index) => {
                                const published = isPublishedDay(day.date);
                                const today = isToday(day.date);

                                return (
                                    <div
                                        key={index}
                                        style={{
                                            aspectRatio: '1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: 'var(--font-size-sm)',
                                            fontWeight: published ? 600 : 400,
                                            color: !day.isCurrentMonth
                                                ? 'var(--color-text-muted)'
                                                : published
                                                    ? 'white'
                                                    : 'var(--color-text-primary)',
                                            background: published
                                                ? 'var(--color-primary)'
                                                : today
                                                    ? 'var(--color-border-light)'
                                                    : 'transparent',
                                            border: today && !published ? '2px solid var(--color-primary)' : 'none',
                                            opacity: day.isCurrentMonth ? 1 : 0.4,
                                            transition: 'all var(--transition-fast)',
                                            cursor: published ? 'pointer' : 'default',
                                        }}
                                        title={published ? 'Published on this day!' : ''}
                                    >
                                        {day.date.getDate()}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div style={{
                            display: 'flex',
                            gap: 'var(--space-lg)',
                            marginTop: 'var(--space-lg)',
                            justifyContent: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                <div style={{
                                    width: 16, height: 16,
                                    borderRadius: 4,
                                    background: 'var(--color-primary)'
                                }} />
                                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                    Published
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                <div style={{
                                    width: 16, height: 16,
                                    borderRadius: 4,
                                    border: '2px solid var(--color-primary)',
                                    background: 'transparent'
                                }} />
                                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                    Today
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Published */}
                    <div className="card" style={{ padding: 'var(--space-lg)' }}>
                        <h2 style={{
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 600,
                            marginBottom: 'var(--space-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-sm)'
                        }}>
                            <BarChart3 style={{ color: 'var(--color-primary)' }} />
                            Recent Videos
                        </h2>

                        {recentPublished.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                color: 'var(--color-text-muted)',
                                padding: 'var(--space-xl)'
                            }}>
                                No published videos yet
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                {recentPublished.map(project => (
                                    <div
                                        key={project.id}
                                        style={{
                                            padding: 'var(--space-md)',
                                            background: 'var(--color-bg-tertiary)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)',
                                        }}
                                    >
                                        <div style={{
                                            fontWeight: 600,
                                            marginBottom: 'var(--space-xs)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {project.title}
                                        </div>
                                        <div style={{
                                            fontSize: 'var(--font-size-xs)',
                                            color: 'var(--color-text-muted)',
                                            marginBottom: 'var(--space-sm)'
                                        }}>
                                            {new Date(project.publishedAt || project.updatedAt).toLocaleDateString()}
                                        </div>

                                        {/* Social Links */}
                                        {project.socialLinks && (
                                            <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                                                {project.socialLinks.youtube && (
                                                    <a
                                                        href={project.socialLinks.youtube}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-secondary"
                                                        style={{ fontSize: 'var(--font-size-xs)', padding: '4px 8px' }}
                                                    >
                                                        YouTube <ExternalLink style={{ width: 12, height: 12 }} />
                                                    </a>
                                                )}
                                                {project.socialLinks.tiktok && (
                                                    <a
                                                        href={project.socialLinks.tiktok}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-secondary"
                                                        style={{ fontSize: 'var(--font-size-xs)', padding: '4px 8px' }}
                                                    >
                                                        TikTok <ExternalLink style={{ width: 12, height: 12 }} />
                                                    </a>
                                                )}
                                                {project.socialLinks.instagram && (
                                                    <a
                                                        href={project.socialLinks.instagram}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-secondary"
                                                        style={{ fontSize: 'var(--font-size-xs)', padding: '4px 8px' }}
                                                    >
                                                        Instagram <ExternalLink style={{ width: 12, height: 12 }} />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Statistics;
