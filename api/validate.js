// ═══════════════════════════════════════════════════════════════
// LICENSE VALIDATION API - Quarterly Estimated Tax Calculator 2026
// Fetches licenses from GitHub repo for zero-downtime client management
// ═══════════════════════════════════════════════════════════════

// ⚠️ IMPORTANT: Replace YOUR_GITHUB_USERNAME with your actual GitHub username
const GITHUB_LICENSES_URL = 'https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/quarterly-tax-calculator-licenses/main/licenses.json';

// Cache licenses for 5 minutes to reduce GitHub API calls
let licenseCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchLicenses() {
    const now = Date.now();
    if (licenseCache && (now - cacheTimestamp) < CACHE_DURATION) {
        return licenseCache;
    }

    try {
        const response = await fetch(GITHUB_LICENSES_URL, {
            headers: { 'Cache-Control': 'no-cache' }
        });

        if (!response.ok) {
            throw new Error(`GitHub fetch failed: ${response.status}`);
        }

        const licenses = await response.json();
        licenseCache = licenses;
        cacheTimestamp = now;
        return licenses;
    } catch (error) {
        console.error('Error fetching licenses:', error);
        // Return cached data if available, even if stale
        if (licenseCache) return licenseCache;
        throw error;
    }
}

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { key } = req.query;

    if (!key) {
        return res.status(400).json({
            valid: false,
            message: 'License key is required. Please use the link provided by your tax professional.'
        });
    }

    try {
        const licenses = await fetchLicenses();
        const license = licenses.find(l => l.key === key);

        if (!license) {
            return res.status(403).json({
                valid: false,
                message: 'Invalid license key. Please contact your tax professional for the correct link.'
            });
        }

        // Check if license is active
        if (license.status !== 'active') {
            return res.status(403).json({
                valid: false,
                message: 'This license has been deactivated. Please contact your tax professional.'
            });
        }

        // Check expiration
        if (license.expires) {
            const expiryDate = new Date(license.expires);
            if (expiryDate < new Date()) {
                return res.status(403).json({
                    valid: false,
                    message: 'This license has expired. Please contact your tax professional for renewal.'
                });
            }
        }

        // License is valid - return branding data
        return res.status(200).json({
            valid: true,
            license: {
                client: license.client,
                logo: license.logo || '',
                primaryColor: license.primaryColor || '#4f46e5',
                webhook: license.webhook || '',
                ctaUrl: license.ctaUrl || '#',
                ctaText: license.ctaText || '📞 Schedule a Tax Consultation',
                domain: license.domain || ''
            }
        });

    } catch (error) {
        console.error('License validation error:', error);
        return res.status(500).json({
            valid: false,
            message: 'Unable to validate license at this time. Please try again.'
        });
    }
};
