// Vercel Serverless Function — Cashfree Order Creation
// Keeps secret key server-side; safe for test and production environments.

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, amount, customerName, customerPhone, customerEmail } = req.body || {};

  if (!orderId || !amount) {
    return res.status(400).json({ error: 'Missing required fields: orderId, amount' });
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
    const cfResponse = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': APP_ID,
        'x-client-secret': SECRET_KEY,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: parseFloat(Number(amount).toFixed(2)),
        order_currency: 'INR',
        customer_details: {
          customer_id: String(customerPhone || customerEmail || orderId).slice(0, 50),
          customer_name: customerName || 'Customer',
          customer_phone: customerPhone || '9999999999',
          customer_email: customerEmail || 'orders@jorabakes.com',
        },
        order_meta: {
          return_url: `${process.env.APP_URL || 'https://jorabakes.com'}/orders?order_id={order_id}`,
        },
      }),
    });

    const data = await cfResponse.json();

    if (!cfResponse.ok) {
      console.error('[Cashfree] Order creation failed:', data);
      return res.status(cfResponse.status).json({
        error: data.message || 'Failed to create payment order',
      });
    }

    return res.status(200).json({
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      cfOrderId: data.cf_order_id,
    });
  } catch (error: any) {
    console.error('[Cashfree] Unexpected error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
