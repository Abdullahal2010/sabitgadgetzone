import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <div className="rounded-xl2 border border-border bg-white p-10 text-center">
      <h1 className="text-lg font-extrabold text-navy">Payment cancelled</h1>
      <p className="mt-1 text-muted">No charge was made. Your cart is still saved.</p>
      <Link href="/cart" className="mt-5 inline-block rounded-lg bg-brand px-5 py-2 font-semibold text-white">
        Back to cart
      </Link>
    </div>
  );
}
