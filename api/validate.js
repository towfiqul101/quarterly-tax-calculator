// License Validation API
const GITHUB_LICENSES_URL = 'https://raw.githubusercontent.com/towfiqul101/quarterly-tax-calculator-licenses/main/licenses.json';

export default async function handler(req, res) {
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
            error: 'MISSING_KEY',
            message: 'No license key provided.'
        });
    }

    try {
        const response = await fetch(GITHUB_LICENSES_URL, {
            headers: { 'Cache-Control': 'no-cache' }
        });

        if (!response.ok) {
            return res.status(500).json({
                valid: false,
                error: 'LICENSE_FETCH_ERROR',
                message: 'Unable to validate license.'
            });
        }

        const licenses = await response.json();
        const license = licenses.find(l => l.key === key);

        if (!license) {
            return res.status(401).json({
                valid: false,
                error: 'INVALID_LICENSE',
                message: 'License key not found.'
            });
        }

        if (license.status !== 'active') {
            return res.status(401).json({
                valid: false,
                error: 'LICENSE_INACTIVE',
                message: 'License is not active.'
            });
        }

        if (license.expires && new Date(license.expires) < new Date()) {
            return res.status(401).json({
                valid: false,
                error: 'LICENSE_EXPIRED',
                message: 'License has expired.'
            });
        }

        return res.status(200).json({
            valid: true,
            config: {
                client: license.client,
                logo: license.logo || null,
                primaryColor: license.primaryColor || '#4f46e5',
                webhook: license.webhook || null,
                ctaUrl: license.ctaUrl || '#',
                ctaText: license.ctaText || '📞 Schedule a Consultation'
            }
        });

    } catch (error) {
        console.error('Validation error:', error);
        return res.status(500).json({
            valid: false,
            error: 'SERVER_ERROR',
            message: 'Validation error occurred.'
        });
    }
}
