/**
 * Scraper API Service
 * Communicates with the Python Flask backend to fetch social media stats.
 */

const API_BASE_URL = 'http://localhost:5000';

/**
 * Check if the scraper API is running.
 * @returns {Promise<boolean>}
 */
export async function isApiAvailable() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

/**
 * Scrape stats from a single URL.
 * @param {string} url - TikTok or Instagram video URL
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function scrapeUrl(url) {
    try {
        const response = await fetch(`${API_BASE_URL}/scrape`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });

        const result = await response.json();
        return result;
    } catch (error) {
        return {
            success: false,
            error: `API Error: ${error.message}. Make sure the scraper API is running (python api.py)`,
        };
    }
}

/**
 * Scrape stats from multiple URLs.
 * @param {string[]} urls - Array of TikTok/Instagram video URLs
 * @returns {Promise<{success: boolean, data?: object[], summary?: object, error?: string}>}
 */
export async function scrapeUrls(urls) {
    try {
        // Filter out empty URLs
        const validUrls = urls.filter(url => url && url.trim());

        if (validUrls.length === 0) {
            return { success: false, error: 'No valid URLs provided' };
        }

        const response = await fetch(`${API_BASE_URL}/scrape/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: validUrls }),
        });

        const result = await response.json();
        return result;
    } catch (error) {
        return {
            success: false,
            error: `API Error: ${error.message}. Make sure the scraper API is running (python api.py)`,
        };
    }
}

/**
 * Get all social links from a project as an array of URLs.
 * @param {object} socialLinks - Project's socialLinks object
 * @returns {string[]} Array of non-empty URLs
 */
export function getSocialUrls(socialLinks) {
    if (!socialLinks) return [];

    // Only TikTok and Instagram are supported
    const supportedLinks = ['tiktok', 'instagram'];

    return supportedLinks
        .map(key => socialLinks[key])
        .filter(url => url && url.trim());
}

/**
 * Calculate aggregated stats from multiple results.
 * @param {object[]} results - Array of scrape results
 * @returns {{views: number, likes: number, comments: number, shares: number}}
 */
export function aggregateStats(results) {
    return {
        views: results.reduce((sum, r) => sum + (r.views || 0), 0),
        likes: results.reduce((sum, r) => sum + (r.likes || 0), 0),
        comments: results.reduce((sum, r) => sum + (r.comments || 0), 0),
        shares: results.reduce((sum, r) => sum + (r.shares || 0), 0),
    };
}
