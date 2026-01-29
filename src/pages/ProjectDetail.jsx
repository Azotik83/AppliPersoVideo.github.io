import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, FileText, Film, Video, Music,
    Trash2, Check, Calendar as CalendarIcon, ExternalLink,
    Youtube, Instagram, Twitter, Link as LinkIcon, RefreshCw, Loader2
} from 'lucide-react';
import MediaPlayer from '../components/MediaPlayer/MediaPlayer';
import { getProject } from '../utils/db';
import { scrapeUrls, getSocialUrls } from '../utils/scraperApi';

// TikTok icon (not in lucide)
const TikTokIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
);

const TABS = [
    { id: 'script', label: 'Script', icon: FileText },
    { id: 'scenario', label: 'Scenario', icon: Film },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'audio', label: 'Audio', icon: Music },
];

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'published', label: 'Published' },
];

const SOCIAL_PLATFORMS = [
    { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/watch?v=...' },
    { key: 'tiktok', label: 'TikTok', icon: TikTokIcon, placeholder: 'https://tiktok.com/@user/video/...' },
    { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/reel/...' },
    { key: 'twitter', label: 'X / Twitter', icon: Twitter, placeholder: 'https://x.com/user/status/...' },
    { key: 'other', label: 'Other', icon: LinkIcon, placeholder: 'https://...' },
];

function ProjectDetail({ onUpdate, onDelete }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('script');
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingStats, setIsFetchingStats] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    useEffect(() => {
        loadProject();
    }, [id]);

    const loadProject = async () => {
        try {
            const data = await getProject(id);
            if (data) {
                // Ensure socialLinks exists for older projects
                if (!data.socialLinks) {
                    data.socialLinks = { youtube: '', tiktok: '', instagram: '', twitter: '', other: '' };
                }
                setProject(data);
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error('Failed to load project:', error);
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (updates) => {
        setIsSaving(true);
        try {
            const updated = await onUpdate(id, updates);
            setProject(updated);
        } catch (error) {
            console.error('Failed to update:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this project?')) {
            await onDelete(id);
            navigate('/');
        }
    };

    const handleChecklistToggle = (checkId) => {
        const updatedChecklist = project.checklist.map(item =>
            item.id === checkId ? { ...item, completed: !item.completed } : item
        );
        handleUpdate({ checklist: updatedChecklist });
    };

    const handleAddVideoFile = (file) => {
        handleUpdate({ videoFiles: [...project.videoFiles, file] });
    };

    const handleRemoveVideoFile = (index) => {
        handleUpdate({ videoFiles: project.videoFiles.filter((_, i) => i !== index) });
    };

    const handleAddAudioFile = (file) => {
        handleUpdate({ audioFiles: [...project.audioFiles, file] });
    };

    const handleRemoveAudioFile = (index) => {
        handleUpdate({ audioFiles: project.audioFiles.filter((_, i) => i !== index) });
    };

    const handleSocialLinkChange = (platform, value) => {
        handleUpdate({
            socialLinks: {
                ...project.socialLinks,
                [platform]: value
            }
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!project) return null;

    const completedCount = project.checklist.filter(i => i.completed).length;
    const totalCount = project.checklist.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="page-container">
            {/* Header */}
            <header style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                    <button className="btn btn-icon btn-secondary" onClick={() => navigate('/')}>
                        <ArrowLeft />
                    </button>
                    <input
                        type="text"
                        value={project.title}
                        onChange={(e) => handleUpdate({ title: e.target.value })}
                        className="form-input"
                        style={{
                            fontSize: 'var(--font-size-xl)',
                            fontWeight: 600,
                            background: 'transparent',
                            border: 'none',
                            padding: 0,
                            flex: 1
                        }}
                    />
                    <span className={`badge badge-${project.status === 'in_progress' ? 'in-progress' : project.status}`}>
                        {STATUS_OPTIONS.find(s => s.value === project.status)?.label}
                    </span>
                    <button className="btn btn-icon btn-secondary" onClick={handleDelete} title="Delete project">
                        <Trash2 />
                    </button>
                </div>
            </header>

            <div className="project-detail">
                {/* Main Content */}
                <div className="project-main">
                    {/* Tabs */}
                    <div className="tabs">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <tab.icon />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="tab-content">
                        {activeTab === 'script' && (
                            <div>
                                <textarea
                                    className="form-input form-textarea"
                                    placeholder="Write your script here..."
                                    value={project.script}
                                    onChange={(e) => handleUpdate({ script: e.target.value })}
                                    style={{ minHeight: '400px' }}
                                />
                            </div>
                        )}

                        {activeTab === 'scenario' && (
                            <div>
                                <textarea
                                    className="form-input form-textarea"
                                    placeholder="Describe your scenes and shots here..."
                                    value={project.scenario}
                                    onChange={(e) => handleUpdate({ scenario: e.target.value })}
                                    style={{ minHeight: '400px' }}
                                />
                            </div>
                        )}

                        {activeTab === 'video' && (
                            <MediaPlayer
                                files={project.videoFiles}
                                type="video"
                                onAddFile={handleAddVideoFile}
                                onRemoveFile={handleRemoveVideoFile}
                            />
                        )}

                        {activeTab === 'audio' && (
                            <MediaPlayer
                                files={project.audioFiles}
                                type="audio"
                                onAddFile={handleAddAudioFile}
                                onRemoveFile={handleRemoveAudioFile}
                            />
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="project-sidebar">
                    {/* Status */}
                    <div className="sidebar-section">
                        <h3 className="sidebar-section-title">Status</h3>
                        <select
                            className="form-input"
                            value={project.status}
                            onChange={(e) => handleUpdate({ status: e.target.value })}
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Social Links */}
                    <div className="sidebar-section">
                        <h3 className="sidebar-section-title">Video Links</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {SOCIAL_PLATFORMS.map(platform => {
                                const Icon = platform.icon;
                                const hasLink = project.socialLinks?.[platform.key];
                                return (
                                    <div key={platform.key}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-xs)',
                                            marginBottom: 'var(--space-xs)'
                                        }}>
                                            <Icon style={{
                                                width: 16,
                                                height: 16,
                                                color: hasLink ? 'var(--color-primary)' : 'var(--color-text-muted)'
                                            }} />
                                            <span style={{
                                                fontSize: 'var(--font-size-xs)',
                                                color: 'var(--color-text-secondary)'
                                            }}>
                                                {platform.label}
                                            </span>
                                            {hasLink && (
                                                <a
                                                    href={project.socialLinks[platform.key]}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ marginLeft: 'auto' }}
                                                    title="Open link"
                                                >
                                                    <ExternalLink style={{
                                                        width: 14,
                                                        height: 14,
                                                        color: 'var(--color-primary)'
                                                    }} />
                                                </a>
                                            )}
                                        </div>
                                        <input
                                            type="url"
                                            className="form-input"
                                            placeholder={platform.placeholder}
                                            value={project.socialLinks?.[platform.key] || ''}
                                            onChange={(e) => handleSocialLinkChange(platform.key, e.target.value)}
                                            style={{ fontSize: 'var(--font-size-xs)' }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Video Stats */}
                    <div className="sidebar-section">
                        <h3 className="sidebar-section-title">Video Stats</h3>

                        {/* Fetch Stats Button */}
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginBottom: 'var(--space-md)' }}
                            onClick={async () => {
                                const urls = getSocialUrls(project.socialLinks);
                                if (urls.length === 0) {
                                    setFetchError('Add TikTok or Instagram links first');
                                    return;
                                }
                                setIsFetchingStats(true);
                                setFetchError(null);
                                try {
                                    const result = await scrapeUrls(urls);
                                    if (result.success && result.summary) {
                                        await handleUpdate({
                                            stats: {
                                                views: result.summary.total_views,
                                                likes: result.summary.total_likes,
                                                comments: result.summary.total_comments,
                                            }
                                        });
                                    } else {
                                        setFetchError(result.error || 'Failed to fetch stats');
                                    }
                                } catch (error) {
                                    setFetchError(error.message);
                                } finally {
                                    setIsFetchingStats(false);
                                }
                            }}
                            disabled={isFetchingStats}
                        >
                            {isFetchingStats ? (
                                <><Loader2 className="animate-spin" style={{ width: 16, height: 16 }} /> Fetching...</>
                            ) : (
                                <><RefreshCw style={{ width: 16, height: 16 }} /> Fetch Stats</>
                            )}
                        </button>

                        {fetchError && (
                            <div style={{
                                padding: 'var(--space-sm)',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: 'var(--radius-sm)',
                                color: '#ef4444',
                                fontSize: 'var(--font-size-xs)',
                                marginBottom: 'var(--space-md)'
                            }}>
                                {fetchError}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-xs)',
                                    fontSize: 'var(--font-size-xs)',
                                    color: 'var(--color-text-secondary)',
                                    marginBottom: 'var(--space-xs)'
                                }}>
                                    👁️ Views
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    className="form-input"
                                    placeholder="0"
                                    value={project.stats?.views || 0}
                                    onChange={(e) => handleUpdate({
                                        stats: { ...project.stats, views: parseInt(e.target.value) || 0 }
                                    })}
                                />
                            </div>
                            <div>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-xs)',
                                    fontSize: 'var(--font-size-xs)',
                                    color: 'var(--color-text-secondary)',
                                    marginBottom: 'var(--space-xs)'
                                }}>
                                    ❤️ Likes
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    className="form-input"
                                    placeholder="0"
                                    value={project.stats?.likes || 0}
                                    onChange={(e) => handleUpdate({
                                        stats: { ...project.stats, likes: parseInt(e.target.value) || 0 }
                                    })}
                                />
                            </div>
                            <div>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-xs)',
                                    fontSize: 'var(--font-size-xs)',
                                    color: 'var(--color-text-secondary)',
                                    marginBottom: 'var(--space-xs)'
                                }}>
                                    💬 Comments
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    className="form-input"
                                    placeholder="0"
                                    value={project.stats?.comments || 0}
                                    onChange={(e) => handleUpdate({
                                        stats: { ...project.stats, comments: parseInt(e.target.value) || 0 }
                                    })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="sidebar-section">
                        <h3 className="sidebar-section-title">Details</h3>
                        <div className="meta-item">
                            <span className="meta-label">Created</span>
                            <span>{formatDate(project.createdAt)}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Updated</span>
                            <span>{formatDate(project.updatedAt)}</span>
                        </div>
                        {project.publishedAt && (
                            <div className="meta-item">
                                <span className="meta-label">Published</span>
                                <span>{formatDate(project.publishedAt)}</span>
                            </div>
                        )}
                        <div className="meta-item">
                            <span className="meta-label">Videos</span>
                            <span>{project.videoFiles.length}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Audio</span>
                            <span>{project.audioFiles.length}</span>
                        </div>
                    </div>

                    {/* Scheduled Date */}
                    <div className="sidebar-section">
                        <h3 className="sidebar-section-title">Schedule</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <CalendarIcon style={{ width: 18, height: 18, color: 'var(--color-text-muted)' }} />
                            <input
                                type="date"
                                className="form-input"
                                value={project.scheduledDate ? project.scheduledDate.split('T')[0] : ''}
                                onChange={(e) => handleUpdate({
                                    scheduledDate: e.target.value ? new Date(e.target.value).toISOString() : null
                                })}
                            />
                        </div>
                    </div>

                    {/* Progress Checklist */}
                    <div className="sidebar-section">
                        <h3 className="sidebar-section-title">Progress ({progressPercent}%)</h3>
                        <div style={{
                            height: 4,
                            background: 'var(--color-border)',
                            borderRadius: 2,
                            marginBottom: 'var(--space-md)',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${progressPercent}%`,
                                background: 'var(--color-primary)',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                        {project.checklist.map(item => (
                            <div
                                key={item.id}
                                className="checklist-item"
                                onClick={() => handleChecklistToggle(item.id)}
                            >
                                <div className={`checklist-checkbox ${item.completed ? 'checked' : ''}`}>
                                    {item.completed && <Check />}
                                </div>
                                <span className={`checklist-text ${item.completed ? 'completed' : ''}`}>
                                    {item.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>

            {/* Saving indicator */}
            {isSaving && (
                <div style={{
                    position: 'fixed',
                    bottom: 'var(--space-lg)',
                    right: 'var(--space-lg)',
                    background: 'var(--color-bg-secondary)',
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-muted)'
                }}>
                    Saving...
                </div>
            )}
        </div>
    );
}

export default ProjectDetail;
