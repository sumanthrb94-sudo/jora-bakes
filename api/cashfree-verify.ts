// Vercel Serverless Function — Cashfree Payment Verification
// Calls Cashfree API to confirm actual payment status before order is saved as paid.

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId } = req.body || {};

  if (!orderId) {
    return res.status(400).json({ error: 'Missing orderId' });
  }

  const APP_ID = process.env.CASHFREE_APP_ID;
  const SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
  const env = (process.env.CASHFREE_ENV || 'TEST').toUpperCase();
  const isTest = env !== 'PRODUCTION';

  if (!APP_ID || !SECRET_KEY) {
    return res.status(500).json({ error: 'Payment gateway credentials not configured' });
  }

  const baseUrl = isTest
    ? 'https://sandbox.cashfree.com/pg'
    : 'https://api.cashfree.com/pg';

  try {
    const cfResponse = await fetch(`${baseUrl}/orders/${orderId}`, {
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': APP_ID,
        'x-client-secret': SECRET_KEY,
      },
    });

    const data = await cfResponse.json();

    if (!cfResponse.ok) {
      console.error('[Cashfree] Verify failed:', data);
      return res.status(cfResponse.status).json({ error: data.message || 'Verification failed' });
    }

    return res.status(200).json({
      isPaid: data.order_status === 'PAID',
      status: data.order_status, // PAID | ACTIVE | EXPIRED | CANCELLED
    });
  } catch (error: any) {
    console.error('[Cashfree] Verify error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
