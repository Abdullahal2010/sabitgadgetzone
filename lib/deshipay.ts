/**
 * Thin client for the DeshiPay (mxpaybd) payment API.
 * Docs: https://deshipay.themedokan.com/developers
 *
 * Security note: DeshiPay does not document a signed-webhook mechanism
 * (no HMAC/secret to prove a callback actually came from them). Because
 * of that, `verifyPayment` — a direct server-to-server call keyed by
 * transaction_id — is the ONLY thing this app trusts to mark an order
 * paid. The webhook and the browser redirect are both treated as mere
 * hints to go check, never as proof by themselves.
 */

const BASE_URL = 'https://paydeshipay.themedokan.com/api';

function apiKey() {
  const key = process.env.DESHIPAY_API_KEY;
  if (!key) throw new Error('DESHIPAY_API_KEY is not set');
  return key;
}

export interface CreatePaymentParams {
  cusName: string;
  cusEmail: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
  webhookUrl?: string;
  metaData?: Record<string, unknown>;
}

export interface CreatePaymentResult {
  status: boolean;
  message: string;
  payment_url?: string;
}

export async function createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
  // DeshiPay's PDF docs table calls this field `meta_data` (stringified)
  // and lists cus_name/cus_email as required — but a confirmed-working
  // sample request from the dashboard sends the field as `metadata`
  // (a raw JSON object, not a string) and omits cus_name/cus_email
  // entirely. We match the working sample for metadata/amount, while
  // still sending cus_name/cus_email since the docs list them as
  // required and including them can't hurt.
  const res = await fetch(`${BASE_URL}/payment/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API-KEY': apiKey()
    },
    body: JSON.stringify({
      cus_name: params.cusName,
      cus_email: params.cusEmail,
      // Docs: "skip the trailing zeros in case the amount is a natural
      // number" — and the confirmed sample sends amount as a string.
      amount: Number.isInteger(params.amount)
        ? String(params.amount)
        : String(Number(params.amount.toFixed(2))),
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      ...(params.webhookUrl ? { webhook_url: params.webhookUrl } : {}),
      ...(params.metaData ? { metadata: params.metaData } : {})
    })
  });

  return res.json();
}

export type VerifyStatus = 'COMPLETED' | 'PENDING' | 'ERROR';

export interface VerifyPaymentResult {
  status: VerifyStatus | false;
  message?: string;
  cus_name?: string;
  cus_email?: string;
  amount?: string;
  transaction_id?: string;
  metadata?: Record<string, unknown>;
}

export async function verifyPayment(transactionId: string): Promise<VerifyPaymentResult> {
  const res = await fetch(`${BASE_URL}/payment/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API-KEY': apiKey()
    },
    body: JSON.stringify({ transaction_id: transactionId })
  });

  return res.json();
}
