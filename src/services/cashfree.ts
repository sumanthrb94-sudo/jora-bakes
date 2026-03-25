// Cashfree Payment Service — Frontend
// Dynamically loads the Cashfree JS SDK (v3) and handles the payment flow.

const CF_ENV = import.meta.env.VITE_CASHFREE_ENV || 'TEST';
const isTestMode = CF_ENV.toUpperCase() !== 'PRODUCTION';

// ── SDK Loader ───────────────────────────────────────────────────────────────

let sdkLoadPromise: Promise<any> | null = null;

const loadCashfreeSDK = (): Promise<any> => {
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve, reject) => {
    // Already loaded
    if (typeof (window as any).Cashfree === 'function') {
      resolve((window as any).Cashfree);
      return;
    }

    const script = document.createElement('script');
    script.id = 'cashfree-js-sdk';
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;

    script.onload = () => {
      const CF = (window as any).Cashfree;
      if (!CF) {
        sdkLoadPromise = null;
        reject(new Error('Cashfree SDK failed to initialise'));
        return;
      }
      resolve(CF);
    };

    script.onerror = () => {
      sdkLoadPromise = null;
      reject(new Error('Failed to load payment SDK. Please check your connection.'));
    };

    document.head.appendChild(script);
  });

  return sdkLoadPromise;
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface CashfreeOrderRequest {
  orderId: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

export interface CashfreeOrderResponse {
  orderId: string;
  paymentSessionId: string;
  cfOrderId: string;
}

export type PaymentStatus = 'SUCCESS' | 'FAILED' | 'CANCELLED';

// ── API Call ─────────────────────────────────────────────────────────────────

export const createCashfreeOrder = async (
  data: CashfreeOrderRequest
): Promise<CashfreeOrderResponse> => {
  const response = await fetch('/api/cashfree-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Failed to create payment order');
  }

  return response.json();
};

// ── Checkout ─────────────────────────────────────────────────────────────────

export const openCashfreeCheckout = async (
  paymentSessionId: string
): Promise<{ status: PaymentStatus }> => {
  const CashfreeSDK = await loadCashfreeSDK();
  const cashfree = CashfreeSDK({ mode: isTestMode ? 'sandbox' : 'production' });

  return new Promise((resolve, reject) => {
    cashfree
      .checkout({
        paymentSessionId,
        redirectTarget: '_modal',
      })
      .then((result: any) => {
        if (result.error) {
          const msg: string = (result.error.message || '').toLowerCase();
          if (msg.includes('cancel') || msg.includes('close')) {
            resolve({ status: 'CANCELLED' });
          } else {
            reject(new Error(result.error.message || 'Payment failed'));
          }
        } else if (result.paymentDetails || result.redirect) {
          resolve({ status: 'SUCCESS' });
        } else {
          reject(new Error('Unexpected response from payment gateway'));
        }
      })
      .catch((err: any) => reject(err));
  });
};
