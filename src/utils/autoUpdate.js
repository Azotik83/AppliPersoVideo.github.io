/**
 * Auto-Update Service
 * Manages automatic daily fetching of social media stats.
 */

import { scrapeUrls, getSocialUrls, isApiAvailable } from './scraperApi';

const LAST_FETCH_KEY = 'video_manager_last_stats_fetch';
const FETCH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get the timestamp of the last stats fetch.
 * @returns {number|null} Timestamp or null if never fetched
 */
export function getLastFetchTime() {
    const stored = localStorage.getItem(LAST_FETCH_KEY);
    return stored ? parseInt(stored, 10) : null;
}

/**
 * Set the last fetch time to now.
 */
export function setLastFetchTime() {
    localStorage.setItem(LAST_FETCH_KEY, Date.now().toString());
}

/**
 * Check if it's time to fetch stats (24h passed since last fetch).
 * @returns {boolean}
 */
export function shouldFetchStats() {
    const lastFetch = getLastFetchTime();
    if (!lastFetch) return true; // Never fetched

    const elapsed = Date.now() - lastFetch;
    return elapsed >= FETCH_INTERVAL_MS;
}

/**
 * Get human-readable time since last fetch.
 * @returns {string}
 */
export function getTimeSinceLastFetch() {
    const lastFetch = getLastFetchTime();
    if (!lastFetch) return 'Never';

    const elapsed = Date.now() - lastFetch;
    const hours = Math.floor(elapsed / (60 * 60 * 1000));
    const minutes = Math.floor((elapsed % (60 * 60 * 1000)) / (60 * 1000));

    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    if (hours > 0) {
        return `${hours}h ${minutes}m ago`;
    }
    return `${minutes}m ago`;
}

/**
 * Auto-fetch stats for all published projects with social links.
 * @param {Array} projects - List of projects
 * @param {Function} onUpdateProject - Function to update a project
 * @param {Function} onProgress - Callback for progress updates (current, total)
 * @returns {Promise<{success: boolean, updated: number, error?: string}>}
 */
export async function autoFetchStats(projects, onUpdateProject, onProgress = () => { }) {
    // Check if API is available
    const apiAvailable = await isApiAvailable();
    if (!apiAvailable) {
        return {
            success: false,
            updated: 0,
            error: 'API not available. Start it with: cd scraper && python api.py'
        };
    }

    // Get published projects with TikTok/Instagram links
    const projectsWithLinks = projects.filter(p => {
        if (p.status !== 'published') return false;
        const urls = getSocialUrls(p.socialLinks);
        return urls.length > 0;
    });

    if (projectsWithLinks.length === 0) {
        setLastFetchTime(); // Mark as done even with nothing to fetch
        return { success: true, updated: 0 };
    }

    let updatedCount = 0;

    try {
        for (let i = 0; i < projectsWithLinks.length; i++) {
            const project = projectsWithLinks[i];
            const urls = getSocialUrls(project.socialLinks);

            onProgress(i + 1, projectsWithLinks.length);

            const result = await scrapeUrls(urls);

            if (result.success && result.summary) {
                await onUpdateProject(project.id, {
                    stats: {
                        views: result.summary.total_views,
                        likes: result.summary.total_likes,
                        comments: result.summary.total_comments,
                    }
                });
                updatedCount++;
            }

            // Small delay between projects
            if (i < projectsWithLinks.length - 1) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        setLastFetchTime();
        return { success: true, updated: updatedCount };

    } catch (error) {
        return { success: false, updated: updatedCount, error: error.message };
    }
}
