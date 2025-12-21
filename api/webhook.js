// Webhook forwarding API - Sends data to GHL from server (no CORS issues)

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { webhookUrl, data } = req.body;

        if (!webhookUrl || !data) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing webhookUrl or data' 
            });
        }

        // Send to GHL webhook from server
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const responseText = await response.text();

        return res.status(200).json({ 
            success: true, 
            status: response.status,
            message: 'Webhook sent successfully'
        });

    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}
