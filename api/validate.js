// ═══════════════════════════════════════════════════════════════
// LICENSE VALIDATION API - Quarterly Estimated Tax Calculator 2026
// Tries GitHub first (main & master branches), falls back to embedded licenses
// ═══════════════════════════════════════════════════════════════

const GITHUB_URLS = [
    'https://raw.githubusercontent.com/towfiqul101/quarterly-tax-calculator-licenses/main/licenses.json',
    'https://raw.githubusercontent.com/towfiqul101/quarterly-tax-calculator-licenses/master/licenses.json'
];

// Fallback licenses - used if GitHub is unreachable
const FALLBACK_LICENSES = [
    {
        "key": "QETC-demo123xyz",
        "client": "Demo Tax Services",
        "domain": "demo.com",
        "logo": "",
        "primaryColor": "#4f46e5",
        "webhook": "",
        "ctaUrl": "#",
        "ctaText": "📞 Schedule a Tax Consultation",
        "expires": "2026-12-31",
        "status": "active"
    },
    {
        "key": "QETC-mcneal2026",
        "client": "McNeal Tax & Associates",
        "domain": "mcnealtax.com",
        "logo": "",
        "primaryColor": "#D4AF37",
        "webhook": "https://services.leadconnectorhq.com/hooks/YOUR_WEBHOOK_ID",
        "ctaUrl": "https://mcnealtax.com/schedule",
        "ctaText": "📞 Book Your Free Consultation",
        "expires": "2026-12-31",
        "status": "active"
    },
    {
        "key": "QETC-swiftexpress2026",
        "client": "Swift Express Tax",
        "domain": "swiftexpresstax.com",
        "logo": "",
        "primaryColor": "#1e40af",
        "webhook": "https://services.leadconnectorhq.com/hooks/YOUR_WEBHOOK_ID",
        "ctaUrl": "https://swiftexpresstax.com/file-today",
        "ctaText": "📞 File Your Taxes Today",
        "expires": "2026-12-31",
        "status": "active"
    },
    {
        "key": "QETC-dixon2026",
        "client": "Dixon Financial",
        "domain": "dixonfinancial.com",
        "logo": "",
        "primaryColor": "#047857",
        "webhook": "https://services.leadconnectorhq.com/hooks/YOUR_WEBHOOK_ID",
        "ctaUrl": "https://dixonfinancial.com/contact",
        "ctaText": "📞 Get Expert Tax Help",
        "expires": "2026-12-31",
        "status": "active"
    }
];

// Cache
let licenseCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000;

async function fetchLicenses() {
    const now = Date.now();
    if (licenseCache && (now - cacheTimestamp) < CACHE_DURATION) {
        return licenseCache;
    }

    // Try each GitHub URL
    for (const url of GITHUB_URLS) {
        try {
            const response = await fetch(url, {
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (response.ok) {
                const licenses = await response.json();
                licenseCache = licenses;
                cacheTimestamp = now;
                console.log('Licenses loaded from GitHub:', url);
                return licenses;
            }
        } catch (e) {
            console.warn('Failed to fetch from:', url, e.message);
        }
    }

    // Fallback to embedded licenses
    console.warn('Using fallback embedded licenses');
    licenseCache = FALLBACK_LICENSES;
    cacheTimestamp = now;
    return FALLBACK_LICENSES;
}

module.exports = async (req, res) => {
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

        if (license.status !== 'active') {
            return res.status(403).json({
                valid: false,
                message: 'This license has been deactivated. Please contact your tax professional.'
            });
        }

        if (license.expires) {
            const expiryDate = new Date(license.expires);
            if (expiryDate < new Date()) {
                return res.status(403).json({
                    valid: false,
                    message: 'This license has expired. Please contact your tax professional for renewal.'
                });
            }
        }

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
