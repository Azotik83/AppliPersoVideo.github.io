import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Calendar({ projects }) {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const getProjectsForDay = (day) => {
        const dateStr = new Date(year, month, day).toISOString().split('T')[0];
        return projects.filter(p => {
            if (!p.scheduledDate) return false;
            return p.scheduledDate.split('T')[0] === dateStr;
        });
    };

    const today = new Date();
    const isToday = (day) => {
        return today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;
    };

    const renderDays = () => {
        const days = [];

        // Empty cells for days before the first day of month
        for (let i = 0; i < startingDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty" />);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayProjects = getProjectsForDay(day);
            days.push(
                <div
                    key={day}
                    className={`calendar-day ${isToday(day) ? 'today' : ''}`}
                >
                    <span className="calendar-day-number">{day}</span>
                    <div className="calendar-day-projects">
                        {dayProjects.slice(0, 3).map(p => (
                            <div
                                key={p.id}
                                className="calendar-project"
                                onClick={() => navigate(`/project/${p.id}`)}
                                title={p.title}
                            >
                                {p.title}
                            </div>
                        ))}
                        {dayProjects.length > 3 && (
                            <div className="calendar-project-more">
                                +{dayProjects.length - 3} more
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return days;
    };

    const scheduledProjects = projects.filter(p => p.scheduledDate);

    return (
        <div className="page-container">
            <header style={{ marginBottom: 'var(--space-lg)' }}>
                <h1 className="header-title">Calendar</h1>
            </header>

            <div className="card" style={{ padding: 'var(--space-lg)' }}>
                {/* Calendar Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-lg)'
                }}>
                    <button className="btn btn-icon btn-secondary" onClick={prevMonth}>
                        <ChevronLeft />
                    </button>
                    <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600 }}>
                        {monthNames[month]} {year}
                    </h2>
                    <button className="btn btn-icon btn-secondary" onClick={nextMonth}>
                        <ChevronRight />
                    </button>
                </div>

                {/* Day Headers */}
                <div className="calendar-grid calendar-header">
                    {dayNames.map(day => (
                        <div key={day} className="calendar-day-name">{day}</div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="calendar-grid">
                    {renderDays()}
                </div>
            </div>

            {/* Upcoming Section */}
            {scheduledProjects.length > 0 && (
                <div style={{ marginTop: 'var(--space-lg)' }}>
                    <h3 style={{
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: 600,
                        marginBottom: 'var(--space-md)'
                    }}>
                        Scheduled Projects
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {scheduledProjects
                            .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
                            .map(p => (
                                <div
                                    key={p.id}
                                    className="card"
                                    style={{
                                        padding: 'var(--space-md)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-md)',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => navigate(`/project/${p.id}`)}
                                >
                                    <CalendarIcon style={{ width: 20, height: 20, color: 'var(--color-primary)' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500 }}>{p.title}</div>
                                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                                            {new Date(p.scheduledDate).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                    <span className={`badge badge-${p.status === 'in_progress' ? 'in-progress' : p.status}`}>
                                        {p.status.replace('_', ' ')}
                                    </span>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}

            <style>{`
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: var(--color-border);
        }
        .calendar-header {
          background: transparent;
          gap: 0;
          margin-bottom: 1px;
        }
        .calendar-day-name {
          padding: var(--space-sm);
          text-align: center;
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-text-muted);
          background: var(--color-bg-secondary);
        }
        .calendar-day {
          min-height: 100px;
          padding: var(--space-sm);
          background: var(--color-bg-secondary);
          position: relative;
        }
        .calendar-day.empty {
          background: var(--color-bg-tertiary);
        }
        .calendar-day.today .calendar-day-number {
          background: var(--color-primary);
          color: white;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .calendar-day-number {
          font-size: var(--font-size-sm);
          font-weight: 500;
          margin-bottom: var(--space-xs);
        }
        .calendar-day-projects {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .calendar-project {
          font-size: 11px;
          padding: 2px 4px;
          background: var(--color-primary-light);
          color: var(--color-primary);
          border-radius: 3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          cursor: pointer;
        }
        .calendar-project:hover {
          background: var(--color-primary);
          color: white;
        }
        .calendar-project-more {
          font-size: 11px;
          color: var(--color-text-muted);
        }
        @media (max-width: 768px) {
          .calendar-day {
            min-height: 60px;
            padding: 4px;
          }
          .calendar-day-name {
            font-size: 11px;
          }
          .calendar-project {
            display: none;
          }
          .calendar-day-projects {
            position: absolute;
            bottom: 4px;
            left: 50%;
            transform: translateX(-50%);
          }
          .calendar-day-projects::after {
            content: '';
            display: block;
            width: 6px;
            height: 6px;
            background: var(--color-primary);
            border-radius: 50%;
          }
        }
      `}</style>
        </div>
    );
}

export default Calendar;
