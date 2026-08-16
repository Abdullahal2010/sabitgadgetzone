import { NextRequest, NextResponse } from 'next/server';

// DeshiPay's docs don't define a signed-webhook mechanism (no HMAC/secret
// to prove this call actually came from them), so this handler treats
// the payload as an untrusted "go check" nudge only. It never marks
// anything paid itself — it extracts the order/transaction reference and
// re-runs the same server-to-server verification /api/checkout/verify
// uses, which is the only place that trusts a payment as real.
export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true }); // nothing usable — ack and move on
  }

  const transactionId = body.transaction_id || body.transactionId;
  let orderId = body?.metadata?.orderId || body?.meta_data?.orderId;

  if (!transactionId || !orderId) {
    return NextResponse.json({ ok: true }); // can't act on this payload; ack to stop retries
  }

  const origin = process.env.NEXTAUTH_URL || request.nextUrl.origin;
  await fetch(`${origin}/api/checkout/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, transactionId })
  }).catch(() => {}); // best-effort — the success page will also trigger verify

  return NextResponse.json({ ok: true });
}
